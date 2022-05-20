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
import { createSession, destroySession } from 'omega-edit/session'
import { createViewport } from 'omega-edit/viewport'
import { getVersion } from 'omega-edit/version'
import { startServer, stopServer } from './server'
import { randomId, viewportSubscribe } from './utils'
import { OmegaEdit } from './omega_edit'

let serverRunning = false

async function cleanupViewportSession(
  sessionId: string,
  viewportIds: Array<string>
) {
  await destroySession(sessionId)
}

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('omega_edit.version', async () => {
      if (!serverRunning) {
        await startServer(ctx)
        serverRunning = true
      }
      let v = await getVersion()
      vscode.window.showInformationMessage(v)
    })
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('data.edit', async () => {
      if (!serverRunning) {
        await startServer(ctx)
        serverRunning = true
      }

      let panel = vscode.window.createWebviewPanel(
        'viewport',
        'Data Editor',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      )

      let fileToEdit = await vscode.window
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

      let s = await createSession(fileToEdit, '')
      panel.webview.postMessage({
        command: 'setSessionFile',
        filePath: fileToEdit,
      })

      let vpAll = await createViewport(randomId().toString(), s, 0, 1000)
      let vp1 = await createViewport(randomId().toString(), s, 0, 64)
      let vp2 = await createViewport(randomId().toString(), s, 64, 64)
      let vp3 = await createViewport(randomId().toString(), s, 128, 64)

      await viewportSubscribe(panel, vpAll, vpAll, 'vpAll', 'hexAll')
      await viewportSubscribe(panel, vpAll, vp1, 'viewport1', null)
      await viewportSubscribe(panel, vpAll, vp2, 'viewport2', null)
      await viewportSubscribe(panel, vpAll, vp3, 'viewport3', null)

      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.command === 'printChangeCount') {
            vscode.window.showInformationMessage(message.changeCount)
            return
          }
          var omegaEdit = new OmegaEdit(
            s,
            message.offset,
            message.command === 'overwriteByte'
              ? `${message.deleteValue},${message.addValue}`
              : message.data,
            message.len,
            panel
          )
          omegaEdit.execute(
            message.command,
            message.sessionFile ? message.sessionFile : '',
            message.overwrite ? message.overwrite : false,
            message.newFile ? message.newFile : false
          )
        },
        undefined,
        ctx.subscriptions
      )

      panel.onDidDispose(
        async () => {
          await cleanupViewportSession(s, [vpAll, vp1, vp2, vp3])
          panel.dispose()
          serverRunning = !(await stopServer())
        },
        undefined,
        ctx.subscriptions
      )
    })
  )
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
