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
  * helper code for that for Scala 3.
  */

package org.apache.daffodil.debugger.dap

import java.io._
import java.nio.file.Path
import org.apache.daffodil.api._
import scala.jdk.CollectionConverters._

object Support {
  /* Daffodil DataProcessor wrapper methods */
  def dataProcessorWithDebugger(p: DataProcessor, debugger: Debugger, variables: Map[String, String]): DataProcessor =
    p.withDebugger(debugger)
      .withExternalVariables(variables.asJava)
      .withValidation("daffodil")

  /* Daffodil infoset wrapper methods */
  def getInputSourceDataInputStream(data: InputStream): InputSourceDataInputStream =
    Daffodil.newInputSourceDataInputStream(data)
  def getInfosetOutputter(infosetFormat: String, stream: OutputStream): InfosetOutputter =
    infosetFormat match {
      case "xml"  => Daffodil.newXMLTextInfosetOutputter(stream, true)
      case "json" => Daffodil.newJsonInfosetOutputter(stream, true)
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
      .withTunables(tunables.asJava)
      .compileFile(schema.toFile(), rootName.orNull, rootNamespace.orNull)

  /* Method to convert java list of diagnostics to a sequence of diagnostics */
  def parseDiagnosticList(
      dl: java.util.List[org.apache.daffodil.api.Diagnostic]
  ): Seq[org.apache.daffodil.api.Diagnostic] =
    dl.asScala.toSeq
}
