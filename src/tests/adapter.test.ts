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
import { DebugClient } from 'vscode-debugadapter-testsupport'

suite('Daffodil Debug Adapter', () => {
  const DEBUG_ADAPTER = './out/adapter/debugAdapter.js'
  const PROJECT_ROOT = path.join(__dirname, '../../')
  const DATA_ROOT = path.join(PROJECT_ROOT, 'src/tests/data/')

  let client: DebugClient

  setup(() => {
    client = new DebugClient('node', DEBUG_ADAPTER, 'dfdl')
    return client.start()
  })

  teardown(() => client.stop())

  suite('basic', () => {
    test('unknown request should produce error', (done) => {
      client
        .send('illegal_request')
        .then(() => {
          done(new Error('does not report error on unknown request'))
        })
        .catch(() => {
          done()
        })
    })
  })

  suite('initialize', () => {
    test('should return supported features', () => {
      return client.initializeRequest().then((response) => {
        response.body = response.body || {}
        assert.strictEqual(response.body.supportsConfigurationDoneRequest, true)
      })
    })

    test("should produce error for invalid 'pathFormat'", (done) => {
      client
        .initializeRequest({
          adapterID: 'dfdl',
          linesStartAt1: true,
          columnsStartAt1: true,
          pathFormat: 'url',
        })
        .then((response) => {
          done(
            new Error("does not report error on invalid 'pathFormat' attribute")
          )
        })
        .catch((err) => {
          // error expected
          done()
        })
    })
  })

  suite('launch', () => {
    test('should run program to the end', () => {
      const PROGRAM = path.join(DATA_ROOT, 'test.dfdl.xsd')

      return Promise.all([
        client.configurationSequence(),
        client.launch({ program: PROGRAM }),
        client.waitForEvent('terminated'),
      ])
    })

    test('should stop on entry', () => {
      const PROGRAM = path.join(DATA_ROOT, 'test.dfdl.xsd')
      const ENTRY_LINE = 1

      return Promise.all([
        client.configurationSequence(),
        client.launch({ program: PROGRAM, stopOnEntry: true }),
        client.assertStoppedLocation('entry', { line: ENTRY_LINE }),
      ])
    })
  })
})
