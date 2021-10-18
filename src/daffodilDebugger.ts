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
import * as unzip from 'unzip-stream'
import * as os from 'os'
import * as child_process from 'child_process'
import { deactivate } from './adapter/extension'
import { LIB_VERSION } from './version'
import XDGAppPaths from 'xdg-app-paths'
import * as path from 'path'

const xdgAppPaths = XDGAppPaths({ name: 'daffodil-dap' })

class Artifact {
  constructor(
    readonly daffodilVersion: string,
    readonly version: string = LIB_VERSION
  ) {}

  name = `daffodil-debugger-${this.daffodilVersion}-${this.version}`
  archive = `${this.name}.zip`

  scriptName =
    os.platform() === 'win32' ? 'daffodil-debugger.bat' : './daffodil-debugger'
}

const daffodilVersion = '3.1.0' // TODO: will become a runtime parameter driven by config or artifacts in the releases repo
const artifact = new Artifact(daffodilVersion)

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
  return await vscode.window
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
  // If useExistingServer var set to false make sure version of debugger entered is downloaded then ran
  if (!config.useExistingServer) {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

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
            let baseFolder = context.asAbsolutePath('./')
            child_process.execSync(
              `cd ${baseFolder} && sbt universal:packageBin`
            )
          }
        }

        // Unzip file
        await new Promise((res, rej) => {
          let stream = fs
            .createReadStream(filePath)
            .pipe(unzip.Extract({ path: `${rootPath}` }))
          stream.on('close', () => {
            try {
              res(filePath)
            } catch (err) {
              rej(err)
            }
          })
        })
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
        child_process.execSync(
          `chmod +x ${rootPath.replace(' ', '\\ ')}/${artifact.name}/bin/${
            artifact.scriptName
          }`
        ) // make sure debugger is executable
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

      // Start debugger in terminal based on scriptName
      let terminal = vscode.window.createTerminal({
        name: artifact.scriptName,
        cwd: `${rootPath}/daffodil-debugger-${daffodilVersion}-${LIB_VERSION}/bin/`,
        hideFromUser: false,
        shellPath: artifact.scriptName,
      })
      terminal.show()

      // Wait for 5000 ms to make sure debugger is running before the extension tries to connect to it
      await delay(5000)
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
