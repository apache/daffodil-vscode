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
import * as child_process from 'child_process'
import * as path from 'path'
import * as os from 'os'
import { Artifact } from './download'
import XDGAppPaths from 'xdg-app-paths'

const xdgAppPaths = XDGAppPaths({ name: 'omega_edit' })

export async function startServer(
  ctx: vscode.ExtensionContext,
  omegaEditVersion: string
) {
  // Get omegaEditVersion
  const artifact = new Artifact(omegaEditVersion)
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  if (vscode.workspace.workspaceFolders) {
    let rootPath = xdgAppPaths.data()

    // If data and app directories for holding omega server script do not exist create them
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true })
    }

    // Download and setup omega-edit server files
    if (!fs.existsSync(`${rootPath}/${artifact.name}`)) {
      const filePath = path.join(
        ctx.asAbsolutePath('./src/omega_edit/'),
        artifact.archive
      )

      // Unzip file and remove zip
      await new Promise((resolve, reject) => {
        let stream = fs
          .createReadStream(filePath)
          .pipe(unzip.Extract({ path: `${rootPath}` }))
        stream.on('close', () => {
          try {
            resolve(filePath)
          } catch (err) {
            reject(err)
          }
        })
      })
      fs.unlinkSync(filePath)
    }

    let scriptPath = `${artifact.name}/${artifact.getOsFolder()}`

    if (!os.platform().toLowerCase().startsWith('win')) {
      child_process.execSync(
        `chmod +x ${rootPath.replace(
          ' ',
          '\\ '
        )}/${scriptPath}/bin/${artifact.scriptName.replace('./', '')}`
      )
    }

    // Start server in terminal based on scriptName
    let terminal = vscode.window.createTerminal({
      name: artifact.scriptName,
      cwd: `${rootPath}/${scriptPath}/bin`,
      hideFromUser: false,
      shellPath: artifact.scriptName,
    })
    terminal.show()

    // Wait for 5000ms to make sure server is running before client tries to connect
    await delay(5000)
  }
}

// Function for stopping debugging
export async function stopServer() {
  const action = await vscode.window.showInformationMessage(
    'Stop Ωedit server?',
    'Yes',
    'No'
  )

  if (action === 'Yes') {
    vscode.window.activeTerminal?.processId.then((id) => {
      if (id) {
        if (os.platform() === 'win32') {
          child_process.exec(`taskkill /F /PID ${id}`)
        } else {
          child_process.exec(`kill -9 ${id}`)
        }
      }
    })

    return true
  }

  return false
}
