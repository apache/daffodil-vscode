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

import * as vscode from 'vscode'
import { expect } from 'chai'
import * as path from 'path'
import { Artifact, Backend } from '../../classes/artifact'
import * as omegaEditClient from '../../omega_edit/client'
import { unzipFile, runScript, killProcess, osCheck } from '../../utils'
import { before, after } from 'mocha'
import * as fs from 'fs'
import { PROJECT_ROOT, PACKAGE_PATH, TEST_SCHEMA } from './common'
import { initOmegaEditClient } from '../../omega_edit/utils'

const wait_port = require('wait-port')

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
  initOmegaEditClient('127.0.0.1', port.toString())
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

describe('omega-edit Test Suite', () => {
  let terminal: vscode.Terminal

  before(async (done) => {
    terminal = await runServerForTests()
    done()
  })

  after(async (done) => {
    await terminal.processId.then(async (id) => await killProcess(id))
    fs.rmSync(`${PROJECT_ROOT}/${localArtifact.name}.zip`)
    fs.rmSync(`${PROJECT_ROOT}/${localArtifact.name}`, {
      recursive: true,
      force: true,
    })
    done()
  })

  it('Test toggle.experimental', async (done) => {
    // omega-edit related commands should be hidden
    expect(await vscode.commands.getCommands())
      .to.not.include('omega_edit.version')
      .and.to.not.include('data.edit')

    // Toggle experimental features to be enabled
    await vscode.commands.executeCommand('toggle.experimental', true)

    // omega-edit related commands should not longer be hidden
    expect(await vscode.commands.getCommands())
      .to.include('omega_edit.version')
      .and.to.include('data.edit')
    done()
  })

  describe('artifact attributes', () => {
    const packageName = 'omega-edit-scala-server'
    const packageVersion = '1.0.0'
    const scriptName = 'omega-edit-grpc-server'
    const artifact = new Artifact(packageName, packageVersion, scriptName)
    const backend = new Backend('ctc-oss', 'omega-edit')

    it('name set properly', () => {
      expect(artifact.name).to.equal(`${packageName}-${packageVersion}`)
    })

    it('archive set properly', () => {
      expect(artifact.archive).to.equal(`${packageName}-${packageVersion}.zip`)
    })

    it('scriptName set properly', () => {
      expect(artifact.scriptName).to.equal(
        osCheck(`${scriptName}.bat`, `./${scriptName}`)
      )
    })

    it('archiveUrl set properly', () => {
      expect(artifact.archiveUrl(backend))
        .to.include('ctc-oss')
        .and.to.include('omega-edit')
        .and.to.include(`${packageName}-${packageVersion}.zip`)
    })
  })

  it('running omega-edit server', async (done) => {
    expect(await wait_port({ host: '127.0.0.1', port: 9000, output: 'silent' }))
      .to.be.true
    done()
  })

  describe('omega-edit commands', () => {
    it('omega_edit.version returns correct version', async (done) => {
      const version: string = await vscode.commands.executeCommand(
        'omega_edit.version',
        false
      )
      expect(version).to.equal(
        'v' + omegaEditClient.getOmegaEditPackageVersion(PACKAGE_PATH)
      )
      done()
    })

    it('data editor opens', async (done) => {
      const panel: vscode.WebviewPanel = await vscode.commands.executeCommand(
        'data.edit',
        TEST_SCHEMA,
        false,
        false,
        port
      )
      expect(panel.active).to.be.true
      done()
    })
  })
})
