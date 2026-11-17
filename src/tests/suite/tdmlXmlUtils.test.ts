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
  getTDMLMetadata,
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

  test('TDML metadata includes Daffodil version for the selected test case', async () => {
    const xmlBuffer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns1:testSuite xmlns:ns1="http://www.ibm.com/xmlns/dfdl/testData" suiteName="Suite">
  <ns1:parserTestCase name="Case1" root="file" model="schema1.dfdl.xsd" description="Desc1" roundTrip="onePass">
    <ns1:environment>
      <ns1:daffodilVersion>4.0.0</ns1:daffodilVersion>
      <ns1:vscodeVersion>1.100.0</ns1:vscodeVersion>
    </ns1:environment>
    <ns1:document>
      <ns1:documentPart type="file">data1.xml</ns1:documentPart>
    </ns1:document>
    <ns1:infoset>
      <ns1:dfdlInfoset type="file">infoset1.xml</ns1:dfdlInfoset>
    </ns1:infoset>
  </ns1:parserTestCase>
  <ns1:parserTestCase name="Case2" root="file" model="schema2.dfdl.xsd" description="Desc2" roundTrip="onePass">
    <ns1:environment>
      <ns1:daffodilVersion>3.11.0</ns1:daffodilVersion>
      <ns1:vscodeVersion>1.90.0</ns1:vscodeVersion>
    </ns1:environment>
    <ns1:document>
      <ns1:documentPart type="file">data2.xml</ns1:documentPart>
    </ns1:document>
    <ns1:infoset>
      <ns1:dfdlInfoset type="file">infoset2.xml</ns1:dfdlInfoset>
    </ns1:infoset>
  </ns1:parserTestCase>
</ns1:testSuite>`

    const selectedCaseMetadata = await getTDMLMetadata(xmlBuffer, 'Case2')
    strictEqual(selectedCaseMetadata.daffodilVersion, '3.11.0')
    strictEqual(selectedCaseMetadata.vscodeVersion, '1.90.0')

    const firstCaseMetadata = await getTDMLMetadata(xmlBuffer, 'Case1')
    strictEqual(firstCaseMetadata.daffodilVersion, '4.0.0')
    strictEqual(firstCaseMetadata.vscodeVersion, '1.100.0')
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
