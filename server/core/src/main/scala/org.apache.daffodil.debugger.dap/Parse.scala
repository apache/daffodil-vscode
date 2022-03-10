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

import cats.Show
import cats.data._
import cats.effect._
import cats.effect.std._
import cats.syntax.all._
import com.google.gson.JsonObject
import com.microsoft.java.debug.core.protocol._
import com.microsoft.java.debug.core.protocol.Messages.Request
import com.microsoft.java.debug.core.protocol.Requests._
import fs2._
import fs2.concurrent._
import fs2.io.file.Files
import java.io._
import java.net.URI
import java.nio.file._
import org.apache.commons.io.FileUtils
import org.apache.daffodil.debugger.dap.{BuildInfo => DAPBuildInfo}
import org.apache.daffodil.debugger.Debugger
import org.apache.daffodil.exceptions.SchemaFileLocation
import org.apache.daffodil.infoset._
import org.apache.daffodil.processors.dfa.DFADelimiter
import org.apache.daffodil.processors.parsers._
import org.apache.daffodil.processors._
import org.apache.daffodil.sapi.infoset.XMLTextInfosetOutputter
import org.apache.daffodil.sapi.io.InputSourceDataInputStream
import org.apache.daffodil.util.Misc
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import scala.util.Try

trait Parse {

  /** Run the parse, returning the bytes of the final infoset. */
  def run(): Stream[IO, Byte]

  /** Request the active parse to stop. */
  def close(): IO[Unit]
}

/** A running Daffodil parse. */
object Parse {
  implicit val logger: Logger[IO] = Slf4jLogger.getLogger

  def apply(
      schema: Path,
      data: InputStream,
      debugger: Debugger
  ): IO[Parse] =
    for {
      dp <- Compiler().compile(schema).map(p => p.withDebugger(debugger).withDebugging(true))
      done <- Ref[IO].of(false)
      pleaseStop <- Deferred[IO, Unit]
    } yield new Parse {
      def run(): Stream[IO, Byte] =
        fs2.io
          .readOutputStream(4096) { os =>
            val stopper =
              pleaseStop.get *> IO.canceled // will cancel the concurrent parse effect

            val parse =
              IO.interruptible(true) {
                  dp.parse(new InputSourceDataInputStream(data), new XMLTextInfosetOutputter(os, true)) // WARNING: parse doesn't close the OutputStream, so closed below
                }
                .guaranteeCase(outcome => Logger[IO].debug(s"parse finished: $outcome"))
                .void

            stopper &> parse.guarantee(IO(os.close) *> done.set(true))
          }

      def close(): IO[Unit] =
        done.get.flatMap {
          case false => Logger[IO].debug("interrupting parse") *> pleaseStop.complete(()).void
          case true  => Logger[IO].debug("parse done, no interruption") *> IO.unit
        }
    }

  class Debugee(
      schema: DAPodil.Source,
      data: DAPodil.Source,
      outputData: Signal[IO, DAPodil.Data],
      outputState: Stream[IO, DAPodil.Debugee.State],
      stateSink: QueueSink[IO, Option[DAPodil.Debugee.State]],
      events: Stream[IO, Events.DebugEvent],
      breakpoints: Breakpoints,
      control: Control
  ) extends DAPodil.Debugee {
    def data(): Signal[IO, DAPodil.Data] =
      outputData

    def state(): Stream[IO, DAPodil.Debugee.State] =
      outputState

    def events(): Stream[IO, Events.DebugEvent] =
      events

    /** We return only the "static" sources of the schema and data file, and notify the debugger of additional sources, if any, via source change events, which only subsequently fetch the content directly via `sourceContent`. */
    def sources(): IO[List[DAPodil.Source]] =
      IO.pure(List(schema, data))

    def sourceContent(ref: DAPodil.Source.Ref): IO[Option[DAPodil.Source.Content]] =
      IO.pure(None) // no additional source content available; infoset and data position info sent as custom events

    def sourceChanges(): Stream[IO, DAPodil.Source] =
      Stream.empty

    def step(): IO[Unit] =
      control.step() *> stateSink.offer(
        Some(DAPodil.Debugee.State.Stopped(DAPodil.Debugee.State.Stopped.Reason.Step))
      )

    def continue(): IO[Unit] =
      control.continue() *> stateSink.offer(Some(DAPodil.Debugee.State.Running))

    def pause(): IO[Unit] =
      control.pause() *> stateSink.offer(
        Some(DAPodil.Debugee.State.Stopped(DAPodil.Debugee.State.Stopped.Reason.Pause))
      )

    def setBreakpoints(uri: URI, lines: List[DAPodil.Line]): IO[Unit] =
      breakpoints.setBreakpoints(uri, lines)

    def eval(args: EvaluateArguments): IO[Option[Types.Variable]] =
      args.expression match {
        case name => // check all variables in the given frame
          data().get.map { data =>
            for {
              frame <- data.stack.findFrame(DAPodil.Frame.Id(args.frameId))
              variable <- frame.scopes.collectFirstSome { scope =>
                scope.variables.values.toList.collectFirstSome(_.find(_.name == name))
              }
            } yield variable
          }
      }
  }

