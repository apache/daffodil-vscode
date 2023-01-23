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
import * as omegaEditSession from 'omega-edit/session'
import * as omegaEditVersion from 'omega-edit/version'
import * as omegaEditViewport from 'omega-edit/viewport'
import { v4 as uuidv4 } from 'uuid'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import { killProcess } from '../utils'
import { OmegaEdit } from './omega_edit'
import { startOmegaEditServer, viewportSubscribe } from './utils'
import { WebView } from './webView'
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

async function cleanupViewportSession(
  sessionId: string,
  viewportIds: Array<string>
) {
  viewportIds.forEach(async (vid) => {
    await omegaEditViewport.destroyViewport(vid)
  })
  await omegaEditSession.destroySession(sessionId)
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
): Promise<WebView> {
  const dataEditorView = new WebView(ctx, 'dataEditor', 'Data Editor')
  dataEditorView.show()

  let fileToEdit =
    filePassed !== ''
      ? filePassed
      : await vscode.window
          .showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true,
            canSelectFolders: false,
          })
          .then((fileUri) => {
            if (fileUri && fileUri[0]) {
              return fileUri[0].fsPath
            }
          })

  let s = await omegaEditSession.createSession(fileToEdit, uuidv4())
  dataEditorView.panel.webview.postMessage({
    command: 'setSessionFile',
    filePath: fileToEdit,
  })

  let vpAll = await omegaEditViewport.createViewport('', s, 0, 1000, false)
  let vp1 = await omegaEditViewport.createViewport('', s, 0, 64, false)
  let vp2 = await omegaEditViewport.createViewport('', s, 64, 64, false)
  let vp3 = await omegaEditViewport.createViewport('', s, 128, 64, false)

  // This break CI so option was added to skip it during CI
  if (subscribeToViewports) {
    await viewportSubscribe(
      dataEditorView.panel,
      vpAll,
      vpAll,
      'vpAll',
      'hexAll'
    )
    await viewportSubscribe(dataEditorView.panel, vpAll, vp1, 'viewport1', null)
    await viewportSubscribe(dataEditorView.panel, vpAll, vp2, 'viewport2', null)
    await viewportSubscribe(dataEditorView.panel, vpAll, vp3, 'viewport3', null)
  }

  dataEditorView.panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.command === 'printChangeCount') {
        vscode.window.showInformationMessage(message.changeCount)
        return
      }

      const omegaEdit = new OmegaEdit(
        s,
        message.offset,
        message.data,
        message.len,
        dataEditorView.panel
      )

      const fileSize = await omegaEditSession.getComputedFileSize(s)
      const searchPattern = message.searchPattern ? message.searchPattern : ''

      // If the search pattern exceeds the length of the file, matches are
      // not possible.  Ωedit (as implemented currently) considers
      // patterns that are longer than the length of the file to be an
      // error (it will return a null pointer instead of an empty list).
      if (searchPattern !== '' && fileSize < searchPattern.length) {
        throw new Error("Search pattern can't be larger than file")
      }

      await omegaEdit.execute(
        message.command,
        message.sessionFile ? message.sessionFile : '',
        message.overwrite ? message.overwrite : false,
        message.newFile ? message.newFile : false,
        fileSize,
        searchPattern,
        message.replaceText ? message.replaceText : '',
        message.caseInsensitive ? message.caseInsensitive : false
      )
    },
    undefined,
    ctx.subscriptions
  )

  dataEditorView.panel.onDidDispose(
    async () => {
      await cleanupViewportSession(s, [vpAll, vp1, vp2, vp3])
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
