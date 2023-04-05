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
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import fs from 'fs'
import { DataEditWebView } from '../../dataEdit/dataEditWebView'
import { TEST_SCHEMA } from './common'
import { after, before } from 'mocha'
import {
  getClientVersion,
  getServerVersion,
  startServer,
  stopServerUsingPID,
} from '@omega-edit/client'

const appDataPath = XDGAppPaths({ name: 'omega_edit' }).data()
const testPort = 9009 // use a different port than the default for testing to avoid conflicts with running servers
const testHost = '127.0.0.1'
const dataEditorCommand = 'extension.data.edit'

suite('Data Editor Test Suite', () => {
  test('data edit command exists', async () => {
    assert.strictEqual(
      (await vscode.commands.getCommands()).includes(dataEditorCommand),
      true
    )
  })

  suite('Editor Service', () => {
    const pidFile = path.join(appDataPath, `test-serv-${testPort}.pid`)
    before(async () => {
      const serverPid = (await Promise.race([
        startServer(testPort, testHost, pidFile),
        new Promise((resolve, reject) => {
          setTimeout(
            () => reject(new Error('Server timed out after 10 seconds')),
            10000
          )
        }),
      ])) as number | undefined
      if (serverPid === undefined || serverPid <= 0) {
        throw new Error('Server failed to start or PID is invalid')
      }
    })

    after(async () => {
      await stopServerUsingPID(parseInt(fs.readFileSync(pidFile).toString()))
    })

    test('is running', async () => {
      // make sure there is a pid file for the server
      assert.strictEqual(fs.existsSync(pidFile), true)

      // make sure the server is listening on the configured port
      const wait_port = require('wait-port')
      const result = await wait_port({
        host: '127.0.0.1',
        port: testPort,
        output: 'silent',
      })
      assert.strictEqual(result.open, true)
    })
    test('server and client versions match', async () => {
      const clientVersion = getClientVersion()
      const serverVersion = await getServerVersion()
      assert.strictEqual(serverVersion, clientVersion)
    })
  })

  suite('Data Editor', () => {
    test('data editor opens', async () => {
      const dataEditWebView: DataEditWebView =
        await vscode.commands.executeCommand(dataEditorCommand, TEST_SCHEMA)
      assert.ok(dataEditWebView)
      assert.strictEqual(dataEditWebView.panel.active, true)
      assert.strictEqual(dataEditWebView.panel.title, 'Data Editor')
    })
  })
})
