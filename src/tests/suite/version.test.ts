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
import { parse as jsoncParse } from 'jsonc-parser'
import {
  DEFAULT_DAFFODIL_VERSION,
  getDaffodilVersionOptions,
} from '../../launchWizard/launchWizard'

suite('Daffodil Version', () => {
  const versionFile = path.join(PROJECT_ROOT, 'src/version.ts')
  const packageMapped = jsoncParse(
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
      const version = require('../../version').LIB_VERSION
      assert.strictEqual(version, packageMapped.version)
    })

    test('launch wizard exposes the supported Daffodil version options', () => {
      const options = getDaffodilVersionOptions('4.1.0')

      assert.ok(options.includes('value="3.9.0"'))
      assert.ok(options.includes('value="3.10.0"'))
      assert.ok(options.includes('value="3.11.0"'))
      assert.ok(options.includes('value="4.0.0"'))
      assert.ok(options.includes('value="4.1.0"'))
      assert.ok(options.includes('value="4.2.0"'))
      assert.ok(options.includes('selected'))
      assert.ok(options.includes('>4.1.0<'))
    })

    test('launch wizard defaults the Daffodil version to 4.2.0', () => {
      assert.strictEqual(DEFAULT_DAFFODIL_VERSION, '4.2.0')
      assert.ok(
        getDaffodilVersionOptions(undefined).includes('value="4.2.0" selected')
      )
      assert.ok(
        getDaffodilVersionOptions('9.9.9').includes('value="4.2.0" selected')
      )
    })
  })
})
