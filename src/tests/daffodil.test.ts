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
import * as daffodil from '../daffodil'

suite('Daffodfil', () => {
  // suite to test all functions work properly
  suite('interfaces', () => {
    test('DaffodilData functions properly', () => {
      let daffodilData: daffodil.DaffodilData = {
        bytePos1b: 100,
      }

      assert.strictEqual(100, daffodilData.bytePos1b)
    })

    test('InfosetEvent functions properly', () => {
      let infosetEvent: daffodil.InfosetEvent = {
        content: 'This is content',
        mimeType: 'xml',
      }

      assert.strictEqual('This is content', infosetEvent.content)
      assert.strictEqual('xml', infosetEvent.mimeType)
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
        infosetOutput: infosetOutput,
      }

      assert.strictEqual('/path/to/schema.xsd.xml', launchArgs.schemaPath)
      assert.strictEqual('/path/to/data.jpg', launchArgs.dataPath)
      assert.strictEqual(true, launchArgs.stopOnEntry)
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
})
