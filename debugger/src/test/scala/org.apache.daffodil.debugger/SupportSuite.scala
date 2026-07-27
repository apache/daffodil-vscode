/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cats.effect.unsafe.implicits.global
import java.nio.file.Files
import munit.FunSuite
import org.apache.daffodil.debugger.dap.Support

class SupportSuite extends FunSuite {
  test("loadCachedDataProcessor treats invalid cache as missing") {
    val tempDir = Files.createTempDirectory("support-cache-test")
    val cachePath = tempDir.resolve("invalid.bin")
    Files.write(cachePath, "not-a-valid-parser".getBytes("UTF-8"))

    try {
      val result = Support.loadCachedDataProcessor(cachePath).unsafeRunSync()
      assertEquals(result, None)
      assert(!Files.exists(cachePath))
    } finally {
      Files.deleteIfExists(cachePath)
      Files.deleteIfExists(tempDir)
      ()
    }
  }
}
