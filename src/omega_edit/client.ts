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
import {
  ChangeKind,
  ChangeRequest,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'
import { getVersion } from './utils/version'
import { createSession, deleteSession, saveSession } from './utils/session'
import {
  createViewport,
  // deleteViewport,
  viewportSubscribe,
} from './utils/viewport'
import { startServer, stopServer } from './server'
import { client, randomId } from './utils/settings'

let serverRunning = false

async function cleanupViewportSession(
  sessionId: string,
  viewportIds: Array<string>
) {
  await deleteSession(sessionId)
}

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('omega.version', async () => {
      if (!serverRunning) {
        await startServer(ctx)
        serverRunning = true
      }
      let v = await getVersion()
      vscode.window.showInformationMessage(v)
    })
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('omega.grpc', async () => {
      if (!serverRunning) {
        await startServer(ctx)
        serverRunning = true
      }

      let panel = vscode.window.createWebviewPanel(
        'viewport',
        'Ω Edit gRPC',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      )

      // panel.webview.html = getWebviewContent(uri)
      panel.webview.html = getWebviewContent(ctx)

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

      let s = await createSession(fileToEdit)
      panel.webview.postMessage({
        command: 'setSessionFile',
        filePath: fileToEdit,
      })
      // panel.webview.postMessage({ command: 'session', text: s })

      let vpin = await createViewport(randomId().toString(), s, 0, 1000)
      let vp1 = await createViewport(randomId().toString(), s, 0, 64)
      let vp2 = await createViewport(randomId().toString(), s, 64, 64)
      let vp3 = await createViewport(randomId().toString(), s, 128, 64)

      let vpdrin = new ViewportDataRequest()
      vpdrin.setViewportId(vpin)
      client.getViewportData(vpdrin, (err, r) => {
        let data = r?.getData_asB64()
        if (data) {
          let txt = Buffer.from(data, 'base64').toString('binary')
          panel.webview.postMessage({ command: 'input', text: txt })
        }
      })

      await viewportSubscribe(panel, vp1, vp1, 'viewport1', 'hex1')
      await viewportSubscribe(panel, vp1, vp2, 'viewport2', null)
      await viewportSubscribe(panel, vp1, vp3, 'viewport3', 'hex2')

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case 'send':
              let b64 = Buffer.from(message.text, 'binary').toString('base64')
              let change = new ChangeRequest()
              change.setSessionId(s)
              change.setKind(ChangeKind.CHANGE_OVERWRITE)
              change.setData(b64)
              change.setOffset(0)
              change.setLength(1000)
              client.submitChange(change, (err, r) => {
                if (err) console.log(err)
                else console.log(r)
              })
              return
            case 'save':
              let filePath = message.overwrite
                ? message.sessionFile
                : await vscode.window.showInputBox({
                    placeHolder: 'Save session as:',
                  })

              if (filePath) {
                let rootPath = vscode.workspace.workspaceFolders
                  ? vscode.workspace.workspaceFolders[0].uri.fsPath
                  : ''

                if (rootPath !== '' && !filePath.includes(rootPath)) {
                  filePath = `${rootPath}/${filePath}`
                }

                await saveSession(s, filePath, message.overwrite)
                vscode.window.showInformationMessage(
                  `Session saved to ${filePath}`
                )
                vscode.window.showInformationMessage('Session cleared')
              }
              return
          }
        },
        undefined,
        ctx.subscriptions
      )

      panel.onDidDispose(
        async () => {
          await cleanupViewportSession(s, [vpin, vp1, vp2, vp3])
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
    ctx.asAbsolutePath('./src/omega_edit/scripts/omega_edit.js')
  )
  const styleUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/styles/styles.css')
  )
  const scriptData = fs.readFileSync(scriptUri.fsPath)
  const styleData = fs.readFileSync(styleUri.fsPath)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omega gRPC</title>
  <style>
      .save-button {
        margin-top: 5px;
        background-color: lightgray;
        border: none;
        border-radius: 12px;
        color: black;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 12px;
        cursor: pointer;
        width: 75px;
        height: 30px;
      }
  
      .grid-container {
        display: grid;
        grid-gap: 2px 2px;
        grid-template-columns: auto auto auto;
        background-color: #2196F3;
        padding: 5px;
      }

      .grid-item {
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(0, 0, 0, 0.8);
        padding: 2px;
        font-size: 12px;
        text-align: left;
        color: black;
        white-space: pre;
        font-family: monospace;
      }

      ${styleData}
  </style>
</head>
<body>
  <!-- <div id="server">uri</div> -->
  <!-- <div id="session">?</div> -->
  <div style="visibilityHidden" id="sessionFile"></div>
  <div class="grid-container">
      <div class="grid-item" id="viewport1">empty</div>
      <div class="grid-item" id="viewport2">empty</div>
      <div class="grid-item" id="viewport3">empty</div>
      <div class="grid-item" id="hex1"></div>
      <div class="grid-item"><textarea id="input" rows="10" cols="50" oninput="sendit(this.value)"></textarea></div>
      <div class="grid-item" id="hex2"></div>
  </div>
  <br/>
  <div class="setting-div" style="margin-top: 10px;" onclick="check('overwriteSessionFile')">
    <label class="container">Overwrite File
      <input type="checkbox" id="overwriteSessionFile">
      <span class="checkmark"></span>
    </label>
    <button id="save" class="save-button" type="button" onclick="saveSession()">Save Session</button>
  </div>
  <script>
      ${scriptData}
  </script>
</body>
</html>`
}
