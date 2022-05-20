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
import { insert, del } from 'omega-edit/change'
import { getFilePath, undoRedo } from './utils'
import { saveSession } from 'omega-edit/session'

export class OmegaEdit {
  sessionId: string
  offset: number
  data: string
  len: number
  panel: vscode.WebviewPanel

  constructor(
    sessionId: string,
    offset: number = 0,
    data: string = '',
    len: number = 0,
    panel: vscode.WebviewPanel
  ) {
    this.sessionId = sessionId
    this.offset = offset
    this.data = data
    this.len = len
    this.panel = panel
  }

  async insert() {
    if (this.data === 'clipboard') {
      this.data = await vscode.env.clipboard.readText()
      this.len = this.data.length
    }

    await insert(this.sessionId, this.offset, this.data)
    this.panel.webview.postMessage({
      command: 'updateLastChange',
      actionPerformed: 'insert',
      data: `insert,${this.offset},${this.data},${this.len}`,
    })
  }

  async del() {
    await del(this.sessionId, this.offset, this.data, this.len)
    this.panel.webview.postMessage({
      command: 'updateLastChange',
      actionPerformed: 'del',
      data: `del,${this.offset},${this.data.substring(
        this.offset,
        this.offset + this.len
      )},${this.len}`,
    })
  }

  async overwrite() {
    var [deleteValue, addValue] = this.data.split(',')
    await del(this.sessionId, this.offset, deleteValue, this.len)
    await insert(this.sessionId, this.offset, addValue)
    this.panel.webview.postMessage({
      command: 'updateLastChange',
      actionPerformed: 'overwrite',
      data: `overwrite,${this.offset},${addValue},1`,
    })
    // await overwrite(
    //   s,
    //   message.offset,
    //   message.deleteValue,
    //   message.len
    // )  <-- Currently not functioning properly
  }

  async undo() {
    // await undo(this.sessionId) <-- not implemented in Scala server
    var returnVal = await undoRedo(this.sessionId, this.data)
    this.panel.webview.postMessage({
      command: 'updateLastChange',
      actionPerformed: 'undo',
      data: returnVal,
    })
  }

  async redo() {
    // await redo(this.sessionId) <-- not implemented in Scala server
    var returnVal = await undoRedo(this.sessionId, this.data)
    this.panel.webview.postMessage({
      command: 'updateLastChange',
      actionPerformed: 'redo',
      data: returnVal,
    })
  }

  async save(sessionFile: string, overwrite: boolean, newFile: boolean) {
    let filePath = await getFilePath(sessionFile, overwrite, newFile)

    if (filePath) {
      let rootPath = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : ''

      if (rootPath !== '' && !filePath.includes(rootPath)) {
        filePath = `${rootPath}/${filePath}`
      }

      await saveSession(this.sessionId, filePath, overwrite)
      vscode.window.showInformationMessage(`Session saved to ${filePath}`)
      vscode.window.showInformationMessage('Session cleared')
    }
  }

  async execute(
    action: string,
    sessionFile: string,
    overwrite: boolean,
    newFile: boolean
  ) {
    switch (action) {
      case 'overwriteByte':
        await this.overwrite()
        break
      case 'deleteByte':
        await this.del()
        break
      case 'insertByte':
        await this.insert()
        break
      case 'undoChange':
        await this.undo()
        break
      case 'redoChange':
        await this.redo()
        break
      case 'save':
        await this.save(sessionFile, overwrite, newFile)
        break
    }
  }
}