  object Debugee {

    case class LaunchArgs(
        schemaPath: Path,
        dataPath: Path,
        stopOnEntry: Boolean,
        infosetOutput: LaunchArgs.InfosetOutput
    ) extends Arguments {
      def data: IO[InputStream] =
        IO.blocking(FileUtils.readFileToByteArray(dataPath.toFile))
          .map(new ByteArrayInputStream(_))
    }

    object LaunchArgs {
      sealed trait InfosetOutput

      object InfosetOutput {
        case object None extends InfosetOutput
        case object Console extends InfosetOutput
        case class File(path: Path) extends InfosetOutput
      }

      def parse(arguments: JsonObject): EitherNel[String, LaunchArgs] =
        (
          Option(arguments.getAsJsonPrimitive("program"))
            .toRight("missing 'program' field from launch request")
            .flatMap(path =>
              Either
                .catchNonFatal(Paths.get(path.getAsString))
                .leftMap(t => s"'program' field from launch request is not a valid path: $t")
                .ensureOr(path => s"program file at $path doesn't exist")(_.toFile().exists())
            )
            .toEitherNel,
          Option(arguments.getAsJsonPrimitive("data"))
            .toRight("missing 'data' field from launch request")
            .flatMap(path =>
              Either
                .catchNonFatal(Paths.get(path.getAsString))
                .leftMap(t => s"'data' field from launch request is not a valid path: $t")
                .ensureOr(path => s"data file at $path doesn't exist")(_.toFile().exists())
            )
            .toEitherNel,
          Option(arguments.getAsJsonPrimitive("stopOnEntry"))
            .map(_.getAsBoolean())
            .getOrElse(true)
            .asRight[String]
            .toEitherNel,
          Option(arguments.getAsJsonObject("infosetOutput")) match {
            case None => Right(LaunchArgs.InfosetOutput.Console).toEitherNel
            case Some(infosetOutput) =>
              Option(infosetOutput.getAsJsonPrimitive("type")) match {
                case None => Right(LaunchArgs.InfosetOutput.Console).toEitherNel
                case Some(typ) =>
                  typ.getAsString() match {
                    case "none"    => Right(LaunchArgs.InfosetOutput.None).toEitherNel
                    case "console" => Right(LaunchArgs.InfosetOutput.Console).toEitherNel
                    case "file" =>
                      Option(infosetOutput.getAsJsonPrimitive("path"))
                        .toRight("missing 'infosetOutput.path' field from launch request")
                        .flatMap(path =>
                          Either
                            .catchNonFatal(LaunchArgs.InfosetOutput.File(Paths.get(path.getAsString)))
                            .leftMap(t => s"'infosetOutput.path' field from launch request is not a valid path: $t")
                            .ensureOr(file => s"can't write to infoset output file at ${file.path}") { f =>
                              val file = f.path.toFile
                              file.canWrite || (!file.exists && file.getParentFile.canWrite)
                            }
                        )
                        .toEitherNel
                    case invalidType =>
                      Left(s"invalid 'infosetOutput.type': '$invalidType', must be 'none', 'console', or 'file'").toEitherNel
                  }
              }
          }
        ).parMapN(LaunchArgs.apply)
    }
  }

