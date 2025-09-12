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
import * as fs from 'fs'
import * as path from 'path'
import { getConfig, setCurrentConfig } from '../utils'
import { runDebugger, stopDebugger, stopDebugging } from './utils'
import {
  getDefaultTDMLTestCaseName,
  getTestCaseDisplayData,
  getTmpTDMLFilePath,
  readTDMLFileContents,
} from '../tdmlEditor/utilities/tdmlXmlUtils'
import { outputChannel } from '../adapter/activateDaffodilDebug'

// Function to get data file given a folder
export async function getDataFileFromFolder(dataFolder: string) {
  return vscode.window
    .showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
      defaultUri: vscode.Uri.parse(dataFolder),
    })
    .then((fileUri) => {
      if (fileUri && fileUri[0]) {
        return fileUri[0].fsPath
      }
    })
}

async function getTDMLConfig(
  config: vscode.DebugConfiguration
): Promise<boolean> {
  // If not supported TDML action entered, delete tdml config so no errors are thrown
  if (!['execute', 'generate', 'none'].includes(config?.tdmlConfig?.action)) {
    delete config.tdmlConfig
  }

  // If we are doing a TDML execute, these fields will be replaced,
  //   so we don't need to prompt for them now.
  if (config?.tdmlConfig?.action === 'execute') {
    // Erase the value of `data` and 'schema.path' so that we aren't prompted for it later
    config.data = ''
    config.schema.path = ''

    if (
      config.tdmlConfig.path === '${command:AskForValidatedTDMLPath}' ||
      !config.tdmlConfig.path
    ) {
      config.tdmlConfig.path = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getValidatedTDMLPath'
      )
    }

    if (!config.tdmlConfig.path) {
      return false
    }

    config.tdmlConfig.name =
      config.tdmlConfig.name ||
      (await vscode.commands.executeCommand(
        'extension.dfdl-debug.getTDMLName',
        config.tdmlConfig.path
      ))

    if (!config.tdmlConfig.name) return false

    await readTDMLFileContents(config.tdmlConfig.path).then(
      async (xmlBuffer) => {
        await getTestCaseDisplayData(xmlBuffer).then((testSuiteData) => {
          testSuiteData.testCases.forEach((testCase) => {
            if (testCase.testCaseName === config.tdmlConfig.name) {
              // Behave the same as the backend - if there are multiple data documents, ignore any past the first
              config.data = testCase.dataDocuments[0]
              config.schema.path = testCase.testCaseModel
            }
          })
        })
      }
    )
  }

  if (config?.tdmlConfig?.action === 'generate') {
    config.tdmlConfig.name =
      config.tdmlConfig.name || getDefaultTDMLTestCaseName()
    config.tdmlConfig.path = getTmpTDMLFilePath()

    outputChannel.appendLine(
      `TDML File generated at: ${config.tdmlConfig.path}`
    )
    outputChannel.show()
  }

  if (config?.tdmlConfig?.action !== 'execute' && config.data === '') {
    return false
  }

  return true
}

async function getDaffodilDebugClasspath(
  config: vscode.DebugConfiguration,
  workspaceFolder: string
): Promise<Array<string>> {
  let daffodilDebugClasspath: Array<string> = []

  //check if each classpath still exists
  if (config.daffodilDebugClasspath) {
    config.daffodilDebugClasspath.forEach((entry: string) => {
      if (entry !== '') {
        let fullpathEntry = entry.replaceAll(
          '${workspaceFolder}',
          workspaceFolder
        )

        if (!fs.existsSync(fullpathEntry)) {
          throw new Error(`File or directory: ${fullpathEntry} doesn't exist`)
        } else {
          daffodilDebugClasspath.push(fullpathEntry)
        }
      }
    })
  }

  // make sure infoset output directory is present
  if (config.infosetOutput.type == 'file') {
    let dir = path.dirname(
      config.infosetOutput.path.includes('${workspaceFolder}')
        ? config.infosetOutput.path.replace(
            '${workspaceFolder}',
            workspaceFolder
          )
        : config.infosetOutput.path
    )

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  return daffodilDebugClasspath
}

// Function for getting the daffodil-debugger
export async function getDebugger(
  context: vscode.ExtensionContext,
  config: vscode.DebugConfiguration
) {
  config = getConfig(config) // make sure all config attributes are set
  setCurrentConfig(config) // Do this here to make sure we have the config if there isn't a workspace (eg. during tests)

  if (vscode.workspace.workspaceFolders !== undefined) {
    await stopDebugger()

    if (!(await getTDMLConfig(config))) {
      return await stopDebugging().then((_) => undefined)
    }

    // Get schema file before debugger starts to avoid timeout
    if (config.schema.path.includes('${command:AskForSchemaName}')) {
      const schemaPath = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getSchemaName'
      )

      // Stop execution if schemaPath is null, undefined, or empty string
      if (!schemaPath) {
        return await stopDebugging().then((_) => undefined)
      }

      config.schema.path = schemaPath
    }

    // Get data file before debugger starts to avoid timeout
    if (config.data.includes('${command:AskForDataName}')) {
      const dataPath = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getDataName'
      )

      // Stop execution if dataPath is null, undefined, or empty string
      if (!dataPath) {
        return await stopDebugging().then((_) => undefined)
      }

      config.data = dataPath
    }

    let workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath

    // Get daffodilDebugger class paths to be added to the debugger
    const daffodilDebugClasspath = await getDaffodilDebugClasspath(
      config,
      workspaceFolder
    )

    setCurrentConfig(config)

    if (!config.useExistingServer) {
      await runDebugger(
        context.asAbsolutePath('./'),
        daffodilDebugClasspath,
        context.asAbsolutePath('./package.json'),
        config.debugServer,
        config.dfdlDebugger
      )
    }
  }
}
