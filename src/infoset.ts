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

import { tmpdir } from 'os'
import * as vscode from 'vscode'
import * as daf from './daffodil'
import * as fs from 'fs'
import { InfosetEvent } from './daffodil'
import { Uri } from 'vscode'
import { onDebugStartDisplay, getCurrentConfig } from './utils'

// Function to display an infomation message that the infoset file has been created
// If the user wishes to open the file then they may click the 'Open' button
async function openInfosetFilePrompt() {
  let config = JSON.parse(JSON.stringify(getCurrentConfig()))

  if (config.infosetOutput.type === 'file') {
    let rootPath = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : vscode.Uri.parse('').fsPath
    let path = config.infosetOutput.path.includes('${workspaceFolder}')
      ? config.infosetOutput.path.replace('${workspaceFolder}', rootPath)
      : config.infosetOutput.path

    const action = await vscode.window.showInformationMessage(
      `Wrote infoset file to ${path}`,
      'Open',
      'Dismiss'
    )

    let uri = vscode.Uri.parse(path)

    switch (action) {
      case 'Open':
        let infoset = await vscode.workspace.openTextDocument(uri)
        await vscode.window.showTextDocument(infoset, {
          preview: false,
          viewColumn: vscode.ViewColumn.One,
        })
        break
    }
  }
}

export async function activate(ctx: vscode.ExtensionContext) {
  let sid: string | undefined
  let doc: vscode.TextDocument | undefined

  ctx.subscriptions.push(
    vscode.debug.onDidStartDebugSession((s) => {
      sid = s.id
      onDebugStartDisplay(['infoset-view', 'infoset-diff-view'])
    })
  )
  ctx.subscriptions.push(
    vscode.debug.onDidTerminateDebugSession(async (s) => {
      if (sid !== undefined) {
        let path = tmp(sid)
        fs.rmSync(`${path}`, { force: true })
        fs.rmSync(`${path}.prev`, { force: true })
      }
      sid = undefined
      await openInfosetFilePrompt()
    })
  )
  ctx.subscriptions.push(
    vscode.debug.onDidReceiveDebugSessionCustomEvent(handleEvent)
  )
  ctx.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      'daffodil:infoset',
      fileInfosetProvider
    )
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('infoset.display', async () => {
      if (sid !== undefined) {
        let path = ensure(tmp(sid))
        doc = await vscode.workspace.openTextDocument(path)
        await vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Two,
          preserveFocus: true,
          preview: false,
        })
      }
    })
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'infoset.save',
      async (id: string, e: daf.InfosetEvent) => {
        if (sid !== undefined) {
          let dest = await vscode.window.showInputBox({
            placeHolder: 'Save infoset as:',
          })
          if (dest) {
            fs.copyFile(tmp(sid), dest, async () => {
              const choice = await vscode.window.showInformationMessage(
                `Wrote infoset to ${dest}`,
                'View',
                'Delete'
              )
              let uri = Uri.parse(dest!)
              switch (choice) {
                case 'View':
                  let xml = await vscode.workspace.openTextDocument(uri)
                  await vscode.window.showTextDocument(xml, {
                    preview: false,
                    viewColumn: vscode.ViewColumn.Two,
                  })
                  break
                case 'Delete':
                  fs.unlinkSync(dest!)
                  break
              }
            })
          }
        }
      }
    )
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('infoset.diff', async () => {
      if (sid !== undefined) {
        let path = ensure(tmp(sid))
        let prev = ensure(`${path}.prev`)
        vscode.commands.executeCommand(
          'vscode.diff',
          Uri.parse(prev),
          Uri.parse(path),
          'Previous ↔ Current',
          { preview: false, viewColumn: vscode.ViewColumn.Two }
        )
      }
    })
  )
}

async function handleEvent(e: vscode.DebugSessionCustomEvent) {
  switch (e.event) {
    case daf.infosetEvent:
      let update: InfosetEvent = e.body
      let path = ensure(tmp(e.session.id))
      fs.copyFileSync(path, `${path}.prev`)
      fs.writeFileSync(path, update.content)
      break
  }
}

const fileInfosetProvider = new (class
  implements vscode.TextDocumentContentProvider
{
  provideTextDocumentContent(uri: vscode.Uri): string {
    return fs.readFileSync(uri.path).toString()
  }
})()

function tmp(sid: string): string {
  return `${tmpdir()}/infoset-${sid}.${getCurrentConfig().infosetFormat}`
}

function ensure(path: string): string {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '')
  }
  return path
}
