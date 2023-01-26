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

import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import { PROJECT_ROOT } from './common'

suite('Daffodil Version', () => {
  const versionFile = path.join(PROJECT_ROOT, 'src/version.ts')
  const packageMapped = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'package.json')).toString()
  )

  suite('version', () => {
    test('version.ts should exist', (done) => {
      if (fs.existsSync(versionFile)) {
        done()
      } else {
        new Error('version.ts not created')
      }
    })

    test('version.ts version should be same as package.json', () => {
      let version = fs.readFileSync(versionFile).toString().trim()
      assert.strictEqual(
        version,
        `export const LIB_VERSION = "${packageMapped.version}";`
      )
    })
  })
})
