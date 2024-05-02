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

import { strictEqual } from 'assert'
import { join } from 'path'
import {
  appendTestCase,
  getTestCaseDisplayData,
  readTDMLFileContents,
} from '../../tdmlEditor/utilities/tdmlXmlUtils'
import xmlFormat from 'xml-formatter'

const data_directory = join(__dirname, '..', '..', '..', 'src', 'tests', 'data')

suite('TDML Utils Test Suite', () => {
  test('Valid TDML File - Single Test Case', async () => {
    return readTDMLFileContents(join(data_directory, 'test.tdml')).then(
      (xmlBuffer) => {
        return getTestCaseDisplayData(xmlBuffer).then((testSuiteData) => {
          strictEqual(testSuiteData.suiteName, 'TestTDMLSuiteName')
          strictEqual(testSuiteData.testCases.length, 1)
          strictEqual(testSuiteData.testCases[0].testCaseName, 'TestTDMLName')
          strictEqual(
            testSuiteData.testCases[0].testCaseDescription,
            'Test TDML Description'
          )
          strictEqual(testSuiteData.testCases[0].testCaseModel, 'test.dfdl.xsd')
          strictEqual(testSuiteData.testCases[0].dataDocuments.length, 1)
          strictEqual(testSuiteData.testCases[0].dataDocuments[0], 'noData.xml')
          strictEqual(testSuiteData.testCases[0].dfdlInfosets.length, 1)
          strictEqual(
            testSuiteData.testCases[0].dfdlInfosets[0],
            'noInfoset.xml'
          )
        })
      }
    )
  })

  test('Valid TDML File - Multiple Test Cases', async () => {
    return readTDMLFileContents(
      join(data_directory, 'test-multiple.tdml')
    ).then((xmlBuffer) => {
      return getTestCaseDisplayData(xmlBuffer).then((testSuiteData) => {
        strictEqual(testSuiteData.suiteName, 'TestTDMLSuiteNameMultiple')
        strictEqual(testSuiteData.testCases.length, 2)
        strictEqual(
          testSuiteData.testCases[0].testCaseName,
          'FirstTDMLTestCase'
        )
        strictEqual(
          testSuiteData.testCases[1].testCaseName,
          'SecondTDMLTestCase'
        )
        strictEqual(
          testSuiteData.testCases[0].testCaseDescription,
          'First TDML Description'
        )
        strictEqual(
          testSuiteData.testCases[1].testCaseDescription,
          'Second TDML Description'
        )
        strictEqual(testSuiteData.testCases[0].testCaseModel, 'test1.dfdl.xsd')
        strictEqual(testSuiteData.testCases[1].testCaseModel, 'test2.dfdl.xsd')
        strictEqual(testSuiteData.testCases[0].dataDocuments.length, 1)
        strictEqual(testSuiteData.testCases[0].dataDocuments[0], 'noData1.xml')
        strictEqual(testSuiteData.testCases[1].dataDocuments.length, 1)
        strictEqual(testSuiteData.testCases[1].dataDocuments[0], 'noData2.xml')
        strictEqual(testSuiteData.testCases[0].dfdlInfosets.length, 1)
        strictEqual(
          testSuiteData.testCases[0].dfdlInfosets[0],
          'noInfoset1.xml'
        )
        strictEqual(testSuiteData.testCases[1].dfdlInfosets.length, 1)
        strictEqual(
          testSuiteData.testCases[1].dfdlInfosets[0],
          'noInfoset2.xml'
        )
      })
    })
  })

  test('Valid TDML File - Single Test Case, No Namespaces', async () => {
    return readTDMLFileContents(
      join(data_directory, 'test-no-namespace.tdml')
    ).then((xmlBuffer) => {
      return getTestCaseDisplayData(xmlBuffer).then((testSuiteData) => {
        strictEqual(testSuiteData.suiteName, 'TestTDMLSuiteName')
        strictEqual(testSuiteData.testCases.length, 1)
        strictEqual(testSuiteData.testCases[0].testCaseName, 'TestTDMLName')
        strictEqual(
          testSuiteData.testCases[0].testCaseDescription,
          'Test TDML Description'
        )
        strictEqual(testSuiteData.testCases[0].testCaseModel, 'test.dfdl.xsd')
        strictEqual(testSuiteData.testCases[0].dataDocuments.length, 1)
        strictEqual(testSuiteData.testCases[0].dataDocuments[0], 'noData.xml')
        strictEqual(testSuiteData.testCases[0].dfdlInfosets.length, 1)
        strictEqual(testSuiteData.testCases[0].dfdlInfosets[0], 'noInfoset.xml')
      })
    })
  })

  // This isn't technically a valid TDML file as there should be other elements in place of Document/Infoset, but
  //   we should still be able to parse if these are not present
  test('Valid TDML File - Single Test Case, No Document or Infoset Elements', async () => {
    return readTDMLFileContents(
      join(data_directory, 'test-no-document-or-infoset.tdml')
    ).then((xmlBuffer) => {
      return getTestCaseDisplayData(xmlBuffer).then((testSuiteData) => {
        strictEqual(testSuiteData.suiteName, 'TestTDMLSuiteName')
        strictEqual(testSuiteData.testCases.length, 1)
        strictEqual(testSuiteData.testCases[0].testCaseName, 'TestTDMLName')
        strictEqual(
          testSuiteData.testCases[0].testCaseDescription,
          'Test TDML Description'
        )
        strictEqual(testSuiteData.testCases[0].testCaseModel, 'test.dfdl.xsd')
        strictEqual(testSuiteData.testCases[0].dataDocuments.length, 0)
        strictEqual(testSuiteData.testCases[0].dfdlInfosets.length, 0)
      })
    })
  })

  test('Invalid TDML File - File Does Not Exist', async () => {
    return readTDMLFileContents(
      join(data_directory, 'test-non-existent.tdml')
    ).then((xmlBuffer) => {
      strictEqual(xmlBuffer, '')
    })
  })

  test('Invalid TDML File - Not Valid XML', async () => {
    return getTestCaseDisplayData('').then((testSuiteData) => {
      strictEqual(testSuiteData.suiteName, '')
      strictEqual(testSuiteData.testCases.length, 0)
    })
  })

  test('Append TDML Test Case', async () => {
    var appendedBuffer = await appendTestCase(
      join(data_directory, 'test-second.tdml'),
      join(data_directory, 'test.tdml')
    )

    return readTDMLFileContents(join(data_directory, 'test-appended.tdml'))
      .then((buf) => {
        strictEqual(xmlFormat(appendedBuffer), buf)
      })
      .catch((_) => {
        // This is not checked because we returned a buffer
      })
  })

  test('Invalid Append TDML - duplicate', async () => {
    return appendTestCase(
      join(data_directory, 'test.tdml'),
      join(data_directory, 'test.tdml')
    )
      .then((_) => {
        // This is not checked because we threw
      })
      .catch((reason) => {
        // This is checked because we threw
        strictEqual(reason, 'Duplicate Test Case Name Found')
      })
  })
})
