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
import { createSession, deleteSession, saveSession } from './utils/session'
import {
  createViewport,
  // deleteViewport,
  viewportSubscribe,
} from './utils/viewport'
import { startServer, stopServer } from './server'
import { client, randomId } from './utils/settings'
import * as hexy from 'hexy'

let serverRunning = false

async function cleanupViewportSession(
  sessionId: string,
  viewportIds: Array<string>
) {
  await deleteSession(sessionId)
}

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('data.edit.wip', async () => {
      if (!serverRunning) {
        await startServer(ctx)
        serverRunning = true
      }

      let panel = vscode.window.createWebviewPanel(
        'viewport',
        'ΩEdit',
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

      if (fileToEdit) {
        let hex = hexy.hexy(
          fs.readFileSync(vscode.Uri.parse(fileToEdit).fsPath)
        )
        panel.webview.html = getWebviewContent(ctx, fileToEdit, hex)
      }

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

function getWebviewContent(
  ctx: vscode.ExtensionContext,
  fileToEdit: string,
  hex: string
) {
  const scriptUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/omega_edit/scripts/omega_edit.js')
  )
  const styleUri = vscode.Uri.parse(
    ctx.asAbsolutePath('./src/styles/omega_edit.css')
  )
  const scriptData = fs.readFileSync(scriptUri.fsPath)
  const styleData = fs.readFileSync(styleUri.fsPath)

  let offsetLines = ''
  let encodedData = ''
  let decodedData = ''

  let hexLines = hex.split('\n')

  // Format hex code to make the file look nicer
  hexLines.forEach((h) => {
    if (h) {
      let splitHex = h.split(':')
      let dataLocations = splitHex[1].split(' ')

      offsetLines += splitHex[0] + '<br/>'
      if (dataLocations.length > 9) {
        for (var i = 1; i < 9; i++) {
          let middle = Math.floor(dataLocations[i].length / 2)
          encodedData +=
            dataLocations[i].substr(0, middle).toUpperCase() +
            '' +
            dataLocations[i].substr(middle).toUpperCase() +
            ' '
        }
      }

      encodedData += '<br/>'
      decodedData +=
        h.split('  ').slice(1, h.split('  ').length).join('  ') + '<br/>'
    }
  })

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Editor</title>
    <link rel="stylesheet" href="edit.css">
    <style>${styleData}</style>
  </head>
  <body>
    <!-- <div id="server">uri</div> -->
    <!-- <div id="session">?</div> -->
    <div style="visibilityHidden" id="sessionFile"></div>
    <div class="offset-div">
      <p class="offset-text">Offset</p>
      <div class="offset-area">${offsetLines}</div>
    </div>
  
    <div class="encoding-div">
      <p class="encoding-text">Encoding</p>
        
      <div class="encoding-area">${encodedData}</div>
    </div>
    <div class="decoded-div">
      <p class="decoded-text">Decoded Text</p>
        
      <div class="decoded-area">${decodedData}</div>
    </div>
    <div class="inspector-div">
      <p class="inspector-text">Data Inspector</p>
      <label style="margin-top: 10px;" class="container">Little Indian
        <input type="checkbox">
        <span class="checkmark"></span>
      </label>
      <div class="format-area">uint8<br/>
        uint8<br/>
        int8<br/>
        uint16<br/>
        int16<br/>
        uint32<br/>
        int32<br/>
        uint64<br/>
        int64<br/>
        float32<br/>
        float64<br/>
        UTF-8<br/>
        UTF-16<br/>
      </div>
      <label style="margin-top: 14px; padding-left: 0px;" class="container">Stats</label>
      <div class="stats-area">File Size:<br/></div>
    </div>
  
    <div class="viewport-div">
      <p class="viewport-text">Viewports</p>
      <label style="margin-top: 5px; padding-left: 0px; width: 100px;" class="container">Offset
        <div style="position: absolute; top: 0; margin-left: 45px; height: 10px; width: 35px; border: 2px solid;"></div>
      </label>
      <div class="viewport-area"></div>
  
      <label style="margin-top: 14px; padding-left: 0px; width: 100px;" class="container">Offset
        <div style="position: absolute; top: 0; margin-left: 45px; height: 10px; width: 35px; border: 2px solid;"></div>
      </label>
      <div class="viewport-area"></div>
      <br/>
      <label style="margin-top: -5px; padding-left: 0px; width: 100px;" class="container">Offset
        <div style="position: absolute; top: 0; margin-left: 45px; height: 10px; width: 35px; border: 2px solid;"></div>
      </label>
      <div class="viewport-area"></div>
    </div>
    <script>
        ${scriptData}
    </script>
    <script>
    </script>
  </body>
  </html>  
  `
}
