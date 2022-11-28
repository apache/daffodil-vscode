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
import * as omegaEditChange from 'omega-edit/change'
import { getFilePath } from './utils'
import * as omegaEditSession from 'omega-edit/session'

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

    await omegaEditChange.insert(this.sessionId, this.offset, this.data)
  }

  async del() {
    await omegaEditChange.del(this.sessionId, this.offset, this.len)
  }

  async overwrite() {
    await omegaEditChange.overwrite(this.sessionId, this.offset, this.data)
  }

  async undo() {
    await omegaEditChange.undo(this.sessionId)
  }

  async redo() {
    await omegaEditChange.redo(this.sessionId)
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

      await omegaEditSession.saveSession(this.sessionId, filePath, overwrite)
      vscode.window.showInformationMessage(`Session saved to ${filePath}`)
      vscode.window.showInformationMessage('Session cleared')
    }
  }

  async search(
    fileSize: number,
    searchPattern: string,
    caseInsensitive: boolean,
    limit: number = 0 // unlimited for omega-edit is 0
  ): Promise<Array<number>> {
    return await omegaEditSession.searchSession(
      this.sessionId,
      Buffer.from(searchPattern),
      caseInsensitive,
      0,
      fileSize,
      limit
    )
  }

  async replace(
    sessionId: string,
    offset: number,
    len: number,
    data: string = ''
  ) {
    await omegaEditChange.replace(sessionId, offset, len, data)
  }

  // Perform search on a single result
  async singleSearch(
    fileSize: number,
    searchPattern: string,
    caseInsensitive
  ): Promise<number> {
    var result = await this.search(fileSize, searchPattern, caseInsensitive, 1)
    return result[0]
  }

  async searchAndReplace(
    fileSize: number,
    searchPattern: string,
    replaceText: string,
    caseInsensitive: boolean
  ) {
    var index = await this.singleSearch(
      fileSize,
      searchPattern,
      caseInsensitive
    )

    // Loop only gets one result per loop as trying to replace all
    // instances at one time causes wrong things to be replaced.
    while (index >= 0) {
      await this.replace(
        this.sessionId,
        index,
        searchPattern.length,
        replaceText
      )

      index = await this.singleSearch(fileSize, searchPattern, caseInsensitive)
    }
  }

  async execute(
    action: string,
    sessionFile: string,
    overwrite: boolean,
    newFile: boolean,
    fileSize: number,
    searchPattern: string,
    replaceText: string,
    caseInsensitive: boolean
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
      case 'replace':
        await this.replace(this.sessionId, this.offset, this.len, this.data)
        break
      case 'search':
        var searchResults = await this.search(
          fileSize,
          searchPattern,
          caseInsensitive
        )
        if (searchResults)
          vscode.window.showInformationMessage(searchResults.toString())
        break
      case 'searchAndReplace':
        await this.searchAndReplace(
          fileSize,
          searchPattern,
          replaceText,
          caseInsensitive
        )
        break
    }
  }
}
