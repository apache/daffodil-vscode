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

import cats.effect.IO
import cats.syntax.all._
import java.nio.file.Path
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

trait DAPCompiler {
  def compile(
      schema: Path,
      rootName: Option[String],
      rootNamespace: Option[String],
      tunables: Map[String, String],
      variables: Map[String, String]
  ): IO[DataProcessor]
}

object DAPCompiler {
  implicit val logger: Logger[IO] = Slf4jLogger.getLogger

  def apply(): DAPCompiler =
    new DAPCompiler {
      def compile(
          schema: Path,
          rootName: Option[String],
          rootNamespace: Option[String],
          tunables: Map[String, String],
          variables: Map[String, String]
      ): IO[DataProcessor] =
        {
          val cachePath = ParserCache.cachePath(schema, rootName, rootNamespace, tunables, variables)

          def compileFresh: IO[DataProcessor] =
            Logger[IO].info(s"Compiling schema and saving parser cache at $cachePath") *>
              IO.blocking(
                Support.getProcessorFactory(schema, rootName, rootNamespace, tunables)
              ).ensureOr(pf => CompilationFailed(Support.parseDiagnosticList(pf.getDiagnostics)))(!_.isError())
                .map(_.onPath("/"))
                .flatTap(processor => Support.saveCachedDataProcessor(cachePath, processor))

          Support
            .loadCachedDataProcessor(cachePath)
            .attempt
            .flatMap {
              case Right(Some(processor)) =>
                Logger[IO].info(s"Loaded cached parser from $cachePath") *> IO.pure(processor)
              case Right(None) =>
                Logger[IO].info(s"No usable cached parser found at $cachePath; compiling fresh") *> compileFresh
              case Left(t) =>
                Logger[IO].warn(t)(s"Failed to load cached parser from $cachePath; recompiling") *>
                  compileFresh
            }
        }
    }

  case class CompilationFailed(seq: Seq[SDiagnostic]) extends Exception(seq.map(_.toString).mkString(", "))
}
