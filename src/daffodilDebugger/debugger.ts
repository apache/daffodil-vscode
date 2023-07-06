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
import XDGAppPaths from 'xdg-app-paths'
import * as path from 'path'
import { regexp, unzipFile } from '../utils'
import {
  buildDebugger,
  daffodilArtifact,
  daffodilVersion,
  runDebugger,
  stopDebugger,
  stopDebugging,
} from './utils'

const xdgAppPaths = XDGAppPaths({ name: 'daffodil-dap' })

// Class for getting release data
export class Release {
  name: string
  zipballUrl: string
  tarballUrl: string
  commit: JSON
  nodeId: string

  constructor(
    name: string,
    zipballUrl: string,
    tarballUrl: string,
    commit: JSON,
    nodeId: string
  ) {
    this.name = name
    this.zipballUrl = zipballUrl
    this.tarballUrl = tarballUrl
    this.commit = commit
    this.nodeId = nodeId
  }
}

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
  if (!['execute', 'generate', 'append'].includes(config?.tdmlConfig?.action)) {
    delete config.tdmlConfig
  }

  // If we are doing a TDML execute, these fields will be replaced,
  //   so we don't need to prompt for them now.
  if (config?.tdmlConfig?.action === 'execute') {
    // Erase the value of `data` so that we aren't prompted for it later
    // Might need to add `program` here if we move the `Execute TDML` command
    //   away from the detected dfdl language in VSCode.
    config.data = ''
  } else {
    // Get program file before debugger starts to avoid timeout
    if (config.program.includes('${command:AskForProgramName}')) {
      config.program = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getProgramName'
      )
    }

    if (config.program === '') {
      // need to invalidate a variable data file so the DebugConfigurationProvider doesn't try to resolve it after we return
      if (config.data.includes('${command:AskForDataName}')) {
        config.data = ''
      }

      return false
    }

    // Get data file before debugger starts to avoid timeout
    if (config.data.includes('${command:AskForDataName}')) {
      config.data = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getDataName'
      )
    }
  }

  if (
    config?.tdmlConfig?.action === 'generate' ||
    config?.tdmlConfig?.action === 'append' ||
    config?.tdmlConfig?.action === 'execute'
  ) {
    if (
      config?.tdmlConfig?.name === undefined ||
      config?.tdmlConfig?.name.includes('${command:AskForTDMLName}')
    )
      config.tdmlConfig.name = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getTDMLName'
      )

    if (
      config?.tdmlConfig?.description === undefined ||
      config?.tdmlConfig?.description.includes(
        '${command:AskForTDMLDescription}'
      )
    )
      config.tdmlConfig.description = await vscode.commands.executeCommand(
        'extension.dfdl-debug.getTDMLDescription'
      )

    if (
      config?.tdmlConfig?.path === undefined ||
      config?.tdmlConfig?.path.includes('${command:AskForTDMLPath}')
    )
      if (config?.tdmlConfig?.action === 'generate')
        config.tdmlConfig.path = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getTDMLPath'
        )
      else
        config.tdmlConfig.path = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getValidatedTDMLPath'
        )
  }

  if (config?.tdmlConfig?.action !== 'execute' && config.data === '') {
    return false
  }

  return true
}

async function getDaffodilDebugClasspath(
  config: vscode.DebugConfiguration,
  workspaceFolder: string
): Promise<string> {
  let daffodilDebugClasspath = ''

  //check if each classpath still exists
  if (config.daffodilDebugClasspath) {
    config.daffodilDebugClasspath.split(':').forEach((entry: string) => {
      let fullpathEntry = entry.replaceAll(
        '${workspaceFolder}',
        workspaceFolder
      )

      if (!fs.existsSync(fullpathEntry)) {
        throw new Error(`File or directory: ${fullpathEntry} doesn't exist`)
      }
    })

    daffodilDebugClasspath = config.daffodilDebugClasspath.includes(
      '${workspaceFolder}'
    )
      ? config.daffodilDebugClasspath.replace(
          regexp['workspace'],
          workspaceFolder
        )
      : config.daffodilDebugClasspath
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
  const artifact = daffodilArtifact(
    daffodilVersion(context.asAbsolutePath('./package.json'))
  )

  // If useExistingServer var set to false make sure version of debugger entered is downloaded then ran
  if (!config.useExistingServer) {
    if (vscode.workspace.workspaceFolders !== undefined) {
      let rootPath = xdgAppPaths.data()

      // If data and app directories for storing debugger does not exist create them
      if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true })
      }

      // Code for downloading and setting up daffodil-debugger files
      if (!fs.existsSync(`${rootPath}/${artifact.name}`)) {
        // Get daffodil-debugger zip from extension files
        const filePath = path
          .join(
            context.asAbsolutePath('./debugger/target/universal'),
            artifact.archive
          )
          .toString()

        // If debugging the extension without vsix installed make sure debugger is created
        await buildDebugger(context.asAbsolutePath('.'), filePath)

        // Unzip file
        await unzipFile(filePath, rootPath)
      }

      await stopDebugger()

      if (!(await getTDMLConfig(config))) {
        return await stopDebugging()
      }

      let workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : vscode.Uri.parse('').fsPath

      // Get daffodilDebugger class paths to be added to the debugger
      const daffodilDebugClasspath = await getDaffodilDebugClasspath(
        config,
        workspaceFolder
      )

      // Start debugger in terminal based on scriptName

      /*
       * For Mac if /bin/bash --login -c not used errors about compiled version versus
       * currently being used java version. Not sure if its needed for linux but it
       * being there will cause no issues.
       */

      await runDebugger(
        rootPath,
        daffodilDebugClasspath,
        context.asAbsolutePath('./package.json'),
        config.debugServer
      )
    }
  }
}
