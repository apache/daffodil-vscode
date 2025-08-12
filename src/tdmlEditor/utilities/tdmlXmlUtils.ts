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

import { readFileSync, writeFileSync } from 'fs'
import os from 'os'
import { join, resolve, sep, relative, dirname } from 'path'
import { Element, ElementCompact, js2xml, xml2js } from 'xml-js'
import * as vscode from 'vscode'

/*
 * Note that the functions in this file assumes the structure of a TDML file
 *   and is not tied directly to the schema or JAXB bindings.
 * A valid TDML file contains at least 0 documents and/or infosets. Any TDML files
 *   created by the extension will have one of each. However, we should be able to
 *   interact with a wide variety of files
 * We are also assuming that namespace prefixes may be present. We can't know which
 *   prefix is correct so we can't do an exact match. We should also be able to handle
 *   a TDML file that does not use namespace prefixes.
 * *******************************************************************************
 * The general expected format is as follows:
 * <testSuite suiteName=''>
 *   <parserTestCase name='' model='' description=''>
 *     <document>
 *       <documentPart></documentPart>
 *     </document>
 *     <infoset>
 *       <infosetPart></infosetPart>
 *     </infoset>
 *   </parserTestCase>
 * </testSuite>
 */

// Custom type that contains information on a test case
export type TDMLTestCaseDisplay = {
  testCaseName: string
  testCaseDescription: string
  testCaseModel: string
  dataDocuments: string[]
  dfdlInfosets: string[]
}

// Custom type that contains information on a test suite
// Each item in the array represents a single test case
export type TDMLTestSuiteDisplay = {
  suiteName: string
  testCases: TDMLTestCaseDisplay[]
}

// Hard coded element/attribute names expected in the XML
const testSuiteAttribute = 'suiteName'
const testCaseNameAttribute = 'name'
const testCaseDescriptionAttribute = 'description'
const testCaseModelAttribute = 'model'
const testSuiteElement = 'testSuite'
const testCaseElement = 'parserTestCase'
const documentElement = 'document'
const documentPartElement = 'documentPart'
const infosetElement = 'infoset'
const dfdlInfosetElement = 'dfdlInfoset'
export const TMP_TDML_FILENAME: string = 'generatedTDML.tdml'

// When a TDML file is generated on a DFDL parse, it is generated at this location
export function getTmpTDMLFilePath() {
  return join(os.tmpdir(), TMP_TDML_FILENAME)
}

export function getDefaultTDMLTestCaseName() {
  return 'Default Test Case'
}

/*
 * Read the XML contents of a TDML file
 *
 * tdmlFilePath: File path to a TDML file
 * returns XML contents of given TDML file
 */
export async function readTDMLFileContents(tdmlFilePath: string) {
  try {
    return readFileSync(tdmlFilePath, 'utf8')
  } catch (error) {
    /* TODO: */
    return ''
  }
}

/*
 * Write the provided buffer to the given TDML file location
 *
 * xmlBuffer: Buffer containing the XML file to write
 * destinationFile: Filename to save the buffer to
 */
export async function writeTDMLFileContents(
  xmlBuffer: string,
  destinationFile: string
) {
  try {
    return writeFileSync(destinationFile, xmlBuffer)
  } catch (error) {
    /* TODO: */
    return ''
  }
}

/*
 * Get the test case data from a TDML file.
 *
 * xmlBuffer: String containing the contents of the XML file
 * returns The data from the XML file in a custom type.
 */