  val infosetSource = DAPodil.Source(Paths.get("infoset"), Some(DAPodil.Source.Ref(1)))
  val dataDumpSource = DAPodil.Source(Paths.get("data"), Some(DAPodil.Source.Ref(2)))

  def debugee(request: Request): EitherNel[String, Resource[IO, DAPodil.Debugee]] =
    Debugee.LaunchArgs.parse(request.arguments).map(debugee)

  def debugee(args: Debugee.LaunchArgs): Resource[IO, DAPodil.Debugee] =
    for {
      data <- Resource.eval(Queue.bounded[IO, Option[DAPodil.Data]](10))
      state <- Resource.eval(Queue.bounded[IO, Option[DAPodil.Debugee.State]](10))
      dapEvents <- Resource.eval(Queue.bounded[IO, Option[Events.DebugEvent]](10))
      breakpoints <- Resource.eval(Breakpoints())
      infoset <- Resource.eval(Queue.bounded[IO, Option[String]](10)) // TODO: it's a bit incongruous to have a separate channel for infoset changes, vs. streaming Parse.Event values
      control <- Resource.eval(Control.stopped())

      latestData <- Stream.fromQueueNoneTerminated(data).holdResource(DAPodil.Data.empty)

      latestInfoset <- Resource.eval(SignallingRef[IO, String](""))
      infosetChanges = Stream
        .fromQueueNoneTerminated(infoset)
        .evalTap(latestInfoset.set)
        .evalTap(content => dapEvents.offer(Some(InfosetEvent(content, "text/xml"))))
        .onFinalizeCase(ec => Logger[IO].debug(s"infosetChanges (orig): $ec"))

      events <- Resource.eval(Queue.bounded[IO, Option[Event]](10))
      debugger <- DaffodilDebugger
        .resource(state, events, breakpoints, control, infoset)
      parse <- Resource.eval(args.data.flatMap(in => Parse(args.schemaPath, in, debugger)))

      parsing = args.infosetOutput match {
        case Debugee.LaunchArgs.InfosetOutput.None =>
          parse.run().drain
        case Debugee.LaunchArgs.InfosetOutput.Console =>
          parse
            .run()
            .through(text.utf8Decode)
            .foldMonoid
            .evalTap(_ => Logger[IO].debug("done collecting infoset XML output"))
            .map(infosetXML => Some(Events.OutputEvent.createConsoleOutput(infosetXML)))
            .enqueueUnterminated(dapEvents) // later handling will terminate dapEvents
        case Debugee.LaunchArgs.InfosetOutput.File(path) =>
          parse.run().through(Files[IO].writeAll(path))
      }

      nextFrameId <- Resource.eval(Next.int.map(_.map(DAPodil.Frame.Id.apply)).flatTap(_.next())) // `.flatTap(_.next())`: ids start at 1
      nextRef <- Resource.eval(Next.int.map(_.map(DAPodil.VariablesReference.apply)).flatTap(_.next())) // `.flatTap(_.next())`: ids start at 1

      // convert Parse.Event values to DAPodil.Data values
      deliverParseData = Stream
        .fromQueueNoneTerminated(events)
        .evalTap {
          case start: Event.StartElement if start.isStepping =>
            dapEvents.offer(Some(DataEvent(start.state.currentLocation.bytePos1b)))
          case _ => IO.unit
        }
        .through(fromParse(nextFrameId, nextRef))
        .enqueueNoneTerminated(data)

      debugee = new Debugee(
        DAPodil.Source(args.schemaPath, None),
        DAPodil.Source(args.dataPath, None),
        latestData,
        Stream.fromQueueNoneTerminated(state),
        state,
        Stream.fromQueueNoneTerminated(dapEvents),
        breakpoints,
        control
      )
      startup = dapEvents.offer(Some(ConfigEvent(args))) *>
        (if (args.stopOnEntry)
           control.step() *> state.offer(
             Some(DAPodil.Debugee.State.Stopped(DAPodil.Debugee.State.Stopped.Reason.Entry))
           ) // don't use debugee.step as we need to send Stopped.Reason.Entry, not Stopped.Reason.Step
         else debugee.continue())

      _ <- Stream
        .emit(debugee)
        .concurrently(
          Stream(
            Stream.eval(startup),
            parsing.onFinalizeCase(ec => Logger[IO].debug(s"parsing: $ec")),
            deliverParseData.onFinalizeCase {
              case ec @ Resource.ExitCase.Errored(e) => Logger[IO].warn(e)(s"deliverParseData: $ec")
              case ec                                => Logger[IO].debug(s"deliverParseData: $ec")
            } ++ Stream.eval(
              dapEvents.offer(None) // ensure dapEvents is terminated when the parse is terminated
            ),
            infosetChanges
          ).parJoinUnbounded
        )
        .compile
        .resource
        .lastOrError

      _ <- Resource.onFinalize(Logger[IO].debug("signalling a stop") *> parse.close())
    } yield debugee

