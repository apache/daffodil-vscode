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
import * as path from 'path'
import { PROJECT_ROOT } from './common'

suite('OmegaEdit Client Logger Test Suite', () => {
  test('getLogger works without explicit setup', () => {
    const loggerModulePath = path.join(
      PROJECT_ROOT,
      'node_modules',
      '@omega-edit',
      'client',
      'dist',
      'cjs',
      'logger.js'
    )
    delete require.cache[require.resolve(loggerModulePath)]

    const loggerModule = require(loggerModulePath) as {
      getLogger: () => {
        info: (...args: unknown[]) => void
        isLevelEnabled: (level: string) => boolean
      }
    }

    const logger = loggerModule.getLogger()
    assert.ok(logger)
    assert.strictEqual(typeof logger.info, 'function')
    assert.strictEqual(logger.isLevelEnabled('info'), true)
  })
})
