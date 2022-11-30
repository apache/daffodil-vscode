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
import * as os from 'os'
import * as child_process from 'child_process'
import { deactivate } from './adapter/extension'
import { LIB_VERSION } from './version'
import XDGAppPaths from 'xdg-app-paths'
import * as path from 'path'
import { regexp, unzipFile, runScript } from './utils'
import { getDaffodilVersion } from './daffodil'
import { Artifact } from './classes/artifact'

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
  // Get daffodilVersion
  const daffodilVersion = getDaffodilVersion(
    context.asAbsolutePath('./package.json')
  )
  const artifact = new Artifact(
    'daffodil-debugger',
    daffodilVersion,
    'daffodil-debugger'
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
        if (!filePath.includes('.vscode/extension')) {
          if (!fs.existsSync(filePath)) {
            let baseFolder = context.asAbsolutePath('.')
            let command =
              os.platform() === 'win32'
                ? 'sbt universal:packageBin'
                : '/bin/bash --login -c "sbt universal:packageBin"' // Needed --login so it could resolve sbt command
            child_process.execSync(command, { cwd: baseFolder })
          }
        }

        // Unzip file
        await unzipFile(filePath, rootPath)
      }

      // Stop debugger if running
      if (os.platform() === 'win32') {
        // Windows stop debugger if already running
        child_process.execSync(
          'tskill java 2>nul 1>nul || echo "Java not running"'
        )
      } else {
        // Linux/Mac stop debugger if already running and make sure script is executable
        child_process.exec(
          "kill -9 $(ps -ef | grep 'daffodil' | grep 'jar' | awk '{ print $2 }') || return 0"
        ) // ensure debugger server not running and
      }

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

        return stopDebugging()
      }

      // Get data file before debugger starts to avoid timeout
      if (config.data.includes('${command:AskForDataName}')) {
        config.data = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getDataName'
        )
      }

      if (config.data === '') {
        return stopDebugging()
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

      let shellPath =
        os.platform() === 'win32' ? artifact.scriptName : '/bin/bash'
      let shellArgs =
        os.platform() === 'win32' ? [] : ['--login', '-c', artifact.scriptName]

      await runScript(
        `${rootPath}/daffodil-debugger-${daffodilVersion}-${LIB_VERSION}`,
        artifact,
        shellPath,
        shellArgs,
        {
          DAFFODIL_DEBUG_CLASSPATH: daffodilDebugClasspath,
        },
        'daffodil'
      )
    }
  }

  // Function for stopping debugging
  function stopDebugging() {
    vscode.debug.stopDebugging()
    deactivate()
    vscode.window.activeTerminal?.processId.then((id) => {
      if (id) {
        if (os.platform() === 'win32') {
          child_process.exec(`taskkill /F /PID ${id}`)
        } else {
          child_process.exec(`kill -9 ${id}`)
        }
      }
    })
  }
}
