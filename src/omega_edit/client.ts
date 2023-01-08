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
import * as omegaEditSession from 'omega-edit/session'
import * as omegaEditViewport from 'omega-edit/viewport'
import * as omegaEditVersion from 'omega-edit/version'
import { startOmegaEditServer, viewportSubscribe } from './utils'
import { OmegaEdit } from './omega_edit'
import { v4 as uuidv4 } from 'uuid'
import XDGAppPaths from 'xdg-app-paths'
import { killProcess } from '../utils'
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
    )
  )

  ctx.subscriptions.push(
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
  let panel = vscode.window.createWebviewPanel(
    'viewport',
    'Data Editor',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  )

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

  panel.webview.html = getWebviewContent(ctx)

  let s = await omegaEditSession.createSession(fileToEdit, uuidv4())
  panel.webview.postMessage({
    command: 'setSessionFile',
    filePath: fileToEdit,
  })

  let vpAll = await omegaEditViewport.createViewport('', s, 0, 1000, false)
  let vp1 = await omegaEditViewport.createViewport('', s, 0, 64, false)
  let vp2 = await omegaEditViewport.createViewport('', s, 64, 64, false)
  let vp3 = await omegaEditViewport.createViewport('', s, 128, 64, false)

  // This break CI so option was added to skip it during CI
  if (subscribeToViewports) {
    await viewportSubscribe(panel, vpAll, vpAll, 'vpAll', 'hexAll')
    await viewportSubscribe(panel, vpAll, vp1, 'viewport1', null)
    await viewportSubscribe(panel, vpAll, vp2, 'viewport2', null)
    await viewportSubscribe(panel, vpAll, vp3, 'viewport3', null)
  }

  panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.command === 'printChangeCount') {
        vscode.window.showInformationMessage(message.changeCount)
        return
      }

      var omegaEdit = new OmegaEdit(
        s,
        message.offset,
        message.data,
        message.len,
        panel
      )

      var fileSize = await omegaEditSession.getComputedFileSize(s)
      var searchPattern = message.searchPattern ? message.searchPattern : ''

      // If the search pattern exceeds the length of the file, matches are
      // not possible.  Ωedit (as implemented currently) considers
      // patterns that are longer than the length of the file to be an
      // error (it will return a null pointer instead of an empty list).
      if (searchPattern !== '' && fileSize < searchPattern.length) {
        throw new Error("Search pattern can't be larger than file")
      }

      omegaEdit.execute(
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

  panel.onDidDispose(
    async () => {
      await cleanupViewportSession(s, [vpAll, vp1, vp2, vp3])
      panel.dispose()
      await serverTerminal?.processId.then(async (id) => await killProcess(id))
      serverRunning = false
      vscode.window.showInformationMessage('omega-edit server stopped!')
    },
    undefined,
    ctx.subscriptions
  )

  return panel
}

function getWebviewContent(ctx: vscode.ExtensionContext) {
  const scriptUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/omega_edit/omega_edit.js')
  )
  const styleUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/styles/styles.css')
  )
  const uiUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/omega_edit/interface.html')
  )
  const scriptData = fs.readFileSync(scriptUri.fsPath)
  const styleData = fs.readFileSync(styleUri.fsPath)
  const uiData = fs.readFileSync(uiUri.fsPath)

  return uiData
    .toString()
    .replace("'<SCRIPT_DATA>'", `${scriptData}`)
    .replace('<style></style>', `<style>${styleData}</style>`)
}
