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

/** Data Left Over Utils */
object DataLeftOverUtils {

  /** Get the next word from a byte array, starting at the given index */
  def getNextWord(bytes: Array[Byte], startIndex: Int): Option[String] = {
    if (startIndex >= bytes.length) return None // Handle out-of-bounds case

    var i = startIndex

    // Step 1: Skip leading whitespace
    while (i < bytes.length && bytes(i).toChar.isWhitespace) i += 1
    if (i >= bytes.length) return None // No word found

    val wordStart = i // Mark start of the word

    // Step 2: Extract word until next whitespace
    while (i < bytes.length && !bytes(i).toChar.isWhitespace) i += 1

    val word = new String(bytes, wordStart, i - wordStart, StandardCharsets.UTF_8) // Convert to string
    Some(word) // Return word and next starting index
  }

  /** Get message based on dataContext, bytePos1b, bitsRead and leftOverBits */
  def getMessage(dataContents: Array[Byte], bytePos1b: Long, bitsRead: Long, leftOverBits: Long): String = {
    var outputString = s"Left over data. Consumed ${bitsRead} bit(s), with at least ${leftOverBits} bit(s) remaining.\n"

    val spaceSymbol: String = "\u2423"
    val firstWord = this.getNextWord(dataContents, (bytePos1b - 1).toInt).getOrElse("")
    val secondWord =
      this.getNextWord(dataContents, ((bytePos1b - 1) + firstWord.length).toInt).getOrElse("")

    if (firstWord != "" && secondWord != "") {
      val dataText = s"${firstWord} ${secondWord}"
      outputString += s"Left over data (UTF-8) starting at byte ${bytePos1b} is: (${dataText.replaceAll(" ", s"${spaceSymbol}")}...).\n"
      outputString += s"Left over data (Hex) starting at byte ${bytePos1b} is: (0x${dataText
          .getBytes("UTF-8")
          .map { a =>
            f"$a%02x"
          }
          .mkString}...)."
    }

    outputString
  }
}