  /** Translate parse events to updated Daffodil state. */
  def fromParse(
      frameIds: Next[DAPodil.Frame.Id],
      variableRefs: Next[DAPodil.VariablesReference]
  ): Stream[IO, Parse.Event] => Stream[IO, DAPodil.Data] =
    events =>
      events.evalScan(DAPodil.Data.empty) {
        case (_, Parse.Event.Init(_)) => IO.pure(DAPodil.Data.empty)
        case (prev, startElement: Parse.Event.StartElement) =>
          createFrame(startElement, frameIds, variableRefs).map(prev.push)
        case (prev, Parse.Event.EndElement(_)) => IO.pure(prev.pop)
        case (prev, _: Parse.Event.Fini.type)  => IO.pure(prev)
      }

  /** Transform Daffodil state to a DAP stack frame.
    *
    * @see https://microsoft.github.io/debug-adapter-protocol/specification#Types_StackFrame
    */
  def createFrame(
      startElement: Parse.Event.StartElement,
      frameIds: Next[DAPodil.Frame.Id],
      variableRefs: Next[DAPodil.VariablesReference]
  ): IO[DAPodil.Frame] =
    for {
      ids <- (frameIds.next, variableRefs.next, variableRefs.next, variableRefs.next).tupled
      (frameId, parseScopeId, schemaScopeId, dataScopeId) = ids

      stackFrame = new Types.StackFrame(
        /* It must be unique across all threads.
         * This id can be used to retrieve the scopes of the frame with the
         * 'scopesRequest' or to restart the execution of a stackframe.
         */
        frameId.value,
        startElement.name.map(_.value).getOrElse("???"),
        /* If sourceReference > 0 the contents of the source must be retrieved through
         * the SourceRequest (even if a path is specified). */
        Try(Paths.get(URI.create(startElement.schemaLocation.uriString)).toString())
          .fold(
            _ =>
              new Types.Source(startElement.schemaLocation.uriString, null, 0), // there is no valid path if the location is a schema contained in a jar file; see #76.
            path => new Types.Source(path, 0)
          ),
        startElement.schemaLocation.lineNumber
          .map(_.toInt)
          .getOrElse(1), // line numbers start at 1 according to InitializeRequest
        0 // column numbers start at 1 according to InitializeRequest, but set to 0 to ignore it; column calculation by Daffodil uses 1 tab = 2 spaces(?), but breakpoints use 1 character per tab
      )

      schemaScope <- schemaScope(schemaScopeId, startElement.state, variableRefs)
      parseScope <- parseScope(parseScopeId, startElement, variableRefs)
    } yield DAPodil.Frame(
      frameId,
      stackFrame,
      List(
        parseScope,
        schemaScope,
        dataScope(dataScopeId, startElement.state)
      )
    )

