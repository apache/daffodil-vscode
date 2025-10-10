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

trait DAPCompiler {
  def compile(
      schema: Path,
      rootName: Option[String],
      rootNamespace: Option[String],
      tunables: Map[String, String]
  ): IO[DataProcessor]
}

object DAPCompiler {
  def apply(): DAPCompiler =
    new DAPCompiler {
      def compile(
          schema: Path,
          rootName: Option[String],
          rootNamespace: Option[String],
          tunables: Map[String, String]
      ): IO[DataProcessor] =
        IO.blocking(
          Support.getProcessorFactory(schema, rootName, rootNamespace, tunables)
        ).ensureOr(pf => CompilationFailed(Support.parseDiagnosticList(pf.getDiagnostics)))(!_.isError())
          .map(_.onPath("/"))
    }

  case class CompilationFailed(seq: Seq[SDiagnostic]) extends Exception(seq.map(_.toString).mkString(", "))
}
