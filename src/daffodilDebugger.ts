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
import { regexp, unzipFile } from './utils'
import {
  buildDebugger,
  daffodilArtifact,
  daffodilVersion,
  runDebugger,
  stopDebugger,
  stopDebugging,
} from './daffodilDebuggerUtils'

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
            context.asAbsolutePath('./server/core/target/universal'),
            artifact.archive
          )
          .toString()

        // If debugging the extension without vsix installed make sure debugger is created
        await buildDebugger(context.asAbsolutePath('.'), filePath)

        // Unzip file
        await unzipFile(filePath, rootPath)
      }

      await stopDebugger()

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

        return await stopDebugging()
      }

      // Get data file before debugger starts to avoid timeout
      if (config.data.includes('${command:AskForDataName}')) {
        config.data = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName'
        )
      }

      if (config.data === '') {
        return await stopDebugging()
      }

      let workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : vscode.Uri.parse('').fsPath

      // Get daffodilDebugger class paths to be added to the debugger
      let daffodilDebugClasspath = ''

      if (config.daffodilDebugClasspath) {
        daffodilDebugClasspath = config.daffodilDebugClasspath.includes(
          '${workspaceFolder}'
        )
          ? config.daffodilDebugClasspath.replace(
              regexp['workspace'],
              workspaceFolder
            )
          : config.daffodilDebugClasspath
      }

      // Start debugger in terminal based on scriptName

      /*
       * For Mac if /bin/bash --login -c not used errors about compiled version versus
       * currently being used java version. Not sure if its needed for linux but it
       * being there will cause no issues.
       */

      await runDebugger(
        rootPath,
        daffodilDebugClasspath,
        context.asAbsolutePath('./package.json')
      )
    }
  }
}
