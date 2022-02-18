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
import { HttpClient } from 'typed-rest-client/HttpClient'
import XDGAppPaths from 'xdg-app-paths'

const xdgAppPaths = XDGAppPaths({ name: 'omega_edit' })

class Backend {
  constructor(readonly owner: string, readonly repo: string) {}
}

class Artifact {
  constructor(readonly omegaVersion: string) {}

  name = `omega-edit-scala-server-${this.omegaVersion}`
  archive = `${this.name}.zip`
  archiveUrl = (backend: Backend) =>
    `https://github.com/${backend.owner}/${backend.repo}/releases/download/v${this.omegaVersion}/${this.archive}`

  scriptName = os.platform().toLowerCase().startsWith('win32')
    ? 'example-grpc-server.bat'
    : './example-grpc-server'

  getOsFolder() {
    if (os.platform().toLowerCase().startsWith('win')) {
      return 'windows'
    } else if (os.platform().toLowerCase().startsWith('darwin')) {
      return 'macos'
    } else {
      return 'linux'
    }
  }
}

// Method to get omegaVersion from a JSON file
export function getOmegaVersion(filePath: fs.PathLike) {
  return JSON.parse(fs.readFileSync(filePath).toString())['omegaVersion']
}

export async function startServer(ctx: vscode.ExtensionContext) {
  // Get omegaVersion
  const omegaVersion = getOmegaVersion(ctx.asAbsolutePath('./package.json'))
  const artifact = new Artifact(omegaVersion)
  const backend = new Backend('ctc-oss', 'omega-edit')
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  if (vscode.workspace.workspaceFolders) {
    let rootPath = xdgAppPaths.data()

    // If data and app directories for holding omega server script do not exist create them
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true })
    }

    // Download and setup omega-edit server files
    if (!fs.existsSync(`${rootPath}/${artifact.name}`)) {
      // Get omega-edit server of version entered using http client
      vscode.window.showInformationMessage('Ωedit server downloading...')
      const client = new HttpClient('client')
      const artifactUrl = artifact.archiveUrl(backend)
      const response = await client.get(artifactUrl)

      if (response.message.statusCode !== 200) {
        const err: Error = new Error(
          `Couldn't download the OmegaEdit sever backend from ${artifactUrl}.`
        )
        err['httpStatusCode'] = response.message.statusCode
        throw err
      }

      // Create zip from rest call
      const filePath = `${rootPath}/${artifact.archive}`
      const file = fs.createWriteStream(filePath)

      await new Promise((resolve, reject) => {
        file.on(
          'error',
          (err) =>
            function () {
              throw err
            }
        )
        const stream = response.message.pipe(file)
        stream.on('close', () => {
          try {
            resolve(filePath)
          } catch (err) {
            reject(err)
          }
        })
      })
      vscode.window.showInformationMessage('Ωedit server downloaded!')

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
  }
}
