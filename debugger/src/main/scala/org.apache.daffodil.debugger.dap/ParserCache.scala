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

import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path, Paths}
import java.nio.file.attribute.BasicFileAttributes
import java.security.MessageDigest

object ParserCache {
  private val cacheRoot =
    Paths.get(System.getProperty("java.io.tmpdir"), "daffodil-vscode", "saved-parsers")

  def cachePath(
      schema: Path,
      rootName: Option[String],
      rootNamespace: Option[String],
      tunables: Map[String, String],
      variables: Map[String, String]
  ): Path =
    cacheRoot.resolve(s"${schemaKey(schema, rootName, rootNamespace, tunables, variables)}.bin")

  private def schemaKey(
      schema: Path,
      rootName: Option[String],
      rootNamespace: Option[String],
      tunables: Map[String, String],
      variables: Map[String, String]
  ): String = {
    val digest = MessageDigest.getInstance("SHA-256")

    def update(value: String): Unit =
      digest.update(value.getBytes(StandardCharsets.UTF_8))

    def updateSchemaMetadata(path: Path): Unit = {
      val attrs = Files.readAttributes(path, classOf[BasicFileAttributes])
      update(attrs.lastModifiedTime().toMillis.toString)
      update(attrs.size().toString)
    }

    update(schema.toAbsolutePath.normalize.toString)
    updateSchemaMetadata(schema)
    update(rootName.getOrElse(""))
    update(rootNamespace.getOrElse(""))
    tunables.toSeq.sortBy(_._1).foreach { case (key, value) =>
      update(key)
      update(value)
    }
    variables.toSeq.sortBy(_._1).foreach { case (key, value) =>
      update(key)
      update(value)
    }
    update(BuildInfo.version)

    digest.digest().map(byte => f"$byte%02x").mkString
  }
}
