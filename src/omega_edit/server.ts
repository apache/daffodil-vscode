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
import { Artifact } from '../classes/artifact'
import XDGAppPaths from 'xdg-app-paths'
import { runScript, unzipFile, killProcess } from '../utils'

const xdgAppPaths = XDGAppPaths({ name: 'omega_edit' })

export async function getServer(
  ctx: vscode.ExtensionContext,
  omegaEditVersion: string
) {
  // Get omegaEditVersion
  const artifact = new Artifact(
    'omega-edit-scala-server',
    omegaEditVersion,
    'example-grpc-server'
  )

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
      await unzipFile(filePath, rootPath)
    }
  }

  await runScript(
    `${ctx.asAbsolutePath('./src/omega_edit')}/${
      artifact.name
    }/${artifact.getOsFolder()}`,
    artifact
  )
}

// Function for stopping debugging
export async function stopServer(terminal: vscode.Terminal | null = null) {
  if (terminal !== null) {
    terminal.processId.then(async (id) => await killProcess(id))
    return true
  } else {
    const action = await vscode.window.showInformationMessage(
      'Stop Ωedit server?',
      'Yes',
      'No'
    )

    if (action === 'Yes') {
      vscode.window.activeTerminal?.processId.then(
        async (id) => await killProcess(id)
      )
      return true
    }

    return false
  }
}