export async function getTestCaseDisplayData(
  xmlBuffer: string
): Promise<TDMLTestSuiteDisplay> {
  var xmlObj: Element | ElementCompact = xml2js(xmlBuffer)

  const rootNode = (xmlObj as Element).elements?.filter((node) =>
    node.name?.endsWith(testSuiteElement)
  )

  if (rootNode === undefined) {
    console.log(`No test suite found in XML buffer`)
    return {
      suiteName: '',
      testCases: [],
    }
  }

  if (rootNode.length !== 1) {
    console.log(`More than one test suite found in XML buffer`)
    return {
      suiteName: '',
      testCases: [],
    }
  }

  const retVal: TDMLTestCaseDisplay[] = []

  // Each TDML file contains at least one test case
  const testCases = rootNode[0].elements?.filter((node) =>
    node.name?.endsWith(testCaseElement)
  )

  // Each test case may contain any number of documents
  const documentParts: string[][] = []
  testCases?.forEach((testCaseNode) => {
    const documentsGrouped: string[] = []
    testCaseNode.elements
      ?.filter((childNode) => childNode.name?.endsWith(documentElement))
      .forEach((documentNode) =>
        documentNode.elements
          ?.filter((childNode) => childNode.name?.endsWith(documentPartElement))
          .forEach((documentPartNode) => {
            if (
              documentPartNode.elements !== undefined &&
              documentPartNode.elements[0].text !== undefined
            )
              documentsGrouped.push(
                documentPartNode.elements[0].text.toString()
              )
          })
      )
    documentParts.push(documentsGrouped)
  })

  // Each test case may contain any number of infosets
  const infosetParts: string[][] = []
  testCases?.forEach((testCaseNode) => {
    const infosetsGrouped: string[] = []
    testCaseNode.elements
      ?.filter((childNode) => childNode.name?.endsWith(infosetElement))
      .forEach((infosetNode) =>
        infosetNode.elements
          ?.filter((childNode) => childNode.name?.endsWith(dfdlInfosetElement))
          .forEach((dfdlInfosetNode) => {
            if (
              dfdlInfosetNode.elements !== undefined &&
              dfdlInfosetNode.elements[0].text !== undefined
            )
              infosetsGrouped.push(dfdlInfosetNode.elements[0].text.toString())
            else if (dfdlInfosetNode.elements !== undefined)
              infosetsGrouped.push('xml defined infoset')
          })
      )
    infosetParts.push(infosetsGrouped)
  })

  // Combine the extracted data info the custom types for returning
  testCases?.forEach((testCaseNode, index) => {
    if (
      testCaseNode.attributes !== undefined &&
      testCaseNode.attributes[testCaseNameAttribute] !== undefined &&
      testCaseNode.attributes[testCaseModelAttribute] !== undefined
    ) {
      retVal.push({
        testCaseName: testCaseNode.attributes[testCaseNameAttribute].toString(),
        testCaseDescription:
          testCaseNode.attributes[testCaseDescriptionAttribute] !== undefined
            ? testCaseNode.attributes[testCaseDescriptionAttribute].toString()
            : '',
        testCaseModel:
          testCaseNode.attributes[testCaseModelAttribute].toString(),
        dataDocuments: documentParts[index],
        dfdlInfosets: infosetParts[index],
      })
    }
  })

  if (rootNode[0].attributes !== undefined) {
    return {
      suiteName:
        rootNode[0].attributes[testSuiteAttribute] !== undefined
          ? rootNode[0].attributes[testSuiteAttribute].toString()
          : '',
      testCases: retVal,
    }
  } else {
    return {
      suiteName: '',
      testCases: [],
    }
  }
}

/*
 * Append the test case in one XML file into another file's test suite
 *
 * xmlFilePath: String containing the XML file path of a TDML file with
 *   exactly one test case
 * destinationFilePath: String containing XML file path. The test case in
 *   xmlBuffer will be added to this buffer's test suite.
 * Returns string containing modified XML
 *
 * Throws when an error is found. To catch errors, call with something similar to:
 *   appendTestCase(buf, destBuf).then((result) => writeResult()).catch((reason) => console.log(reason))
 * Then is only called on success and catch is only called on failure (when we throw)
 * See the 'Invalid Append TDML - duplicate' and 'Append TDML Test Case' tests for examples
 */
export async function appendTestCase(
  xmlFilePath: string,
  destinationFilePath: string
) {
  return copyTestCase(xmlFilePath, destinationFilePath, true)
}

