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
import java.nio.channels.Channels
import java.nio.file.Files
import java.nio.file.Path
import org.apache.daffodil.api._
import scala.jdk.CollectionConverters._
import cats.effect.IO
import cats.syntax.all._
import org.apache.daffodil.api.exceptions.ExternalVariableException

object Support {
  /* Daffodil DataProcessor wrapper methods */
  def loadCachedDataProcessor(cachePath: Path): IO[Option[DataProcessor]] =
    IO.blocking {
      if (!Files.exists(cachePath)) None
      else {
        try Some(reloadDataProcessor(cachePath))
        catch {
          case _: Throwable =>
            Files.deleteIfExists(cachePath)
            None
        }
      }
    }

  def saveCachedDataProcessor(cachePath: Path, processor: DataProcessor): IO[Unit] =
    IO.blocking {
      Files.createDirectories(cachePath.getParent)
      val output = Files.newOutputStream(cachePath)
      try processor.save(Channels.newChannel(output))
      finally output.close()
    }.handleError(_ => ())

  def dataProcessorWithDebugger(
      p: DataProcessor,
      debugger: Debugger,
      variables: Map[String, String]
  ): IO[(DataProcessor, List[String])] = {
    val base = p.withDebugger(debugger)

    variables.toList
      .foldLeftM((base, List.empty[String])) { case ((dp, warnings), (k, v)) =>
        IO(dp.withExternalVariables(Map(k -> v).asJava)).map((_, warnings)).handleErrorWith {
          case e: ExternalVariableException =>
            IO.pure((dp, warnings :+ s"Skipping unknown external variable '$k': ${e.getMessage}"))
          case e => IO.raiseError(e)
        }
      }
      .map { case (dp, warnings) => (dp.withValidation("daffodil"), warnings) }
  }

  private def reloadDataProcessor(cachePath: Path): DataProcessor = {
    val input = Files.newInputStream(cachePath)
    try Daffodil.compiler().reload(Channels.newChannel(input))
    finally input.close()
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
  /* Method to convert java list of diagnostics to a sequence of diagnostics */
  def parseDiagnosticList(
      dl: java.util.List[org.apache.daffodil.api.Diagnostic]
  ): Seq[org.apache.daffodil.api.Diagnostic] =
    dl.asScala.toSeq

  /* Daffodil infoset wrapper methods */
  def getInputSourceDataInputStream(data: InputStream): InputSourceDataInputStream =
    Daffodil.newInputSourceDataInputStream(data)

  def getInfosetOutputter(infosetFormat: String, stream: OutputStream): InfosetOutputter =
    infosetFormat match {
      case "xml"  => Daffodil.newXMLTextInfosetOutputter(stream, true)
      case "json" => Daffodil.newJsonInfosetOutputter(stream, true)
      case other  => throw new IllegalArgumentException(s"unsupported infosetFormat: $other")
    }
}
