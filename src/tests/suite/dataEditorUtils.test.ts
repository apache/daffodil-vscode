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
import { isDFDLDebugSession } from '../../dataEditor/include/utils'

suite('Data Editor Utils Test Suite', () => {
  const dfdlSession = {
    type: 'dfdl',
    configuration: {
      type: 'dfdl',
      name: 'Test DFDL Session',
      request: 'launch',
      data: '/path/to/data',
    },
  }

  test('A DFDL debug session is active without a file context', () => {
    assert.strictEqual(isDFDLDebugSession(dfdlSession), true)
  })

  test('A file-specific check still requires the matching data file', () => {
    assert.strictEqual(isDFDLDebugSession(dfdlSession, '/path/to/data'), true)
    assert.strictEqual(isDFDLDebugSession(dfdlSession, '/path/to/other'), false)
  })

  test('A non-DFDL debug session is not active for DFDL commands', () => {
    assert.strictEqual(
      isDFDLDebugSession(
        {
          type: 'node',
          configuration: {
            type: 'node',
            name: 'Test Node Session',
            request: 'launch',
            data: '/path/to/data',
          },
        },
        '/path/to/data'
      ),
      false
    )
  })

  test('No debug session is not active', () => {
    assert.strictEqual(isDFDLDebugSession(undefined), false)
  })
})
