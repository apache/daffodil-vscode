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
import * as daffodil from '../../daffodil'
import * as fs from 'fs'
import * as path from 'path'
import { Artifact } from '../../classes/artifact'
import { LIB_VERSION } from '../../version'
import { before, after } from 'mocha'
import { PROJECT_ROOT, TEST_SCHEMA } from './common'
import { osCheck } from '../../utils'

describe('Daffodfil', () => {
  const packageFile = path.join(PROJECT_ROOT, 'package-test.json')

  // Create test package.json before anything else happens
  before(() => {
    fs.writeFileSync(packageFile, JSON.stringify({ daffodilVersion: '0.0.0' }))
  })

  // Delete test package.json after all tests are done
  after(() => {
    fs.unlinkSync(packageFile)
  })

  // describe to test all functions work properly
  describe('interfaces', () => {
    it('DaffodilData functions properly', () => {
      const daffodilData: daffodil.DaffodilData = {
        bytePos1b: 100,
      }
      expect(daffodilData.bytePos1b).to.equal(100)
    })

    it('InfosetEvent functions properly (xml)', () => {
      const infosetEvent: daffodil.InfosetEvent = {
        content: 'This is xml content',
        mimeType: 'xml',
      }
      expect(infosetEvent.content).to.equal('This is xml content')
      expect(infosetEvent.mimeType).to.equal('xml')
    })

    it('InfosetEvent functions properly (json)', () => {
      const infosetEvent: daffodil.InfosetEvent = {
        content: 'This is json content',
        mimeType: 'json',
      }
      expect(infosetEvent.content).to.equal('This is json content')
      expect(infosetEvent.mimeType).to.equal('json')
    })

    it('InfosetOutput functions properly', () => {
      const infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }
      expect(infosetOutput.type).to.equal('console')
    })

    it('BuildInfo functions properly', () => {
      const allVersions = '1.0.0'
      const buildInfo: daffodil.BuildInfo = {
        version: allVersions,
        daffodilVersion: allVersions,
        scalaVersion: allVersions,
      }
      expect(allVersions)
        .to.equal(buildInfo.version)
        .and.to.equal(buildInfo.daffodilVersion)
        .and.to.equal(buildInfo.scalaVersion)
    })

    it('LaunchArgs functions properly', () => {
      const infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }
      const launchArgs: daffodil.LaunchArgs = {
        schemaPath: '/path/to/schema.xsd.xml',
        dataPath: '/path/to/data.jpg',
        stopOnEntry: true,
        infosetFormat: 'json',
        infosetOutput: infosetOutput,
      }
      expect(launchArgs.schemaPath).to.equal('/path/to/schema.xsd.xml')
      expect(launchArgs.dataPath).to.equal('/path/to/data.jpg')
      expect(launchArgs.stopOnEntry).to.be.true
      expect(launchArgs.infosetFormat).to.equal('json')
      expect(launchArgs.infosetOutput).to.equal(infosetOutput)
    })

    it('ConfigEvent functions properly', () => {
      const allVersions = '1.0.0'
      const infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }
      const buildInfo: daffodil.BuildInfo = {
        version: allVersions,
        daffodilVersion: allVersions,
        scalaVersion: allVersions,
      }
      const launchArgs: daffodil.LaunchArgs = {
        schemaPath: '/path/to/schema.xsd.xml',
        dataPath: '/path/to/data.jpg',
        stopOnEntry: true,
        infosetFormat: 'xml',
        infosetOutput: infosetOutput,
      }
      const configEvent: daffodil.ConfigEvent = {
        buildInfo: buildInfo,
        launchArgs: launchArgs,
      }
      expect(configEvent.buildInfo).to.equal(buildInfo)
      expect(configEvent.launchArgs).to.equal(launchArgs)
    })
  })

  // describe to test all constants get set properly
  describe('constants', () => {
    it('dataEvent set properly', () => {
      expect(daffodil.dataEvent).to.equal('daffodil.data')
    })

    it('infosetEvent set properly', () => {
      expect(daffodil.infosetEvent).to.equal('daffodil.infoset')
    })

    it('configEvent set properly', () => {
      expect(daffodil.configEvent).to.equal('daffodil.config')
    })
  })

  describe('getDaffodilVersion', () => {
    it('getDaffodilVersion returns same version as file', () => {
      expect(daffodil.getDaffodilVersion(packageFile)).to.equal('0.0.0')
    })
  })

  describe('non-debug specifc commands', () => {
    const nonDebugSpecificCmds = [
      'extension.dfdl-debug.debugEditorContents',
      'extension.dfdl-debug.runEditorContents',
      'launch.config',
    ]

    // This breaks when the omega-edit tests run for some reason
    // test('Available by default', () => {
    //   nonDebugSpecificCmds.forEach(async (cmd) => {
    //     assert.strictEqual(
    //       (await vscode.commands.getCommands()).includes(cmd),
    //       true
    //     )
    //   })
    // })

    it('Not available when inDebugMode', () => {
      vscode.commands.executeCommand('setContext', 'inDebugMode', true)
      nonDebugSpecificCmds.forEach(async (cmd) => {
        expect(await vscode.commands.getCommands()).to.not.include(cmd)
      })
    })
  })

  describe('debug specifc commands', () => {
    const debugSpecificCmds = [
      'extension.dfdl-debug.toggleFormatting',
      'hexview.display',
      'infoset.display',
      'infoset.diff',
      'infoset.save',
    ]

    it('Not available by default', () => {
      debugSpecificCmds.forEach(async (cmd) => {
        expect(await vscode.commands.getCommands()).to.not.include(cmd)
      })
    })

    // This breaks when the omega-edit tests run for some reason
    // test('Available when inDebugMode', () => {
    //   vscode.commands.executeCommand('setContext', 'inDebugMode', true)

    //   debugSpecificCmds.forEach(async (cmd) => {
    //     assert.strictEqual(
    //       (await vscode.commands.getCommands()).includes(cmd),
    //       true
    //     )
    //   })
    // })
  })

  describe('getCommands', () => {
    it('getProgramName file exists', async (done) => {
      expect(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getProgramName',
          TEST_SCHEMA
        )
      ).to.equal(TEST_SCHEMA)
      done()
    })

    it('getProgramName file does not exists', async (done) => {
      const file = path.join(__dirname, '../data/test.dfdl.xsd')
      expect(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getProgramName',
          file
        )
      ).to.not.equal(file)
      done()
    })

    it('getDataName file exists', async (done) => {
      expect(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName',
          TEST_SCHEMA
        )
      ).to.equal(TEST_SCHEMA)
      done()
    })

    it('getDataName file does not exists', async (done) => {
      const file = path.join(__dirname, '../data/test.dfdl.xsd')
      expect(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName',
          file
        )
      ).to.not.equal(file)
      done()
    })
  })

  describe('artifact attributes', () => {
    const packageName = 'daffodil-debugger'
    const packageVersion = '1.0.0'
    const scriptName = 'daffodil-debugger'
    const artifact = new Artifact(packageName, packageVersion, scriptName)

    it('name set properly', () => {
      expect(artifact.name).to.equal(
        `${packageName}-${packageVersion}-${LIB_VERSION}`
      )
    })

    it('archive set properly', () => {
      expect(artifact.archive).to.equal(
        `${packageName}-${packageVersion}-${LIB_VERSION}.zip`
      )
    })

    it('scriptName set properly', () => {
      expect(artifact.scriptName).to.equal(
        osCheck(`${scriptName}.bat`, `./${scriptName}`)
      )
    })
  })
})
