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

import java.io._
import java.net.URL
import java.nio.ByteBuffer
import java.nio.file.{Files, Path}
import java.util.zip.ZipInputStream
import org.apache.daffodil.io.DataDumper

/** Data Left Over Utils */
object DataLeftOverUtils {

  /** Get message based on dataFilePath, bitPos1bm bytePos1b and leftOverBits */
  def getMessage(dataFilePath: Path, bitPos1b: Long, bytePos1b: Long, leftOverBits: Long): String = {
    val leftOverBitsText =
      s"Left over data. Consumed ${bitPos1b - 1} bit(s), with at least ${leftOverBits} bit(s) remaining.\n"

    val Dump = new DataDumper

    val numBytes = math.min(8, (leftOverBits / 8)).toInt

    // read to byte array starting where the parse ended
    val f = new RandomAccessFile(dataFilePath.toFile, "r")
    val bytes = new Array[Byte](numBytes)
    f.seek(bytePos1b - 1)
    f.readFully(bytes)
    f.close

    // convert those bytes to hex/binary
    val dumpString =
      if (bytes.length > 0)
        Dump
          .dump(
            Dump.TextOnly(Some("utf-8")),
            0,
            bytes.length * 8,
            ByteBuffer.wrap(bytes),
            includeHeadingLine = false
          )
          .mkString("\n")
      else ""

    val dataHex =
      if (bytes.length > 0)
        s"Left over data (Hex) starting at byte ${bytePos1b} is: (0x${bytes.map { a =>
            f"$a%02x"
          }.mkString}...)\n"
      else ""

    val dataText =
      if (bytes.length > 0)
        s"Left over data (UTF-8) starting at byte ${bytePos1b} is: (${dumpString}...)"
      else ""

    leftOverBitsText + dataHex + dataText
  }
}

/** Download and extract utils */
object DownloadExtractUtils {

  /** Method to download and extract a zip file given a URL to a specified directory
    *
    * @param url
    * @param targetDir
    */
  def downloadAndUnzip(url: String, targetDir: Path): Unit = {
    val connection = new URL(url).openConnection()
    connection.setConnectTimeout(10000)
    connection.setReadTimeout(60000)

    val in = new BufferedInputStream(connection.getInputStream, 64 * 1024)
    val zipStream = new ZipInputStream(in)

    try
      unzip(zipStream, targetDir.toFile)
    finally
      zipStream.close()
  }

  /** Method to unzip a zip file from given a zip stream to a specified directory
    *
    * @param zipStream
    * @param targetDir
    */
  def unzip(zipStream: ZipInputStream, targetDir: File): Unit = {
    if (!targetDir.exists()) {
      val _ = targetDir.mkdirs()
    }

    val buffer = new Array[Byte](64 * 1024) // 64 KB buffer

    var entry = zipStream.getNextEntry
    while (entry != null) {
      val outPath = new File(targetDir, entry.getName)

      if (entry.isDirectory) {
        outPath.mkdirs()
      } else {
        outPath.getParentFile.mkdirs()

        val out = new BufferedOutputStream(Files.newOutputStream(outPath.toPath))

        try {
          var len = zipStream.read(buffer)

          while (len != -1) {
            out.write(buffer, 0, len)
            len = zipStream.read(buffer)
          }
        } finally out.close()
      }

      zipStream.closeEntry()
      entry = zipStream.getNextEntry
    }
  }
}
