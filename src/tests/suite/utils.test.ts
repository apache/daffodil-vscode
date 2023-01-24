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
import * as utils from '../../utils'

describe('Utils Test Suite', () => {
  const name = 'Default Config';
  const request = 'launch';
  const type = 'dfdl';

  const defaultConfig = {
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

  it('Default config', () => {
    const config = utils.getConfig(name, request, type)
    expect(JSON.stringify(config)).to.equal(JSON.stringify(defaultConfig))
  })

  it('Get current config', () => {
    expect(utils.getCurrentConfig()).to.be.undefined
  })

  it('Setting current config', () => {
    // Check current config not set
    expect(utils.getCurrentConfig()).to.be.undefined
    utils.setCurrentConfig(defaultConfig)
    // Check current config is now set
    expect(utils.getCurrentConfig()).to.not.be.undefined
    expect(JSON.stringify(utils.getCurrentConfig())).to.equal(JSON.stringify(defaultConfig))
  })
})
