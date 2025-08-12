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
import * as utils from '../../utils'
import { VSCodeLaunchConfigArgs } from '../../classes/vscode-launch'
import { getTmpTDMLFilePath } from 'tdmlEditor/utilities/tdmlXmlUtils'

suite('Utils Test Suite', () => {
  var name = 'Default Config'
  var request = 'launch'
  var type = 'dfdl'

  var defaultConfig: VSCodeLaunchConfigArgs = {
    name: 'Default Config',
    request: 'launch',
    type: 'dfdl',
    schema: {
      path: '${command:AskForSchemaName}',
      rootName: null,
      rootNamespace: null,
    },
    data: '${command:AskForDataName}',
    debugServer: 4711,
    infosetFormat: 'xml',
    infosetOutput: {
      type: 'file',
      path: '${workspaceFolder}/target/infoset.xml',
    },
    tdmlConfig: {
      action: 'generate',
      name: 'Default Test Case',
      path: getTmpTDMLFilePath(),
    },
    stopOnEntry: true,
    useExistingServer: false,
    trace: true,
    openDataEditor: false,
    openInfosetView: false,
    openInfosetDiffView: false,
    daffodilDebugClasspath: [],
    dataEditor: {
      port: 9000,
      logging: {
        file: '${workspaceFolder}/dataEditor-${omegaEditPort}.log',
        level: 'info',
      },
    },
    dfdlDebugger: {
      logging: {
        level: 'INFO',
        file: '${workspaceFolder}/daffodil-debugger.log',
      },
    },
  }

  test('Default config', async () => {
    var config = utils.getConfig({ name: name, request: request, type: type })
    assert.strictEqual(JSON.stringify(defaultConfig), JSON.stringify(config))
  })

  test('Get current config', async () => {
    assert.strictEqual(undefined, utils.getCurrentConfig())
  })

  test('Setting current config', async () => {
    // Check current config not set
    assert.strictEqual(undefined, utils.getCurrentConfig())
    utils.setCurrentConfig(defaultConfig)
    // Check current config is now set
    assert.notStrictEqual(undefined, utils.getCurrentConfig())
    assert.strictEqual(
      JSON.stringify(defaultConfig),
      JSON.stringify(utils.getCurrentConfig())
    )
  })
})
