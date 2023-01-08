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
import * as assert from 'assert'
import * as daffodil from '../../daffodil'
import * as fs from 'fs'
import * as path from 'path'
import { Artifact } from '../../classes/artifact'
import { LIB_VERSION } from '../../version'
import { before, after } from 'mocha'
import { PROJECT_ROOT, TEST_SCHEMA } from './common'
import { osCheck } from '../../utils'

suite('Daffodfil', () => {
  const packageFile = path.join(PROJECT_ROOT, 'package-test.json')

  // Create test package.json before anything else happens
  before(() => {
    fs.writeFileSync(packageFile, JSON.stringify({ daffodilVersion: '0.0.0' }))
  })

  // Delete test package.json after all tests are done
  after(() => {
    fs.unlinkSync(packageFile)
  })

  // suite to test all functions work properly
  suite('interfaces', () => {
    test('DaffodilData functions properly', () => {
      let daffodilData: daffodil.DaffodilData = {
        bytePos1b: 100,
      }

      assert.strictEqual(100, daffodilData.bytePos1b)
    })

    test('InfosetEvent functions properly (xml)', () => {
      let infosetEvent: daffodil.InfosetEvent = {
        content: 'This is xml content',
        mimeType: 'xml',
      }

      assert.strictEqual('This is xml content', infosetEvent.content)
      assert.strictEqual('xml', infosetEvent.mimeType)
    })

    test('InfosetEvent functions properly (json)', () => {
      let infosetEvent: daffodil.InfosetEvent = {
        content: 'This is json content',
        mimeType: 'json',
      }

      assert.strictEqual('This is json content', infosetEvent.content)
      assert.strictEqual('json', infosetEvent.mimeType)
    })

    test('InfosetOutput functions properly', () => {
      let infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }

      assert.strictEqual('console', infosetOutput.type)
    })

    test('BuildInfo functions properly', () => {
      let allVersions = '1.0.0'
      let buildInfo: daffodil.BuildInfo = {
        version: allVersions,
        daffodilVersion: allVersions,
        scalaVersion: allVersions,
      }

      assert.strictEqual(allVersions, buildInfo.version)
      assert.strictEqual(allVersions, buildInfo.daffodilVersion)
      assert.strictEqual(allVersions, buildInfo.scalaVersion)
    })

    test('LaunchArgs functions properly', () => {
      let infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }

      let launchArgs: daffodil.LaunchArgs = {
        schemaPath: '/path/to/schema.xsd.xml',
        dataPath: '/path/to/data.jpg',
        stopOnEntry: true,
        infosetFormat: 'json',
        infosetOutput: infosetOutput,
      }

      assert.strictEqual('/path/to/schema.xsd.xml', launchArgs.schemaPath)
      assert.strictEqual('/path/to/data.jpg', launchArgs.dataPath)
      assert.strictEqual(true, launchArgs.stopOnEntry)
      assert.strictEqual('json', launchArgs.infosetFormat)
      assert.strictEqual(infosetOutput, launchArgs.infosetOutput)
    })

    test('ConfigEvent functions properly', () => {
      let allVersions = '1.0.0'
      let infosetOutput: daffodil.InfosetOutput = {
        type: 'console',
      }
      let buildInfo: daffodil.BuildInfo = {
        version: allVersions,
        daffodilVersion: allVersions,
        scalaVersion: allVersions,
      }
      let launchArgs: daffodil.LaunchArgs = {
        schemaPath: '/path/to/schema.xsd.xml',
        dataPath: '/path/to/data.jpg',
        stopOnEntry: true,
        infosetFormat: 'xml',
        infosetOutput: infosetOutput,
      }

      let configEvent: daffodil.ConfigEvent = {
        buildInfo: buildInfo,
        launchArgs: launchArgs,
      }

      assert.strictEqual(buildInfo, configEvent.buildInfo)
      assert.strictEqual(launchArgs, configEvent.launchArgs)
    })
  })

  // suite to test all constants get set properly
  suite('constants', () => {
    test('dataEvent set properly', () => {
      assert.strictEqual(daffodil.dataEvent, 'daffodil.data')
    })

    test('infosetEvent set properly', () => {
      assert.strictEqual(daffodil.infosetEvent, 'daffodil.infoset')
    })

    test('configEvent set properly', () => {
      assert.strictEqual(daffodil.configEvent, 'daffodil.config')
    })
  })

  suite('getDaffodilVersion', () => {
    test('getDaffodilVersion returns same version as file', () => {
      var daffodilVersion = daffodil.getDaffodilVersion(packageFile)
      assert.strictEqual(daffodilVersion, '0.0.0')
    })
  })

  suite('non-debug specifc commands', () => {
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

    test('Not available when inDebugMode', () => {
      vscode.commands.executeCommand('setContext', 'inDebugMode', true)

      nonDebugSpecificCmds.forEach(async (cmd) => {
        assert.strictEqual(
          (await vscode.commands.getCommands()).includes(cmd),
          false
        )
      })
    })
  })

  suite('debug specifc commands', () => {
    const debugSpecificCmds = [
      'extension.dfdl-debug.toggleFormatting',
      'hexview.display',
      'infoset.display',
      'infoset.diff',
      'infoset.save',
    ]

    test('Not available by default', () => {
      debugSpecificCmds.forEach(async (cmd) => {
        assert.strictEqual(
          (await vscode.commands.getCommands()).includes(cmd),
          false
        )
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

  suite('getCommands', () => {
    test('getProgramName file exists', async () => {
      assert.strictEqual(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getProgramName',
          TEST_SCHEMA
        ),
        TEST_SCHEMA
      )
    })

    test('getProgramName file does not exists', async () => {
      let file = path.join(__dirname, '../data/test.dfdl.xsd')

      assert.notStrictEqual(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getProgramName',
          file
        ),
        file
      )
    })

    test('getDataName file exists', async () => {
      assert.strictEqual(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName',
          TEST_SCHEMA
        ),
        TEST_SCHEMA
      )
    })

    test('getDataName file does not exists', async () => {
      let file = path.join(__dirname, '../data/test.dfdl.xsd')

      assert.notStrictEqual(
        await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName',
          file
        ),
        file
      )
    })
  })

  suite('artifact attributes', () => {
    const packageName = 'daffodil-debugger'
    const packageVersion = '1.0.0'
    const scriptName = 'daffodil-debugger'
    const artifact = new Artifact(packageName, packageVersion, scriptName)

    test('name set properly', () => {
      assert.strictEqual(
        artifact.name,
        `${packageName}-${packageVersion}-${LIB_VERSION}`
      )
    })

    test('archive set properly', () => {
      assert.strictEqual(
        artifact.archive,
        `${packageName}-${packageVersion}-${LIB_VERSION}.zip`
      )
    })

    test('scriptName set properly', () => {
      assert.strictEqual(
        artifact.scriptName,
        osCheck(`${scriptName}.bat`, `./${scriptName}`)
      )
    })
  })
})
