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
import * as path from 'path'
import * as fs from 'fs'
import { PROJECT_ROOT, PACKAGE_PATH, TEST_SCHEMA } from './common'
import { getConfig, killProcess } from '../../utils'
import {
  daffodilArtifact,
  daffodilVersion,
  runDebugger,
  stopDebugging,
} from '../../daffodilDebugger'
import { before, after } from 'mocha'
import { DFDLDebugger } from '../../classes/dfdlDebugger'
import { DataEditorConfig } from '../../classes/dataEditor'

// Not using the debug adapter like adapter.test.ts as it will not fully connect the debugger
suite('Daffodil Debugger', () => {
  const dfdlVersion = daffodilVersion(PACKAGE_PATH)
  const artifact = daffodilArtifact(dfdlVersion)

  const EXTRACTED_FOLDER = path.join(PROJECT_ROOT, artifact.name)

  // debugger options
  const DATA = path.join(PROJECT_ROOT, 'src/tests/data/test.txt')
  const XML_INFOSET_PATH = path.join(PROJECT_ROOT, 'testinfoset.xml')
  const TDML_PATH = path.join(PROJECT_ROOT, 'tdmltest.tdml')
  const JSON_INFOSET_PATH = path.join(PROJECT_ROOT, 'testinfoset.json')
  const debuggers: vscode.Terminal[] = []

  const tdmlConf = {
    action: 'generate',
    name: 'tdmlConf',
    description: 'testtdml',
    path: TDML_PATH,
  }

  const dataEditor: DataEditorConfig = {
    port: 9000,
    logging: {
      file: 'dataEditor-9000.log',
      level: 'info',
    },
  }

  const dfdlDebuggers: Array<DFDLDebugger> = [
    {
      logging: {
        level: 'INFO',
        file: 'daffodil-debugger-4711.log',
      },
    },
    {
      logging: {
        level: 'INFO',
        file: 'daffodil-debugger-4712.log',
      },
    },
  ]

  before(async () => {
    debuggers.push(
      await runDebugger(
        PROJECT_ROOT,
        '',
        PACKAGE_PATH,
        4711,
        dfdlDebuggers[0],
        true
      )
    )
    debuggers.push(
      await runDebugger(
        PROJECT_ROOT,
        '',
        PACKAGE_PATH,
        4712,
        dfdlDebuggers[1],
        true
      )
    )
  })

  after(async () => {
    await stopDebugging()
    debuggers.forEach((d) => {
      d.processId?.then(async (id) => await killProcess(id))
    })
    fs.rmSync(EXTRACTED_FOLDER, { recursive: true })
    if (fs.existsSync(XML_INFOSET_PATH)) fs.rmSync(XML_INFOSET_PATH)
    if (fs.existsSync(JSON_INFOSET_PATH)) fs.rmSync(JSON_INFOSET_PATH)
    dfdlDebuggers.forEach((dfdlDebugger) => {
      if (fs.existsSync(dfdlDebugger.logging.file))
        fs.rmSync(dfdlDebugger.logging.file)
    })
  })

  test('should output xml infoset', async () => {
    await vscode.debug.startDebugging(
      undefined,
      getConfig({
        name: 'Run',
        request: 'launch',
        type: 'dfdl',
        schema: TEST_SCHEMA,
        data: DATA,
        debugServer: 4711,
        infosetFormat: 'xml',
        infosetOutput: {
          type: 'file',
          path: XML_INFOSET_PATH,
        },
        tdmlConfig: tdmlConf,
        dataEditor: dataEditor,
      }),
      {
        noDebug: true,
      }
    )

    assert.strictEqual(fs.existsSync(XML_INFOSET_PATH), true)
  })

  test('should output json infoset', async () => {
    await vscode.debug.startDebugging(
      undefined,
      getConfig({
        name: 'Run',
        request: 'launch',
        type: 'dfdl',
        schema: TEST_SCHEMA,
        data: DATA,
        debugServer: 4712,
        infosetFormat: 'json',
        infosetOutput: {
          type: 'file',
          path: JSON_INFOSET_PATH,
        },
        tdmlConfig: tdmlConf,
        dataEditor: dataEditor,
      }),
      {
        noDebug: true,
      }
    )

    assert.strictEqual(fs.existsSync(JSON_INFOSET_PATH), true)
  })
})
