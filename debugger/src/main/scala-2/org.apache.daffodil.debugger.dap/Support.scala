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

/** This file contains support code for making a majority of Scala shareable between different versions of Scala and
  * Daffodil. The main difference comes in package names, converting certain variables, etc. This file has all the
  * helper code for that for Scala 2.13.
  */

package org.apache.daffodil.debugger.dap

import java.io._
import java.nio.file.Path
import org.apache.daffodil.sapi._
import org.apache.daffodil.sapi.io.InputSourceDataInputStream
import org.apache.daffodil.sapi.infoset.{JsonInfosetOutputter, XMLTextInfosetOutputter}

object Support {
  /* Daffodil DataProcessor wrapper methods */
  def dataProcessorWithDebugger(
      p: DataProcessor,
      debugger: org.apache.daffodil.runtime1.debugger.Debugger,
      variables: Map[String, String]
  ): DataProcessor =
    p.withDebugger(debugger)
      .withDebugging(true)
      .withExternalVariables(variables)
      .withValidationMode(ValidationMode.Limited)

  /* Daffodil infoset wrapper methods */
  def getInputSourceDataInputStream(data: InputStream): InputSourceDataInputStream = new InputSourceDataInputStream(
    data
  )
  def getInfosetOutputter(infosetFormat: String, stream: OutputStream): InfosetOutputter =
    infosetFormat match {
      case "xml"  => new XMLTextInfosetOutputter(stream, true)
      case "json" => new JsonInfosetOutputter(stream, true)
    }

  /* Daffodil ProcessorFactory wrapper methods */
  def getProcessorFactory(
      schema: Path,
      rootName: Option[String],
      rootNamespace: Option[String],
      tunables: Map[String, String]
  ): ProcessorFactory =
    Daffodil
      .compiler()
      .withTunables(tunables)
      .compileFile(
        schema.toFile(),
        rootName,
        rootNamespace
      )

  /* Method to parse diagnostic list, this only necessary in scala 3 but to make everything match this is needed. */
  def parseDiagnosticList(dl: Seq[org.apache.daffodil.sapi.Diagnostic]): Seq[org.apache.daffodil.sapi.Diagnostic] = dl
}
