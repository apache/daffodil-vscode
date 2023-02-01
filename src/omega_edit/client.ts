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

import * as fs from 'fs'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import { killProcess } from '../utils'
import { startOmegaEditServer } from './utils'
import { DataEditWebView } from './dataEditWebView'
import * as omegaEditVersion from 'omega-edit/version'

let serverRunning = false
let serverTerminal: vscode.Terminal | undefined
const xdgAppPaths = XDGAppPaths({ name: 'omega_edit' })
let rootPath = xdgAppPaths.data()

// Method to get omega-edit version from a JSON file
export function getOmegaEditPackageVersion(filePath: fs.PathLike) {
  return JSON.parse(fs.readFileSync(filePath).toString())['dependencies'][
    'omega-edit'
  ]
}

async function commonOmegaEdit(
  ctx: vscode.ExtensionContext,
  startServer: boolean,
  omegaEditPackageVersion: string
) {
  if (!serverRunning && startServer) {
    ;[serverTerminal, serverRunning] = await startOmegaEditServer(
      ctx,
      rootPath,
      omegaEditPackageVersion
    )
  }
}

export function activate(ctx: vscode.ExtensionContext) {
  const omegaEditPackageVersion = getOmegaEditPackageVersion(
    ctx.asAbsolutePath('./package.json')
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'omega_edit.version',
      async (startServer: boolean = true) => {
        await commonOmegaEdit(ctx, startServer, omegaEditPackageVersion)
        return await omegaEditVersion.getVersion()
      }
    ),
    vscode.commands.registerCommand(
      'data.edit',
      async (
        filePassed: string = '',
        startServer: boolean = true,
        subscribeToViewports: boolean = true
      ) => {
        await commonOmegaEdit(ctx, startServer, omegaEditPackageVersion)
        return await createOmegaEditWebviewPanel(
          ctx,
          filePassed,
          subscribeToViewports
        )
      }
    )
  )
}

async function createOmegaEditWebviewPanel(
  ctx: vscode.ExtensionContext,
  filePassed: string,
  subscribeToViewports: boolean
) {
  const dataEditorView = new DataEditWebView(ctx, 'dataEditor', 'Data Editor')
  await dataEditorView.initialize()
  dataEditorView.show()

  dataEditorView.panel.onDidDispose(
    async () => {
      dataEditorView.dispose()
      await serverTerminal?.processId.then(async (id) => await killProcess(id))
      serverRunning = false
      vscode.window.showInformationMessage('omega-edit server stopped!')
    },
    undefined,
    ctx.subscriptions
  )

  return dataEditorView
}
