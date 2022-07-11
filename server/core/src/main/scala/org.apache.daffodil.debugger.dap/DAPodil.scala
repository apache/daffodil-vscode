/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.daffodil.debugger.dap

import cats.data._
import cats.effect._
import cats.effect.std._
import cats.Show
import cats.syntax.all._
import com.microsoft.java.debug.core.protocol._
import com.microsoft.java.debug.core.protocol.Messages._
import com.microsoft.java.debug.core.protocol.Events.DebugEvent
import com.microsoft.java.debug.core.protocol.Requests._
import com.microsoft.java.debug.core.protocol.Responses._
import com.monovore.decline.Opts
import com.monovore.decline.effect.CommandIOApp
import fs2._
import fs2.concurrent.Signal
import java.io._
import java.net._
import java.nio.file.Path
import java.nio.file.Paths
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

import scala.collection.JavaConverters._
import scala.concurrent.duration._

import logging._

/** Communication interface to a DAP server while in a connected session. */
trait DAPSession[Req, Res, Ev] {
  def requests: Stream[IO, Req]

  def sendResponse(response: Res): IO[Unit]
  def sendEvent(event: Ev): IO[Unit]
}

object DAPSession {
  implicit val logger: Logger[IO] = Slf4jLogger.getLogger

  def apply(server: AbstractProtocolServer, rs: Stream[IO, Request]): DAPSession[Request, Response, DebugEvent] =
    new DAPSession[Request, Response, DebugEvent] {
      def requests: Stream[IO, Request] = rs

      def sendResponse(response: Response): IO[Unit] =
        Logger[IO].info(show"<R $response") *> IO.blocking(server.sendResponse(response))

      def sendEvent(event: DebugEvent): IO[Unit] =
        Logger[IO].info(show"<E $event") *> IO.blocking(server.sendEvent(event))
    }

  def resource(socket: Socket): Resource[IO, DAPSession[Request, Response, DebugEvent]] =
    for {
      dispatcher <- Dispatcher[IO]
      requests <- Resource.eval(Queue.bounded[IO, Option[Request]](10))
      server <- Server.resource(socket.getInputStream, socket.getOutputStream, dispatcher, requests)
      session = DAPSession(server, Stream.fromQueueNoneTerminated(requests))
    } yield session

  /** Wraps an AbstractProtocolServer into an IO-based interface. */
  class Server(
      in: InputStream,
      out: OutputStream,
      dispatcher: Dispatcher[IO],
      requests: QueueSink[IO, Option[Request]]
  ) extends AbstractProtocolServer(in, out) {
    def dispatchRequest(request: Request): Unit =
      dispatcher.unsafeRunSync {
        for {
          _ <- Logger[IO].info(show"R> $request")
          _ <- requests.offer(Some(request)).recoverWith {
            // format: off
            case t => Logger[IO].error(t)(show"error during handling of request $request")
            // format: on
          }
        } yield ()
      }
  }

  object Server {

    /** Starts an `AbstractProtocolServer` for the lifetime of the resource, stopping it upon release. */
    def resource(
        in: InputStream,
        out: OutputStream,
        dispatcher: Dispatcher[IO],
        requests: QueueSink[IO, Option[Request]]
    ): Resource[IO, AbstractProtocolServer] =
      Resource
        .make(IO(new Server(in, out, dispatcher, requests)))(server => IO(server.stop()) *> requests.offer(None).void)
        .flatTap(server => IO.blocking(server.run).background)
  }

}

