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

import { expect } from 'chai'
import * as path from 'path'
import { DebugClient } from '@vscode/debugadapter-testsupport'
import { TEST_SCHEMA, PROJECT_ROOT } from './common'
import { setup } from 'mocha'

describe('Daffodil Debug Adapter', () => {
  const DEBUG_ADAPTER = path.join(PROJECT_ROOT, 'out/adapter/debugAdapter.js')

  let client: DebugClient

  before(() => {
    client = new DebugClient('node', DEBUG_ADAPTER, 'dfdl')
    return client.start()
  })

  after(() => client.stop())

  describe('basic', () => {
    it('unknown request should produce error', async (done) => {
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

  describe('initialize', () => {
    it('should return supported features', async (done) => {
      return client.initializeRequest().then((response) => {
        response.body = response.body || {}
        expect(response.body.supportsConfigurationDoneRequest).to.be.true
        done()
      })
    })

    it("should produce error for invalid 'pathFormat'", async (done) => {
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

  describe('launch', () => {
    it('should run program to the end', () => {
      return Promise.all([
        client.configurationSequence(),
        client.launch({ program: TEST_SCHEMA }),
        client.waitForEvent('terminated'),
      ])
    })

    it('should stop on entry', () => {
      const ENTRY_LINE = 1
      return Promise.all([
        client.configurationSequence(),
        client.launch({ program: TEST_SCHEMA, stopOnEntry: true }),
        client.assertStoppedLocation('entry', { line: ENTRY_LINE }),
      ])
    })
  })
})
