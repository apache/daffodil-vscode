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
import * as os from 'os'
import { PROJECT_ROOT, TEST_SCHEMA } from './common'
import { getConfig, killProcess } from '../../utils'
import { runDebugger, stopDebugging } from '../../daffodilDebugger'
import { before, after, Suite, Test } from 'mocha'
import { DFDLDebugger } from '../../classes/dfdlDebugger'
import { DataEditorConfig } from '../../classes/dataEditor'
import { getJavaHome } from '../../daffodilDebugger'
import { delay } from '../../utils'
import { TDMLConfig } from 'classes/tdmlConfig'

interface TestDebuggerConfig {
  debugger: DFDLDebugger
  port: number
  infosetFormat: string
}

const debuggers: vscode.Terminal[] = []
const dfdlDebuggerConfigs: Array<TestDebuggerConfig> = []

suite('Daffodil Debugger', function (this: Suite) {
  // debugger options
  const DATA = path.join(PROJECT_ROOT, 'src/tests/data/test.txt')
  const XML_INFOSET_PATH = path.join(PROJECT_ROOT, 'testinfoset.xml')
  const JSON_INFOSET_PATH = path.join(PROJECT_ROOT, 'testinfoset.json')

  const tdmlConf = {
    action: 'none',
  }

  const dataEditor: DataEditorConfig = {
    port: 9000,
    logging: {
      file: 'dataEditor-9000.log',
      level: 'info',
    },
  }

  before(async () => {
    await getDebuggerConfigs()

    /**
     * When testing locally running all debuggers before running the tests caused the tests to complete
     * 1 second faster and the whole "yarn test" process completed 1 second faster than when running a
     * single debugger instance right before the debugging was started. So currently sticking with this
     * but if wanting to shift to running the instance right before starting the debug process it is not
     * too dramatic of performance decrease and time increase.
     */
    for (var i = 0; i < dfdlDebuggerConfigs.length; i++) {
      let newDebugger = await runDebugger(
        path.join(PROJECT_ROOT, 'dist/debuggers'),
        [],
        dfdlDebuggerConfigs[i].port,
        dfdlDebuggerConfigs[i].debugger,
        true
      )

      newDebugger ? debuggers.push(newDebugger) : true
    }

    await addDebuggerRunningTests(
      this,
      dfdlDebuggerConfigs,
      XML_INFOSET_PATH,
      JSON_INFOSET_PATH,
      DATA,
      tdmlConf,
      dataEditor
    )
  })

  test('debugger config size is correct', async () => {
    assert.strictEqual(
      (await getDaffodilVersionsToTest()).length * 2,
      dfdlDebuggerConfigs.length
    )
  })

  after(async () => {
    await stopDebugging()
    for (const d of debuggers) {
      const pid = await d.processId
      await killProcess(pid)
    }

    // No need to deleted the debugging server because upon re-run, webpack cleans and re-extracts it.
    ;(await getDaffodilVersionsToTest()).forEach((version) => {
      const xmlPath = XML_INFOSET_PATH.replace('.xml', `${version}.xml`)
      const jsonPath = JSON_INFOSET_PATH.replace('.json', `${version}.json`)
      if (fs.existsSync(xmlPath)) fs.rmSync(xmlPath)
      if (fs.existsSync(jsonPath)) fs.rmSync(jsonPath)
    })
  })
})

// Gets all debugger version to test based on if JDK is >= 17
async function getDaffodilVersionsToTest(): Promise<Array<string>> {
  const javaHome = await getJavaHome()
  const isAtLeastJdk17: boolean = parseFloat(javaHome?.version ?? '0') >= 17

  const dfdlVersions = ['3.10.0', '3.11.0']
  if (isAtLeastJdk17) dfdlVersions.push('4.0.0')
  return dfdlVersions
}

/**
 * Populates the array of debugger configs with all debugger configs. If JDK >= 17 there
 * should be 6 and if JDK < 17 there should be 4. Each version of the debugger has two
 * configs, one for XML and one for JSON.
 */
async function getDebuggerConfigs() {
  const debuggerVersionsToTest = await getDaffodilVersionsToTest()
  let versionIndex = 0

  for (var i = 0; i < debuggerVersionsToTest.length * 2; i++) {
    if (i > 0 && i % 2 == 0) versionIndex++

    const port = 4711 + i
    const infosetFormat = i % 2 == 0 ? 'xml' : 'json'
    const dfdlDebugger: DFDLDebugger = {
      daffodilVersion: debuggerVersionsToTest[versionIndex],
      timeout: '4m',
      logging: {
        level: 'INFO',
        file: path.join(os.tmpdir(), `yarn-test-daffodil-debugger-${port}.log`),
      },
    }

    dfdlDebuggerConfigs.push({
      debugger: dfdlDebugger,
      port: port,
      infosetFormat: infosetFormat,
    })
  }
}

// This method is for starting the debug and making sure the infoset file was created
async function checkDebug(
  data: string,
  port: number,
  infosetFormat: string,
  infosetPath: string,
  tdmlConfig: TDMLConfig,
  dataEditor: DataEditorConfig,
  dfdlDebugger: DFDLDebugger
) {
  await vscode.debug.startDebugging(
    undefined,
    getConfig({
      name: 'Run',
      request: 'launch',
      type: 'dfdl',
      schema: {
        path: TEST_SCHEMA,
      },
      data: data,
      debugServer: port,
      infosetFormat: infosetFormat,
      infosetOutput: {
        type: 'file',
        path: infosetPath,
      },
      tdmlConfig: tdmlConfig,
      dataEditor: dataEditor,
      dfdlDebugger: dfdlDebugger,
      stopOnEntry: false,
    }),
    {
      noDebug: true,
    }
  )

  await delay(1000)

  assert.strictEqual(fs.existsSync(infosetPath), true)
}

/**
 * This function adds a number of tests to the suite for connecting to the debuggers.
 * Since we have 3 different versions of the debugger, each needs to be connected to
 * twice. Once for outputting XML and one for outputting JSON. Not sure if this is
 * a common way to add tests to a test suite but it seemed better and more efficient
 * than making a single separate test for each combination of the debugger plus infoset
 * format. Especially since two of the combinations can only be ran if the JDK version
 * being used is >= 17.
 */
async function addDebuggerRunningTests(
  suite: Suite,
  dfdlDebuggerConfigs: Array<TestDebuggerConfig>,
  xmlInfosetPath: string,
  jsonInfosetPath: string,
  data: string,
  tdmlConfig: TDMLConfig,
  dataEditor: DataEditorConfig
) {
  for (var i = 0; i < dfdlDebuggerConfigs.length; i++) {
    const debuggerConfig = dfdlDebuggerConfigs[i]
    const baseInfosetPath =
      debuggerConfig.infosetFormat == 'xml' ? xmlInfosetPath : jsonInfosetPath
    const infosetPath = baseInfosetPath.replace(
      `.${debuggerConfig.infosetFormat}`,
      `${debuggerConfig.debugger.daffodilVersion}.${debuggerConfig.infosetFormat}`
    )

    suite.addTest(
      new Test(
        `should output ${debuggerConfig.infosetFormat} infoset - debugger version ${debuggerConfig.debugger.daffodilVersion}`,
        async function () {
          await checkDebug(
            data,
            debuggerConfig.port,
            debuggerConfig.infosetFormat,
            infosetPath,
            tdmlConfig,
            dataEditor,
            debuggerConfig.debugger
          )
        }
      )
    )
  }
}