/*
 * Copy and optionally append test case in one XML file into another file's test suite
 *
 * xmlFilePath: String containing the XML file path of a TDML file with
 *   exactly one test case
 * destinationFilePath: String containing XML file path. The test case in
 *   xmlBuffer will be added to this buffer's test suite.
 * append: boolean variable to enable append functionality. By default it is false
 *
 * Returns string containing modified XML
 *
 * Throws when an error is found. To catch errors, call with something similar to:
 *   appendTestCase(buf, destBuf).then((result) => writeResult()).catch((reason) => console.log(reason))
 * Then is only called on success and catch is only called on failure (when we throw)
 * See the 'Invalid Append TDML - duplicate' and 'Append TDML Test Case' tests for examples
 */
export async function copyTestCase(
  xmlFilePath: string,
  destinationFilePath: string,
  append = false
) {
  var xmlBuffer = await readTDMLFileContents(xmlFilePath)
  var destinationBuffer = await readTDMLFileContents(destinationFilePath)

  var xmlObj: Element | ElementCompact = xml2js(xmlBuffer)
  var destinationObj: Element | ElementCompact = xml2js(destinationBuffer)

  const sourceTestSuite = (xmlObj as Element).elements?.filter((node) =>
    node.name?.endsWith(testSuiteElement)
  )

  if (sourceTestSuite === undefined) {
    vscode.window.showErrorMessage(
      'TDML ERROR: No test suite found in source XML buffer'
    )
    throw `No test suite found in source XML buffer`
  }

  if (sourceTestSuite.length !== 1) {
    vscode.window.showErrorMessage(
      'TDML ERROR: More than one test suite found in source XML buffer'
    )
    throw `More than one test suite found in source XML buffer`
  }

  const sourceTestCase = sourceTestSuite[0].elements?.filter((childNode) =>
    childNode.name?.endsWith(testCaseElement)
  )

  if (sourceTestCase === undefined) {
    vscode.window.showErrorMessage(
      'TDML ERROR: No test case found in source XML buffer'
    )
    throw `No test case found in source XML buffer`
  }

  if (sourceTestCase.length !== 1) {
    vscode.window.showErrorMessage(
      'TDML ERROR: More than one test case found in source XML buffer'
    )
    throw `More than one test case found in source XML buffer`
  }

  const rootNode = (xmlObj as Element).elements?.filter((node) =>
    node.name?.endsWith(testSuiteElement)
  )

  if (
    sourceTestCase[0].attributes !== undefined &&
    sourceTestCase[0].attributes[testCaseModelAttribute] !== undefined &&
    rootNode !== undefined
  ) {
    // Each TDML file contains at least one test case
    const testCases = rootNode[0].elements?.filter((node) =>
      node.name?.endsWith(testCaseElement)
    )

    /**
     * Creates an absolute path from the given relative path to the temp TDML file
     *
     * @param relativePath - Relative path to convert into an absolute path
     * @returns
     */
    const getAbsolutePathFromRelativeToTempTDMLFIlePath = (
      relativePath: string
    ) => resolve(dirname(getTmpTDMLFilePath()), relativePath)

    // set to relative path to DFDL file from destination folder
    sourceTestCase[0].attributes[testCaseModelAttribute] = relative(
      dirname(destinationFilePath),
      getAbsolutePathFromRelativeToTempTDMLFIlePath(
        sourceTestCase[0].attributes[testCaseModelAttribute].toString() // Contains relative path to the temp TDML file
      )
    )

    // Each test case may contain any number of documents
    testCases?.forEach((testCaseNode) => {
      testCaseNode.elements
        ?.filter((childNode) => childNode.name?.endsWith(documentElement))
        .forEach((documentNode) =>
          documentNode.elements
            ?.filter((childNode) =>
              childNode.name?.endsWith(documentPartElement)
            )
            .forEach((documentPartNode) => {
              if (
                documentPartNode.elements !== undefined &&
                documentPartNode.elements[0].text !== undefined
              )
                // Set to relative path to data file from destination folder
                documentPartNode.elements[0].text = relative(
                  dirname(destinationFilePath),
                  getAbsolutePathFromRelativeToTempTDMLFIlePath(
                    documentPartNode.elements[0].text.toString() // Contains relative path to the temp TDML file
                  )
                )
            })
        )
    })

    // Each test case may contain any number of infoset
    testCases?.forEach((testCaseNode) => {
      testCaseNode.elements
        ?.filter((childNode) => childNode.name?.endsWith(infosetElement))
        .forEach((infosetNode) =>
          infosetNode.elements
            ?.filter((childNode) =>
              childNode.name?.endsWith(dfdlInfosetElement)
            )
            .forEach((dfdlInfosetNode) => {
              if (
                dfdlInfosetNode.elements !== undefined &&
                dfdlInfosetNode.elements[0].text !== undefined
              ) {
                // Set relative path to infoset from destinatino
                dfdlInfosetNode.elements[0].text = relative(
                  dirname(destinationFilePath),
                  getAbsolutePathFromRelativeToTempTDMLFIlePath(
                    dfdlInfosetNode.elements[0].text.toString() // Relative path from temp TDML file to infoset file
                  )
                )
              }
            })
        )
    })
  }

  if (append) {
    const destinationTestSuite = (destinationObj as Element).elements?.filter(
      (node) => node.name?.endsWith(testSuiteElement)
    )

    if (destinationTestSuite === undefined) {
      vscode.window.showErrorMessage(
        'TDML ERROR: No test suites found in destination XML buffer'
      )
      throw `No test suites found in destination XML buffer`
    }

    if (destinationTestSuite.length !== 1) {
      vscode.window.showErrorMessage(
        'TDML ERROR: More than one test suite found in destination XML buffer'
      )
      throw `More than one test suite found in destination XML buffer`
    }

    const destinationTestCases = destinationTestSuite[0].elements?.filter(
      (childNode) => childNode.name?.endsWith(testCaseElement)
    )
    destinationTestCases?.forEach((testCase) => {
      // Check to see if we are trying to append a duplicate
      // Per the TDML spec, a duplicate is a name-only check
      if (
        testCase.attributes !== undefined &&
        sourceTestCase[0].attributes !== undefined &&
        testCase.attributes[testCaseNameAttribute] ===
          sourceTestCase[0].attributes[testCaseNameAttribute]
      ) {
        vscode.window.showErrorMessage(
          'TDML ERROR: Duplicate Test Case Name Found'
        )
        throw `Duplicate Test Case Name Found`
      }
    })
    destinationTestSuite[0].elements?.push(sourceTestCase[0])

    return js2xml(destinationObj)
  } else {
    return js2xml(xmlObj)
  }
}

// Convert an absolute path into a path relative to the current working directory
//
// path: Absolute path to convert into a relative path
// tdmlPath: Absolute path to the TDML file to make
//
// Returns the relative path. Note that this path is given as a string.
//THIS FUNCTION CURRENTLY NOT USED BECAUSE PATHS COULD NOT BE PROPERLY NORMALIZED FROM CALLING FUNCTON

export async function convertToRelativePath(
  path: string,
  tdmlPath: string
): Promise<string> {
  // Get the absolute path of the workspace directory
  // The path is the path to a file. To get the proper relative path, we need
  //   to start at the parent of the file.
  var workingDir = dirname(resolve(tdmlPath))
  var prefix = ''

  // This is used to back up the path tree in order to find the first common ancestor of both paths
  // If a user wants to use a file not in or under the current working directory, this will be required to
  //   produce the expected output.
  // A possible use case of this is where a user has a data folder and a schema folder that are siblings.
  while (!path.startsWith(workingDir) && dirname(workingDir) != null) {
    workingDir = dirname(workingDir)
    // Need to add the dots to represent that we've gone back a step up the path
    prefix += '..' + sep
  }

  return prefix + relative(workingDir, path)
}