  def parseScope(
      ref: DAPodil.VariablesReference,
      event: Event.StartElement,
      refs: Next[DAPodil.VariablesReference]
  ): IO[DAPodil.Frame.Scope] =
    (refs.next, refs.next).mapN { (pouRef, delimiterStackRef) =>
      val hidden = event.state.withinHiddenNest
      val childIndex = if (event.state.childPos != -1) Some(event.state.childPos) else None
      val groupIndex = if (event.state.groupPos != -1) Some(event.state.groupPos) else None
      val occursIndex = if (event.state.arrayPos != -1) Some(event.state.arrayPos) else None
      val foundDelimiter = for {
        dpr <- event.state.delimitedParseResult.toScalaOption
        dv <- dpr.matchedDelimiterValue.toScalaOption
      } yield Misc.remapStringToVisibleGlyphs(dv)
      val foundField = for {
        dpr <- event.state.delimitedParseResult.toScalaOption
        f <- dpr.field.toScalaOption
      } yield Misc.remapStringToVisibleGlyphs(f)

      val pouRootVariable =
        new Types.Variable("points of uncertainty", "", null, pouRef.value, null)
      val pouVariables =
        event.pointsOfUncertainty.map(pou => new Types.Variable(s"${pou.name.value}", s"${pou.context}"))

      val delimiterStackRootVariable =
        new Types.Variable("delimiters", "", null, delimiterStackRef.value, null)
      val delimiterStackVariables =
        event.delimiterStack.map(delimiter =>
          new Types.Variable(s"${delimiter.kind}:${delimiter.value.delimType}", s"${delimiter.value.lookingFor}")
        )

      val parseVariables: List[Types.Variable] =
        (List(
          new Types.Variable("hidden", hidden.toString, "bool", 0, null),
          pouRootVariable,
          delimiterStackRootVariable
        ) ++ childIndex.map(ci => new Types.Variable("childIndex", ci.toString)).toList
          ++ groupIndex
            .map(gi => new Types.Variable("groupIndex", gi.toString))
            .toList
          ++ occursIndex
            .map(oi => new Types.Variable("occursIndex", oi.toString))
            .toList
          ++ foundDelimiter.map(fd => new Types.Variable("foundDelimiter", fd)).toList
          ++ foundField.map(ff => new Types.Variable("foundField", ff)).toList)
          .sortBy(_.name)

      DAPodil.Frame.Scope(
        "Parse",
        ref,
        Map(
          ref -> parseVariables,
          pouRef -> pouVariables,
          delimiterStackRef -> delimiterStackVariables
        )
      )
    }

  // a.k.a. Daffodil variables
  def schemaScope(
      scopeRef: DAPodil.VariablesReference,
      state: StateForDebugger,
      refs: Next[DAPodil.VariablesReference]
  ): IO[DAPodil.Frame.Scope] =
    state.variableMapForDebugger.qnames.toList
      .groupBy(_.namespace) // TODO: handle NoNamespace or UnspecifiedNamespace as top-level?
      .toList
      .flatTraverse {
        case (ns, vs) =>
          // every namespace is a DAP variable in the current scope, and links to its set of Daffodil-as-DAP variables
          refs.next.map { ref =>
            List(scopeRef -> List(new Types.Variable(ns.toString(), "", null, ref.value, null))) ++
              List(
                ref -> vs
                  .sortBy(_.toPrettyString)
                  .fproduct(state.variableMapForDebugger.find)
                  .map {
                    case (name, value) =>
                      new Types.Variable(
                        name.toQNameString,
                        value
                          .flatMap(v => Option(v.value.value).map(_.toString) orElse Some("null"))
                          .getOrElse("???"),
                        value
                          .map(_.state match {
                            case VariableDefined      => "default"
                            case VariableRead         => "read"
                            case VariableSet          => "set"
                            case VariableUndefined    => "undefined"
                            case VariableBeingDefined => "being defined"
                            case VariableInProcess    => "in process"
                          })
                          .getOrElse("???"),
                        0,
                        null
                      )
                  }
              )
          }
      }
      .map { refVars =>
        val sv = refVars.foldMap(Map(_)) // combine values of map to accumulate namespaces
        DAPodil.Frame.Scope(
          "Schema",
          scopeRef,
          sv
        )
      }