/** Connect a debugee to an external debugger via DAP. */
class DAPodil(
    session: DAPSession[Request, Response, DebugEvent],
    state: Ref[IO, DAPodil.State],
    hotswap: Hotswap[IO, DAPodil.State], // manages those states that have their own resource management
    debugee: Request => EitherNel[String, Resource[IO, DAPodil.Debugee]],
    whenDone: Deferred[IO, DAPodil.Done]
) {
  implicit val logger: Logger[IO] = Slf4jLogger.getLogger

  /** Extension methods to create responses from requests. */
  implicit class RequestSyntax(request: Request) {
    def respondSuccess(body: AnyRef = null): Response = {
      val response = new Response(request.seq, request.command, true)
      response.body = body

      response
    }

    def respondFailure(message: Option[String] = None): Response =
      message.fold(new Response(request.seq, request.command, false))(
        new Response(request.seq, request.command, false, _)
      )
  }

  /** Extract a typed command from a string discriminator.
    *
    * TODO: rename extractor
    */
  object extract {
    def unapply(request: Request): Some[(Command, Arguments)] =
      Some {
        val command = Command.parse(request.command)
        command -> JsonUtils.fromJson(request.arguments, command.getArgumentType())
      }
  }

  def handleRequests: Stream[IO, Unit] =
    session.requests.evalMap(handle)

  /** Respond to requests and optionally update the current state. */
  def handle(request: Request): IO[Unit] =
    // TODO: java-debug doesn't seem to support the Restart request
    request match {
      case extract(Command.INITIALIZE, _)        => initialize(request)
      case extract(Command.CONFIGURATIONDONE, _) => session.sendResponse(request.respondSuccess())
      case extract(Command.LAUNCH, _)            =>
        // We ignore the java-debug LaunchArguments because it is overspecialized for JVM debugging, and parse our own.
        launch(request)
      case _ if request.command == "loadedSources" =>
        // the loadedSources command isn't supported by java-debug, so we parse it ourselves
        loadedSources(request)
      case extract(Command.SOURCE, args: SourceArguments) =>
        source(request, args)
      case extract(Command.SETBREAKPOINTS, args: SetBreakpointArguments) => setBreakpoints(request, args)
      case extract(Command.THREADS, _)                                   => threads(request)
      case extract(Command.STACKTRACE, _)                                => stackTrace(request)
      case extract(Command.SCOPES, args: ScopesArguments)                => scopes(request, args)
      case extract(Command.VARIABLES, args: VariablesArguments)          => variables(request, args)
      case extract(Command.NEXT, _)                                      => next(request)
      case extract(Command.CONTINUE, _)                                  => continue(request)
      case extract(Command.PAUSE, _)                                     => pause(request)
      case extract(Command.DISCONNECT, args: DisconnectArguments)        => disconnect(request, args)
      case extract(Command.EVALUATE, args: EvaluateArguments)            => eval(request, args)
      case _                                                             => Logger[IO].warn(show"unhandled request $request") *> session.sendResponse(request.respondFailure())
    }

  /** State.Uninitialized -> State.Initialized */
  def initialize(request: Request): IO[Unit] =
    state.modify {
      case DAPodil.State.Uninitialized =>
        val response = request.respondSuccess(DAPodil.Caps())
        DAPodil.State.Initialized -> (session.sendResponse(response) *> session.sendEvent(
          new Events.InitializedEvent()
        ))
      case s => s -> IO.raiseError(new RuntimeException("can only initialize when uninitialized"))
    }.flatten

  /** State.Initialized -> State.Launched */
  def launch(request: Request): IO[Unit] =
    // TODO: ensure `launch` is atomic
    state.get.flatMap {
      case DAPodil.State.Initialized =>
        debugee(request) match {
          case Left(errors) =>
            state.set(DAPodil.State.FailedToLaunch(request, errors, None)) *>
              Logger[IO].warn(show"error parsing launch args: ${errors.mkString_(", ")}") *> session
                .sendResponse(request.respondFailure(Some(show"error parsing launch args: ${errors.mkString_(", ")}")))
          case Right(dbgee) =>
            for {
              launched <- hotswap.swap {
                DAPodil.State.Launched.resource(session, dbgee)
              }.attempt

              _ <- launched match {
                case Left(t) =>
                  state.set(
                    DAPodil.State
                      .FailedToLaunch(request, NonEmptyList.of("couldn't launch from created debuggee"), Some(t))
                  ) *>
                    Logger[IO].warn(t)(show"couldn't launch, request $request") *>
                    session.sendResponse(
                      request.respondFailure(Some(show"Couldn't launch Daffodil debugger: ${t.getMessage()}"))
                    )
                case Right(launchedState) =>
                  state.set(launchedState) *>
                    session.sendResponse(request.respondSuccess())
              }
            } yield ()
        }
      case s => DAPodil.InvalidState.raise(request, "Initialized", s)
    }

  def loadedSources(request: Request): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        debugee.sources.flatMap { sources =>
          session.sendResponse(
            request.respondSuccess(
              DAPodil.LoadedSources(sources)
            )
          )
        }
      case _ => session.sendResponse(request.respondFailure())
    }

  def source(request: Request, args: SourceArguments): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        debugee.sourceContent(DAPodil.Source.Ref(args.sourceReference)).flatMap {
          case None =>
            session.sendResponse(request.respondFailure(Some(s"unknown source ref ${args.sourceReference}")))
          case Some(content) =>
            session.sendResponse(request.respondSuccess(new SourceResponseBody(content.value, "text/xml")))
        }
      case _ => session.sendResponse(request.respondFailure())
    }

  def setBreakpoints(request: Request, args: SetBreakpointArguments): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        for {
          _ <- debugee.setBreakpoints(
            Paths.get(args.source.path).toUri(),
            args.breakpoints.toList.map(bp => DAPodil.Line(bp.line))
          )
          breakpoints = args.breakpoints.toList.zipWithIndex.map {
            // format: off
            case (bp, i) => new Types.Breakpoint(i, true, bp.line, "")
            // format: on
          }
          response = request.respondSuccess(
            new Responses.SetBreakpointsResponseBody(breakpoints.asJava)
          )
          _ <- session.sendResponse(response)
        } yield ()
      case _: DAPodil.State.FailedToLaunch =>
        Logger[IO].warn("ignoring setBreakPoints request since previous launch failed") *>
          session.sendResponse(request.respondFailure())
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def threads(request: Request): IO[Unit] =
    state.get.flatMap {
      case launched: DAPodil.State.Launched =>
        for {
          threads <- launched.threads
          _ <- session.sendResponse(
            request.respondSuccess(
              new Responses.ThreadsResponseBody(threads.asJava)
            )
          )
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def stackTrace(request: Request): IO[Unit] =
    state.get.flatMap {
      case launched: DAPodil.State.Launched =>
        for {
          stackTrace <- launched.stackTrace
          response = request.respondSuccess(
            new Responses.StackTraceResponseBody(
              stackTrace.frames.map(_.stackFrame).asJava,
              stackTrace.frames.size
            )
          )
          _ <- session.sendResponse(response)
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def next(request: Request): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        for {
          _ <- debugee.step
          _ <- session.sendResponse(request.respondSuccess())
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def continue(request: Request): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        for {
          _ <- debugee.continue()
          _ <- session.sendResponse(request.respondSuccess())
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def pause(request: Request): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        for {
          _ <- debugee.pause()
          _ <- session.sendResponse(request.respondSuccess())
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def disconnect(request: Request, args: DisconnectArguments): IO[Unit] =
    session
      .sendResponse(request.respondSuccess())
      .guarantee {
        hotswap.clear *> whenDone.complete(DAPodil.Done(args.restart)).void
      }

  def scopes(request: Request, args: ScopesArguments): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        for {
          data <- debugee.data.get
          _ <- data.stack
            .findFrame(DAPodil.Frame.Id(args.frameId))
            .fold(
              Logger[IO].warn(
                s"couldn't find scopes for frame ${args.frameId}: ${data.stack.frames.map(f => f.id -> f.stackFrame.name)}"
              ) *>
                session.sendResponse(request.respondFailure(Some(s"couldn't find scopes for frame ${args.frameId}")))
            ) { frame =>
              session.sendResponse(
                request.respondSuccess(new Responses.ScopesResponseBody(frame.scopes.map(_.toDAP()).asJava))
              )
            }
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def variables(request: Request, args: VariablesArguments): IO[Unit] =
    state.get.flatMap {
      case DAPodil.State.Launched(debugee) =>
        // return the variables for the requested "variablesReference", which is associated with a scope, which is associated with a stack frame
        for {
          data <- debugee.data.get
          _ <- data.stack
            .variables(DAPodil.VariablesReference(args.variablesReference))
            .fold(
              Logger[IO]
                .warn(
                  show"couldn't find variablesReference ${args.variablesReference} in stack ${data}"
                ) *> // TODO: handle better
                session.sendResponse(request.respondFailure())
            )(variables =>
              session.sendResponse(request.respondSuccess(new Responses.VariablesResponseBody(variables.asJava)))
            )
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }

  def eval(request: Request, args: EvaluateArguments): IO[Unit] =
    state.get.flatMap {
      case launched: DAPodil.State.Launched =>
        for {
          variable <- launched.debugee.eval(args)
          _ <- variable match {
            case None => session.sendResponse(request.respondFailure())
            case Some(v) =>
              session.sendResponse(request.respondSuccess(new Responses.EvaluateResponseBody(v.value, 0, null, 0)))
          }
        } yield ()
      case s => DAPodil.InvalidState.raise(request, "Launched", s)
    }
}

object DAPodil extends IOApp {

  val opts: Opts[Options] =
    (
      Opts
        .option[Int]("listenPort", "port to listen on for DAP client connection (default: 4711)")
        .withDefault(4711),
      Opts
        .option[Duration]("listenTimeout", "duration to wait for a DAP client connection (default: 10s)")
        .withDefault(10.seconds)
    ).mapN(Options)

  implicit val logger: Logger[IO] = Slf4jLogger.getLogger

  val header =
    s"""|
        |******************************************************
        |A DAP server for debugging Daffodil schema processors.
        |
        |Build info:
        |  version: ${BuildInfo.version}
        |  daffodilVersion: ${BuildInfo.daffodilVersion}
        |  scalaVersion: ${BuildInfo.scalaVersion}
        |  sbtVersion: ${BuildInfo.sbtVersion}
        |******************************************************""".stripMargin

  def run(args: List[String]): IO[ExitCode] =
    CommandIOApp.run(
      name = "DAPodil",
      header = header,
      version = Some(BuildInfo.version)
    )(
      opts.map(run),
      args
    )

  def run(options: Options): IO[ExitCode] =
    for {
      _ <- Logger[IO].info(header)
      _ <- options match {
        case Options(listenPort, listenTimeout) =>
          Logger[IO].info(s"launched with options listenPort: $listenPort, listenTimeout: $listenTimeout")
      }

      state <- Ref[IO].of[State](State.Uninitialized)

      address = new InetSocketAddress(options.listenPort)
      serverSocket = {
        val ss = new ServerSocket(address.getPort, 1, address.getAddress)
        ss.setSoTimeout(options.listenTimeout.toMillis.toInt)
        ss
      }
      uri = URI.create(s"tcp://${address.getHostString}:${serverSocket.getLocalPort}")

      code <- listen(serverSocket, uri)
        .iterateWhile(_.restart)
        .as(ExitCode.Success)
        .recoverWith {
          // format: off
          case _: SocketTimeoutException => 
            Logger[IO].warn(s"timed out listening for connection on $uri, exiting").as(ExitCode.Error)
          // format: on
        }

    } yield code

  def listen(socket: ServerSocket, uri: URI): IO[Done] =
    for {
      _ <- Logger[IO].info(s"waiting at $uri")
      socket <- IO.blocking(socket.accept())
      _ <- Logger[IO].info(s"connected at $uri")

      done <- DAPSession
        .resource(socket)
        .flatMap(session => DAPodil.resource(session, Parse.debugee))
        .use(whenDone => whenDone <* Logger[IO].debug("whenDone: completed"))

      _ <- Logger[IO].info(s"disconnected at $uri")
    } yield done

  /** Returns a resource that launches the "DAPodil" debugger given a DAP session, returning an effect that waits until the debugger stops or the session ends. */
  def resource(
      session: DAPSession[Request, Response, DebugEvent],
      debugee: Request => EitherNel[String, Resource[IO, Debugee]]
  ): Resource[IO, IO[Done]] =
    for {
      state <- Resource.eval(Ref[IO].of[State](State.Uninitialized))
      hotswap <- Hotswap.create[IO, State].onFinalizeCase(ec => Logger[IO].debug(s"hotswap: $ec"))
      whenDone <- Resource.eval(Deferred[IO, Done])
      dapodil = new DAPodil(
        session,
        state,
        hotswap,
        debugee,
        whenDone
      )
      _ <- dapodil.handleRequests.compile.lastOrError
        .onError(Logger[IO].error(_)("unhandled error") *> whenDone.complete(Done(false)).void)
        .background

    } yield whenDone.get

  case class Done(restart: Boolean = false)

  case class Options(listenPort: Int, listenTimeout: Duration)

  /** DAPodil launches the debugee which reports its state and handles debug commands. */
  trait Debugee {
    // TODO: extract "control" interface from "state" interface
    def data(): Signal[IO, Data]
    def state(): Stream[IO, Debugee.State]
    def events(): Stream[IO, Events.DebugEvent]

    def sources(): IO[List[Source]]
    def sourceContent(ref: Source.Ref): IO[Option[Source.Content]]
    def sourceChanges(): Stream[IO, Source]

    def awaitFirstStackFrame(): IO[Unit] =
      data.discrete
        .collectFirst { case d if !d.stack.frames.isEmpty => () }
        .compile
        .lastOrError

    def step(): IO[Unit]
    def continue(): IO[Unit]
    def pause(): IO[Unit]
    def setBreakpoints(uri: URI, lines: List[DAPodil.Line]): IO[Unit]
    def eval(args: EvaluateArguments): IO[Option[Types.Variable]]
  }

  object Debugee {
    sealed trait State

    object State {
      case object Running extends State
      case class Stopped(reason: Stopped.Reason) extends State

      object Stopped {
        sealed trait Reason

        object Reason {

          /** The launch requested "stop on entry", i.e., stop at the "first" possible place. May only be received once as the first stopped reason. */
          case object Entry extends Reason

          /** The user requested a pause. */
          case object Pause extends Reason

          /** The user requested a step, which completed, so now we are stopped again. */
          case object Step extends Reason

          /** A breakpoint was hit. */
          case class BreakpointHit(location: DAPodil.Location) extends Reason
        }
      }
    }
  }

  /** Models the states of the Daffodil <-> DAP communication. */
  sealed trait State

  object State {
    case object Uninitialized extends State
    case object Initialized extends State
    case class Launched(debugee: Debugee) extends State {
      val stackTrace: IO[StackTrace] = debugee.data.get.map(_.stack)
      val threads: IO[List[Types.Thread]] = debugee.data.get.map(_.threads)
    }
    case class FailedToLaunch(request: Request, reasons: NonEmptyList[String], cause: Option[Throwable]) extends State

    object Launched {
      def resource(
          session: DAPSession[Request, Response, DebugEvent],
          debugee: Resource[IO, Debugee]
      ): Resource[IO, Launched] =
        for {
          debugee <- debugee.onFinalizeCase(ec => Logger[IO].debug(s"debugee: $ec"))

          _ <- Resource.eval(
            Logger[IO].debug("awaiting first stack frame") *>
              debugee.awaitFirstStackFrame() *>
              Logger[IO].debug("awaiting first stack frame: got it")
          )

          launched <- Stream
            .emit(Launched(debugee))
            .concurrently(deliverEvents(debugee, session))
            .evalTap(_ => Logger[IO].debug("started Launched"))
            .compile
            .resource
            .lastOrError
            .onFinalizeCase(ec => Logger[IO].debug(s"launched: $ec"))

          _ <- Resource.eval(session.sendEvent(new Events.ThreadEvent("started", 1L)))
        } yield launched
    }

    def deliverEvents(debugee: Debugee, session: DAPSession[Request, Response, DebugEvent]): Stream[IO, Unit] = {
      val stoppedEventsDelivery = debugee.state
        .collect {
          case Debugee.State.Stopped(Debugee.State.Stopped.Reason.Entry) =>
            new Events.StoppedEvent("entry", 1L)
          case Debugee.State.Stopped(Debugee.State.Stopped.Reason.Pause) =>
            new Events.StoppedEvent("pause", 1L)
          case Debugee.State.Stopped(Debugee.State.Stopped.Reason.Step) =>
            new Events.StoppedEvent("step", 1L)
          case Debugee.State.Stopped(Debugee.State.Stopped.Reason.BreakpointHit(_)) =>
            new Events.StoppedEvent("breakpoint", 1L)
        }
        .onFinalizeCase(ec => Logger[IO].debug(s"deliverStoppedEvents: $ec"))

      val dapEvents = debugee.events
        .onFinalizeCase(ec => Logger[IO].debug(s"dapEvents: $ec"))

      val sourceEventsDelivery = debugee.sourceChanges
        .map(source => DAPodil.LoadedSourceEvent("changed", source.toDAP))
        .onFinalizeCase(ec => Logger[IO].debug(s"sourceEventsDelivery: $ec"))

      Stream(stoppedEventsDelivery, dapEvents, sourceEventsDelivery).parJoinUnbounded
        .evalMap(session.sendEvent)
        .onFinalize(
          session.sendEvent(new Events.ThreadEvent("exited", 1L)) *>
            session.sendEvent(new Events.TerminatedEvent())
        )
    }

    implicit val show: Show[State] = Show.fromToString
  }

  case class InvalidState(request: Request, expected: String, actual: State)
      extends RuntimeException(show"expected state $expected, was $actual when receiving request $request")

  object InvalidState {
    def raise(request: Request, expected: String, actual: State): IO[Nothing] =
      IO.raiseError(InvalidState(request, expected, actual))
  }

  case class Data(stack: StackTrace) {
    // there's always a single "thread"
    val threads = List(new Types.Thread(1L, "daffodil"))

    def push(frame: Frame): Data =
      copy(stack = stack.push(frame))

    def pop(): Data =
      copy(stack = stack.pop) // TODO: warn of bad pop
  }

  object Data {
    implicit val show: Show[Data] =
      ds => show"DaffodilState(${ds.stack})"

    val empty: Data = Data(StackTrace.empty)
  }

  case class Frame(id: Frame.Id, stackFrame: Types.StackFrame, scopes: List[Frame.Scope]) {
    def variables(reference: VariablesReference): Option[List[Types.Variable]] =
      scopes.collectFirstSome(_.variables.get(reference))
  }

  object Frame {

    implicit val show: Show[Frame] = Show.fromToString

    /** Identifier for a stack frame within a stack trace. */
    case class Id(value: Int) extends AnyVal

    case class Scope(
        name: String,
        reference: VariablesReference,
        variables: Map[VariablesReference, List[Types.Variable]]
    ) {
      def toDAP(): Types.Scope =
        new Types.Scope(name, reference.value, false)
    }
  }

  case class VariablesReference(value: Int) extends AnyVal

  case class StackTrace(frames: List[Frame]) {
    def push(frame: Frame): StackTrace =
      copy(frame :: frames)

    def pop(): StackTrace =
      copy(frames.tail)

    def findFrame(frameId: Frame.Id): Option[Frame] =
      frames.find(_.id == frameId)

    def variables(reference: VariablesReference): Option[List[Types.Variable]] =
      frames.collectFirstSome(_.variables(reference))
  }

  object StackTrace {
    val empty: StackTrace = StackTrace(List.empty)

    implicit val show: Show[StackTrace] =
      st => st.frames.map(f => s"${f.stackFrame.line}:${f.stackFrame.column}").mkString("; ")
  }

  case class Line(value: Int) extends AnyVal
  case class Location(uri: URI, line: Line)

  object Location {
    implicit val show: Show[Location] = Show.fromToString
  }

  case class Breakpoints(value: Map[URI, List[Line]]) {
    def set(uri: URI, lines: List[Line]): Breakpoints =
      copy(value = value + (uri.normalize -> lines))

    def contains(location: Location): Boolean =
      value.exists {
        // format: off
        case (uri, lines) =>
          uri == location.uri && lines.exists(_ == location.line)
        // format: on
      }
  }

  object Breakpoints {
    val empty: Breakpoints = Breakpoints(Map.empty)

    implicit val show: Show[Breakpoints] = Show.fromToString
  }

  // TODO: path *can* be optional for non-empty source reference ids; need to experiment
  case class Source(path: Path, ref: Option[Source.Ref]) {
    def toDAP: Types.Source =
      new Types.Source(path.toString, ref.map(_.value).getOrElse(0))
  }

  object Source {
    case class Ref(value: Int) extends AnyVal

    case class Content(value: String, mimeType: Option[String])
  }

  /** reason: new, changed, or removed */
  case class LoadedSourceEvent(reason: String, source: Types.Source) extends Events.DebugEvent("loadedSource")

  case class LoadedSources(sources: java.util.List[Types.Source])

  object LoadedSources {
    def apply(sources: List[Source]): LoadedSources =
      LoadedSources(sources.map(_.toDAP).asJava)
  }

  /** Our own capabilities data type that is a superset of java-debug, which doesn't have `supportsLoadedSourcesRequest`.
    *
    * TODO: VS Code doesn't seem to notice supportsRestartRequest=true and sends Disconnect (+restart) requests instead
    */
  case class Caps(
      supportsConfigurationDoneRequest: Boolean = true,
      supportsHitConditionalBreakpoints: Boolean = false,
      supportsConditionalBreakpoints: Boolean = false,
      supportsEvaluateForHovers: Boolean = false,
      supportsCompletionsRequest: Boolean = false,
      supportsRestartFrame: Boolean = false,
      supportsSetVariable: Boolean = false,
      supportsRestartRequest: Boolean = false,
      supportTerminateDebuggee: Boolean = false,
      supportsDelayedStackTraceLoading: Boolean = false,
      supportsLogPoints: Boolean = false,
      supportsExceptionInfoRequest: Boolean = false,
      supportsDataBreakpoints: Boolean = false,
      supportsClipboardContext: Boolean = false,
      // disable loaded sources as it is handled in the extension: https://github.com/apache/daffodil-vscode/issues/25
      supportsLoadedSourcesRequest: Boolean = false
  )
}
