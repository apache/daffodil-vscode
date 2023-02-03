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
import { after, before } from 'mocha'
import * as path from 'path'
import * as vscode from 'vscode'
import { Artifact, Backend } from '../../classes/artifact'
import { DataEditWebView } from '../../omega_edit/dataEditWebView'
import * as omegaEditClient from '../../omega_edit/client'
import { killProcess, osCheck, runScript, unzipFile } from '../../utils'
import { PACKAGE_PATH, PROJECT_ROOT, TEST_SCHEMA } from './common'
import { initOmegaEditClient } from '../../omega_edit/utils'
import wait_port from 'wait-port'

const omegaEditPackagePath = path.join(PROJECT_ROOT, 'node_modules/omega-edit')
const omegaEditVersion =
  omegaEditClient.getOmegaEditPackageVersion(PACKAGE_PATH)
const localArtifact = new Artifact(
  'omega-edit-grpc-server',
  omegaEditVersion,
  'omega-edit-grpc-server'
)
const extractedFolder = path.join(PROJECT_ROOT, localArtifact.name)
const port = 9000

export async function runServerForTests() {
  fs.copyFileSync(
    `${omegaEditPackagePath}/${localArtifact.name}.zip`,
    `${extractedFolder}.zip`
  )
  await unzipFile(`${extractedFolder}.zip`, PROJECT_ROOT)
  initOmegaEditClient('127.0.0.1', port)
  return await runScript(
    `${extractedFolder}`,
    localArtifact.scriptName,
    null,
    ['--port', port.toString()],
    {
      OMEGA_EDIT_SERVER_PORT: port.toString(),
    },
    '',
    false,
    port
  )
}

suite('omega-edit Test Suite', () => {
  let terminal: vscode.Terminal

  before(async () => {
    terminal = await runServerForTests()
  })

  after(async () => {
    await terminal.processId.then(async (id) => await killProcess(id))
    fs.rmSync(`${PROJECT_ROOT}/${localArtifact.name}.zip`)
    fs.rmSync(`${PROJECT_ROOT}/${localArtifact.name}`, {
      recursive: true,
      force: true,
    })
  })

  test('Ωedit version command exists', async () => {
    assert.strictEqual(
      (await vscode.commands.getCommands()).includes('omega_edit.version'),
      true
    )
  })

  test('data edit command exists', async () => {
    // DEBUG: dump the registered commands to a file in the temp directory
    fs.writeFileSync(
      '/tmp/commands.txt',
      (await vscode.commands.getCommands()).sort().join('\n')
    )
    assert.strictEqual(
      (await vscode.commands.getCommands()).includes('data.edit'),
      true
    )
  })

  suite('artifact attributes', () => {
    const packageName = 'omega-edit-grpc-server'
    const packageVersion = '1.0.0'
    const scriptName = 'omega-edit-grpc-server'
    const artifact = new Artifact(packageName, packageVersion, scriptName)
    const backend = new Backend('ctc-oss', 'omega-edit')

    test('name set properly', () => {
      assert.strictEqual(artifact.name, `${packageName}-${packageVersion}`)
    })

    test('archive set properly', () => {
      assert.strictEqual(
        artifact.archive,
        `${packageName}-${packageVersion}.zip`
      )
    })

    test('scriptName set properly', () => {
      assert.strictEqual(
        artifact.scriptName,
        osCheck(`${scriptName}.bat`, `./${scriptName}`)
      )
    })

    test('archiveUrl set properly', () => {
      const url = artifact.archiveUrl(backend)

      assert.strictEqual(url.includes('ctc-oss'), true)
      assert.strictEqual(url.includes('omega-edit'), true)
      assert.strictEqual(url.includes(`v${packageVersion}`), true)
      assert.strictEqual(
        url.includes(`${packageName}-${packageVersion}.zip`),
        true
      )
    })
  })

  test('running omega-edit server', async () => {
    assert.strictEqual(
      await wait_port({ host: '127.0.0.1', port: port, output: 'silent' }),
      true
    )
  })

  suite('omega-edit commands', () => {
    test('omega_edit.version returns correct version', async () => {
      const version = await vscode.commands.executeCommand(
        'omega_edit.version',
        false,
        port
      )
      assert.ok(version)
      assert.strictEqual(
        version,
        'v' + omegaEditClient.getOmegaEditPackageVersion(PACKAGE_PATH)
      )
    })

    test('data editor opens', async () => {
      const dataEditWebView: DataEditWebView =
        await vscode.commands.executeCommand(
          'data.edit',
          TEST_SCHEMA,
          false,
          false,
          port
        )
      assert.ok(dataEditWebView)
      assert.strictEqual(dataEditWebView.panel.active, true)
      assert.strictEqual(dataEditWebView.panel.title, 'Data Editor')
    })
  })
})