  def dataScope(ref: DAPodil.VariablesReference, state: StateForDebugger): DAPodil.Frame.Scope = {
    val bytePos1b = state.currentLocation.bytePos1b
    val dataVariables: List[Types.Variable] =
      List(new Types.Variable("bytePos1b", bytePos1b.toString, "number", 0, null))

    DAPodil.Frame.Scope(
      "Data",
      ref,
      Map(ref -> dataVariables)
    )
  }

  /** An algebraic data type that reifies the Daffodil `Debugger` callbacks. */
  sealed trait Event

  object Event {
    case class Init(state: StateForDebugger) extends Event
    case class StartElement(
        state: StateForDebugger,
        isStepping: Boolean,
        name: Option[ElementName],
        schemaLocation: SchemaFileLocation,
        pointsOfUncertainty: List[PointOfUncertainty],
        delimiterStack: List[Delimiter]
    ) extends Event {
      // PState is mutable, so we copy all the information we might need downstream.
      def this(pstate: PState, isStepping: Boolean) =
        this(
          pstate.copyStateForDebugger,
          isStepping,
          pstate.currentNode.toScalaOption.map(element => ElementName(element.name)),
          pstate.schemaFileLocation,
          pstate.pointsOfUncertainty.iterator.toList.map(mark =>
            PointOfUncertainty(
              Option(mark.disMark).as(mark.bitPos0b),
              mark.context.schemaFileLocation,
              ElementName(mark.element.name),
              mark.context.toString()
            )
          ),
          pstate.mpstate.delimiters.toList.zipWithIndex.map {
            case (delimiter, i) =>
              Delimiter(if (i < pstate.mpstate.delimitersLocalIndexStack.top) "remote" else "local", delimiter)
          }
        )
    }
    case class EndElement(state: StateForDebugger) extends Event
    case object Fini extends Event

    implicit val show: Show[Event] = Show.fromToString
  }

  case class ElementName(value: String) extends AnyVal

  case class PointOfUncertainty(
      bitPosition: Option[Long],
      location: SchemaFileLocation,
      name: ElementName,
      context: String
  )

  case class Delimiter(kind: String, value: DFADelimiter)

  trait Breakpoints {
    def setBreakpoints(uri: URI, lines: List[DAPodil.Line]): IO[Unit]
    def shouldBreak(location: DAPodil.Location): IO[Boolean]
  }

  object Breakpoints {
    def apply(): IO[Breakpoints] =
      for {
        breakpoints <- Ref[IO].of(DAPodil.Breakpoints.empty)
      } yield new Breakpoints {
        def setBreakpoints(uri: URI, lines: List[DAPodil.Line]): IO[Unit] =
          breakpoints.update(bp => bp.set(uri, lines))

        def shouldBreak(location: DAPodil.Location): IO[Boolean] =
          for {
            bp <- breakpoints.get
          } yield bp.contains(location)
      }
  }

  case class ConfigEvent(launchArgs: ConfigEvent.LaunchArgs, buildInfo: ConfigEvent.BuildInfo)
      extends Events.DebugEvent("daffodil.config")
  object ConfigEvent {
    case class LaunchArgs(schemaPath: String, dataPath: String, stopOnEntry: Boolean, infosetOutput: InfosetOutput)

    sealed trait InfosetOutput {
      val `type`: String =
        this match {
          case InfosetOutput.None    => "none"
          case InfosetOutput.Console => "console"
          case InfosetOutput.File(_) => "file"
        }
    }
    object InfosetOutput {
      case object None extends InfosetOutput
      case object Console extends InfosetOutput
      case class File(path: String) extends InfosetOutput

      def apply(that: Debugee.LaunchArgs.InfosetOutput): InfosetOutput =
        that match {
          case Debugee.LaunchArgs.InfosetOutput.None       => None
          case Debugee.LaunchArgs.InfosetOutput.Console    => Console
          case Debugee.LaunchArgs.InfosetOutput.File(path) => File(path.toString)
        }
    }

    case class BuildInfo(version: String, daffodilVersion: String, scalaVersion: String)

