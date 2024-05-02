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
import { getConfig } from '../utils'
import { runDebugger, stopDebugger, stopDebugging } from './utils'
import {
  getDefaultTDMLTestCaseDescription,
  getDefaultTDMLTestCaseName,
  getTmpTDMLFilePath,
} from '../tdmlEditor/utilities/tdmlXmlUtils'

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
    // Erase the value of `data` so that we aren't prompted for it later
    // Might need to add `schema` here if we move the `Execute TDML` command
    //   away from the detected dfdl language in VSCode.
    config.data = ''
    config.schema.path = ''

    if (config?.tdmlConfig?.path === undefined)
      config.tdmlConfig.path = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getValidatedTDMLPath'
      )

    if (config?.tdmlConfig?.name === undefined)
      config.tdmlConfig.name = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getTDMLName'
      )

    if (config?.tdmlConfig?.description === undefined)
      config.tdmlConfig.description = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getTDMLDescription'
      )
  }

  if (config?.tdmlConfig?.action === 'generate') {
    if (
      config?.tdmlConfig?.name === undefined ||
      config?.tdmlConfig?.name === 'undefined'
    )
      config.tdmlConfig.name = getDefaultTDMLTestCaseName()

    if (
      config?.tdmlConfig?.description === undefined ||
      config?.tdmlConfig?.description === 'undefined'
    )
      config.tdmlConfig.description = getDefaultTDMLTestCaseDescription()

    if (
      config?.tdmlConfig?.path === undefined ||
      config?.tdmlConfig?.path === 'undefined'
    )
      config.tdmlConfig.path = getTmpTDMLFilePath()
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
): Promise<vscode.DebugConfiguration | undefined> {
  config = getConfig(config) // make sure all config attributes are set

  if (vscode.workspace.workspaceFolders !== undefined) {
    await stopDebugger()

    if (!(await getTDMLConfig(config))) {
      return await stopDebugging().then((_) => undefined)
    }

    // Get schema file before debugger starts to avoid timeout
    if (config.schema.path.includes('${command:AskForSchemaName}')) {
      config.schema.path = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getSchemaName'
      )
    }

    // Get data file before debugger starts to avoid timeout
    if (config.data.includes('${command:AskForDataName}')) {
      config.data = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getDataName'
      )
    }

    let workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath

    // Get daffodilDebugger class paths to be added to the debugger
    const daffodilDebugClasspath = await getDaffodilDebugClasspath(
      config,
      workspaceFolder
    )

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

  return config
}
