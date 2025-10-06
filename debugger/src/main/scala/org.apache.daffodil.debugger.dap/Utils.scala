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
import java.nio.ByteBuffer
import java.nio.file.Path
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