    def apply(launchArgs: Debugee.LaunchArgs): ConfigEvent =
      ConfigEvent(
        LaunchArgs(
          launchArgs.schemaPath.toString,
          launchArgs.dataPath.toString(),
          launchArgs.stopOnEntry,
          InfosetOutput(launchArgs.infosetOutput)
        ),
        BuildInfo(
          DAPBuildInfo.version,
          DAPBuildInfo.daffodilVersion,
          DAPBuildInfo.scalaVersion
        )
      )
  }
  case class DataEvent(bytePos1b: Long) extends Events.DebugEvent("daffodil.data")
  case class InfosetEvent(content: String, mimeType: String) extends Events.DebugEvent("daffodil.infoset")

  /** Behavior of a stepping debugger that can be running or stopped. */
  sealed trait Control {

    /** Blocks if the current state is stopped, unblocking when a `step` or `continue` happens. Returns true if blocking happened, false otherwise. */
    def await(): IO[Boolean]

    /** Start running. */
    def continue(): IO[Unit]

    /** If stopped, advance one "step", remaining stopped.
      *
      * IMPORTANT: Shouldn't return until any work blocked by
      * an `await` completes, otherwise the update that was waiting will race with the code that sees the `step` complete.
      */
    def step(): IO[Unit]

    /** Stop running. */
    def pause(): IO[Unit]
  }

  object Control {
    implicit val logger: Logger[IO] = Slf4jLogger.getLogger

    sealed trait State
    case class AwaitingFirstAwait(waiterArrived: Deferred[IO, Unit]) extends State
    case object Running extends State
    case class Stopped(whenContinued: Deferred[IO, Unit], nextAwaitStarted: Deferred[IO, Unit]) extends State

    /** Create a control initialized to the `Stopped` state. */
    def stopped(): IO[Control] =
      for {
        waiterArrived <- Deferred[IO, Unit]
        state <- Ref[IO].of[State](AwaitingFirstAwait(waiterArrived))
      } yield new Control {
        def await(): IO[Boolean] =
          for {
            nextContinue <- Deferred[IO, Unit]
            nextAwaitStarted <- Deferred[IO, Unit]
            awaited <- state.modify {
              case AwaitingFirstAwait(waiterArrived) =>
                Stopped(nextContinue, nextAwaitStarted) -> waiterArrived.complete(()) *> nextContinue.get.as(true)
              case Running => Running -> IO.pure(false)
              case s @ Stopped(whenContinued, nextAwaitStarted) =>
                s -> nextAwaitStarted.complete(()) *> // signal next await happened
                  whenContinued.get.as(true) // block
            }.flatten
          } yield awaited

        def step(): IO[Unit] =
          for {
            nextContinue <- Deferred[IO, Unit]
            nextAwaitStarted <- Deferred[IO, Unit]
            _ <- state.modify {
              case s @ AwaitingFirstAwait(waiterArrived) => s -> waiterArrived.get *> step
              case Running                               => Running -> IO.unit
              case Stopped(whenContinued, _) =>
                Stopped(nextContinue, nextAwaitStarted) -> (
                  whenContinued.complete(()) *> // wake up await-ers
                    nextAwaitStarted.get // block until next await is invoked
                )
            }.flatten
          } yield ()

        def continue(): IO[Unit] =
          state.modify {
            case s @ AwaitingFirstAwait(waiterArrived) => s -> waiterArrived.get *> continue
            case Running                               => Running -> IO.unit
            case Stopped(whenContinued, _) =>
              Running -> whenContinued.complete(()).void // wake up await-ers
          }.flatten

        def pause(): IO[Unit] =
          for {
            nextContinue <- Deferred[IO, Unit]
            nextAwaitStarted <- Deferred[IO, Unit]
            _ <- state.update {
              case Running               => Stopped(nextContinue, nextAwaitStarted)
              case s: AwaitingFirstAwait => s
              case s: Stopped            => s
            }
          } yield ()
      }
  }

