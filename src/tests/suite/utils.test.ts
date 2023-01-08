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

suite('Utils Test Suite', () => {
  var name = 'Default Config'
  var request = 'launch'
  var type = 'dfdl'

  var defaultConfig = {
    name: 'Default Config',
    request: 'launch',
    type: 'dfdl',
    program: '${command:AskForProgramName}',
    data: '${command:AskForDataName}',
    debugServer: 4711,
    infosetFormat: 'xml',
    infosetOutput: {
      type: 'none',
      path: '${workspaceFolder}/infoset.xml',
    },
    stopOnEntry: true,
    useExistingServer: false,
    trace: true,
    openHexView: false,
    openInfosetView: false,
    openInfosetDiffView: false,
    daffodilDebugClasspath: '',
  }

  test('Default config', async () => {
    var config = await utils.getConfig(name, request, type)
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
