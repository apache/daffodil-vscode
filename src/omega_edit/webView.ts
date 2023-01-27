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
// import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import {
  logicalDisplay,
  DisplayState,
  // checkMimeType,
  fillRequestData,
  getEncodedDataStr,
  viewportSubscribe,
} from './utils'
import { EditorMessage, MessageCommand } from './messageHandler'
import { v4 as uuidv4 } from 'uuid'
import * as omegaEditSession from 'omega-edit/session'
import * as omegaEditViewport from 'omega-edit/viewport'
import { OmegaEdit } from './omega_edit'

type Viewports = { label: string; vpid: string }[]

export class WebView implements vscode.Disposable {
  public panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  // private fileData: Buffer = Buffer.alloc(0)
  private displayState = new DisplayState()
  private omegaViewports: Viewports = []
  private fileToEdit: string = ''
  private omegaSessionId = ''
  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)

    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
  }

  dispose(): void {
    ;async () => {
      this.omegaViewports.forEach(async (vpo) => {
        await omegaEditViewport.destroyViewport(vpo.vpid)
      })
      await omegaEditSession.destroySession(this.omegaSessionId)
    }
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  setTitle(title: string): void {
    this.panel.title = title
  }

  public async initialize() {
    vscode.window
      .showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select',
        canSelectFiles: true,
        canSelectFolders: false,
      })
      .then(async (fileUri) => {
        if (fileUri && fileUri[0]) {
          this.fileToEdit = fileUri[0].fsPath
        }
        this.omegaSessionId = await omegaEditSession.createSession(
          this.fileToEdit,
          uuidv4()
        )

        this.omegaViewports['vpAll'] = await omegaEditViewport.createViewport(
          '',
          this.omegaSessionId,
          0,
          1000,
          false
        )

        await viewportSubscribe(
          this.panel,
          this.omegaViewports['vpAll'],
          this.omegaViewports['vpAll'],
          'vpAll',
          'hexAll'
        )
      })
  }

  public getOmegaSessionId(): string {
    return this.omegaSessionId
  }

  private createPanel(title: string): vscode.WebviewPanel {
    // vscode.window
    //   .showOpenDialog({
    //     canSelectMany: false,
    //     openLabel: 'Select',
    //     canSelectFiles: true,
    //     canSelectFolders: false,
    //   })
    //   .then((fileUri) => {
    //     if (fileUri && fileUri[0]) {
    //       this.fileToEdit = fileUri[0].fsPath
    //     }
    //     let data = fs.readFileSync(this.fileToEdit)
    //     let mimeData: number[] = Array.from(data.subarray(0, 4))

    //     this.fileData = Buffer.from(data)
    //     let msgData = new Uint8Array(data)

    //     this.panel.webview.postMessage({
    //       command: MessageCommand.loadFile,
    //       metrics: {
    //         filename: this.fileToEdit,
    //         type: checkMimeType(mimeData, this.fileToEdit),
    //       },
    //       editor: { fileData: msgData },
    //       display: {
    //         logical: logicalDisplay(
    //           this.fileData,
    //           this.displayState.logicalDisplay
    //         ),
    //       },
    //     })
    //   })

    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private async messageReceiver(message: EditorMessage) {
    switch (message.command) {
      case MessageCommand.updateLogicalDisplay:
        this.displayState.logicalDisplay.bytesPerRow = message.data.bytesPerRow
        const logicalDisplayText = logicalDisplay(
          message.data.viewportData,
          this.displayState.logicalDisplay.bytesPerRow
        )

        this.panel.webview.postMessage({
          command: MessageCommand.updateLogicalDisplay,
          data: {
            logicalDisplay: logicalDisplayText,
          },
        })
        break

      case MessageCommand.editorOnChange:
        this.displayState.editorEncoding = message.data.encoding

        if (message.data.selectionData.length > 0) {
          const bufSlice = Buffer.from(message.data.selectionData)
          this.panel.webview.postMessage({
            command: MessageCommand.editorOnChange,
            display: getEncodedDataStr(
              bufSlice,
              this.displayState.editorEncoding
            ),
          })
        }

        break

      case MessageCommand.commit:
        let fileOffset = message.data.selectionStart
        let data = message.data.selectionData
        let dataLen = message.data.selectionDataLen

        // var fileSize = await omegaEditSession.getComputedFileSize(this.omegaSessionId)
        vscode.window.showInformationMessage(
          `Commit Request Received: [ ${fileOffset} - ${
            fileOffset + dataLen
          } ]: ${data}`
        )
        var omegaEdit = new OmegaEdit(
          this.omegaSessionId,
          fileOffset,
          data,
          dataLen,
          this.panel
        )
        await omegaEdit.replace(this.omegaSessionId, fileOffset, dataLen, data)
        await viewportSubscribe(
          this.panel,
          this.omegaViewports['vpAll'],
          this.omegaViewports['vpAll'],
          'vpAll',
          'hexAll'
        )
        break

      case MessageCommand.requestEditedData:
        let [selectionData, selectionDisplay] = fillRequestData(message)

        this.panel.webview.postMessage({
          command: MessageCommand.requestEditedData,
          data: Uint8Array.from(selectionData),
          display: selectionDisplay,
        })
        break
    }
  }
}