  /** The Daffodil `Debugger` interface is asynchronously invoked from a running parse,
    * and always returns `Unit`. In order to invoke effects like `IO` but return `Unit`,
    * we use a `Dispatcher` to execute the effects at this "outermost" layer (with respect to the effects).
    */
  class DaffodilDebugger(
      dispatcher: Dispatcher[IO],
      state: QueueSink[IO, Option[DAPodil.Debugee.State]],
      breakpoints: Breakpoints,
      control: Control,
      events: QueueSink[IO, Option[Event]],
      infoset: QueueSink[IO, Option[String]]
  ) extends Debugger {
    implicit val logger: Logger[IO] = Slf4jLogger.getLogger

    override def init(pstate: PState, processor: Parser): Unit =
      dispatcher.unsafeRunSync {
        events.offer(Some(Event.Init(pstate.copyStateForDebugger)))
      }

    override def fini(processor: Parser): Unit =
      dispatcher.unsafeRunSync {
        events.offer(Some(Event.Fini)) *>
          events.offer(None) *> // no more events after this
          state.offer(None) *> // no more states == the parse is terminated
          infoset.offer(None) *>
          Logger[IO].debug("infoset queue completed")
      }

    override def startElement(pstate: PState, processor: Parser): Unit =
      dispatcher.unsafeRunSync {
        // Generating the infoset requires a PState, not a StateForDebugger, so we can't generate it later from the Event.StartElement (which contains the StateForDebugger).
        lazy val setInfoset = {
          var node = pstate.infoset
          while (node.diParent != null) node = node.diParent
          node match {
            case d: DIDocument if d.contents.size == 0 => IO.unit
            case _                                     => infoset.offer(Some(infosetToString(node)))
          }
        }

        logger.debug("pre-control await") *>
          // may block until external control says to unblock, for stepping behavior
          control.await
            .ifM(
              events.offer(Some(new Event.StartElement(pstate, isStepping = true))) *> setInfoset,
              events.offer(Some(new Event.StartElement(pstate, isStepping = false)))
            ) *>
          logger.debug("post-control await") *>
          logger.debug("pre-checkBreakpoints") *>
          // TODO: there's a race between the readers of `events` and `state`, so somebody could react to a hit breakpoint before the event data was committed
          checkBreakpoints(createLocation(pstate.schemaFileLocation))
      }

    def infosetToString(ie: InfosetElement): String = {
      val bos = new java.io.ByteArrayOutputStream()
      val xml = new XMLTextInfosetOutputter(bos, true)
      val iw = InfosetWalker(
        ie.asInstanceOf[DIElement],
        xml,
        walkHidden = false,
        ignoreBlocks = true,
        releaseUnneededInfoset = false
      )
      iw.walk(lastWalk = true)
      bos.toString("UTF-8")
    }

    /** If the current location is a breakpoint, pause the control and update the state to notify the breakpoint was hit. */
    def checkBreakpoints(location: DAPodil.Location): IO[Unit] =
      breakpoints
        .shouldBreak(location)
        .ifM(
          control.pause() *>
            state
              .offer(Some(DAPodil.Debugee.State.Stopped(DAPodil.Debugee.State.Stopped.Reason.BreakpointHit(location)))),
          IO.unit
        )

    def createLocation(loc: SchemaFileLocation): DAPodil.Location =
      DAPodil.Location(
        URI.create(loc.uriString).normalize,
        DAPodil.Line(loc.lineNumber.map(_.toInt).getOrElse(0))
      )

    override def endElement(pstate: PState, processor: Parser): Unit =
      dispatcher.unsafeRunSync {
        control.await *> // ensure no events while debugger is paused
          events.offer(Some(Event.EndElement(pstate.copyStateForDebugger)))
      }
  }

  object DaffodilDebugger {
    def resource(
        state: QueueSink[IO, Option[DAPodil.Debugee.State]],
        events: QueueSink[IO, Option[Event]],
        breakpoints: Breakpoints,
        control: Control,
        infoset: QueueSink[IO, Option[String]]
    ): Resource[IO, DaffodilDebugger] =
      for {
        dispatcher <- Dispatcher[IO]
      } yield new DaffodilDebugger(
        dispatcher,
        state,
        breakpoints,
        control,
        events,
        infoset
      )
  }
}
