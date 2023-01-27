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
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { logicalDisplay, DisplayState, checkMimeType } from './utils'
import { EditorMessage, MessageCommand } from './messageHandler'

/** Data editor message data structure for communication between Webview and VSCode. */

export class WebView implements vscode.Disposable {
  public panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private fileToEdit: string = ''
  private fileData: Buffer = Buffer.alloc(0)
  // private fileDataStrComparable: string = ''
  private displayState = new DisplayState()

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
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  setTitle(title: string): void {
    this.panel.title = title
  }

  private createPanel(title: string): vscode.WebviewPanel {
    vscode.window
      .showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select',
        canSelectFiles: true,
        canSelectFolders: false,
      })
      .then((fileUri) => {
        if (fileUri && fileUri[0]) {
          this.fileToEdit = fileUri[0].fsPath
        }
        let data = fs.readFileSync(this.fileToEdit)
        let mimeData: number[] = Array.from(data.subarray(0, 4))

        this.fileData = Buffer.from(data)
        // this.fileDataStrComparable = this.fileData.toString('hex')
        let msgData = new Uint8Array(data)

        this.panel.webview.postMessage({
          command: MessageCommand.loadFile,
          metrics: {
            filename: this.fileToEdit,
            type: checkMimeType(mimeData, this.fileToEdit),
          },
          editor: { fileData: msgData },
          display: {
            logical: logicalDisplay(
              this.fileData,
              this.displayState.logicalDisplay
            ),
          },
        })
      })

    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private messageReceiver(message: EditorMessage) {
    console.log('received msg:', message.command)
    switch (message.command) {
      case MessageCommand.addressOnChange:
        this.displayState.updateLogicalDisplayState(message.data.state)

        this.panel.webview.postMessage({
          command: MessageCommand.addressOnChange,
          display: {
            logical: logicalDisplay(
              this.fileData,
              this.displayState.logicalDisplay
            ),
          },
        })
        break

      case MessageCommand.editorOnChange:
        this.displayState.updateEditorDisplayState(message.data.editor)

        const bufSlice = this.fileData.subarray(
          this.displayState.editorDisplay.start,
          this.displayState.editorDisplay.end + 1
        )
        this.panel.webview.postMessage({
          command: MessageCommand.editorOnChange,
          data: Uint8Array.from(bufSlice),
          display: Buffer.from(bufSlice).toString(
            this.displayState.editorDisplay.encoding
          ),
        })
        break

      case MessageCommand.commit:
        vscode.window
          .showInformationMessage(`Request OmegaEdit change { offset: ${message.data.fileOffset},
          dataLength: ${message.data.dataLength},
          convertFromEncoding: ${message.data.encoding},
          data: [ ${message.data.data} ] }`)
        break

      case MessageCommand.requestEditedData:
        // let selectionToFileOffset = message.data.editor.selectionToFileOffset
        let selectionEncoding = message.data.encoding
        let selectionEdits = message.data.editor.editedContent
        // let editType = message.data.editType

        let selectionByteLength: number
        // let selectionByteData: Uint8Array
        let selectionByteData: Buffer

        // let returnData: Uint8Array

        if (selectionEncoding === 'hex') {
          selectionByteLength = selectionEdits.length / 2
          // selectionByteData = new Uint8Array(selectionByteLength)
          selectionByteData = Buffer.alloc(selectionByteLength)
          for (let i = 0; i < selectionEdits.length; i += 2) {
            selectionByteData[i / 2] = parseInt(selectionEdits.substr(i, 2), 16)
          }
        } else if (selectionEncoding === 'ascii') {
          selectionByteLength = selectionEdits.length
          // selectionByteData = new Uint8Array(selectionByteLength)
          selectionByteData = Buffer.alloc(selectionByteLength)
          for (let i = 0; i < selectionEdits.length; i++) {
            selectionByteData[i] = selectionEdits.charCodeAt(i)
          }
        } else {
          selectionByteData = Buffer.alloc(0)
        }

        this.panel.webview.postMessage({
          command: MessageCommand.requestEditedData,
          data: Uint8Array.from(selectionByteData),
          display: selectionByteData.toString(selectionEncoding),
        })
        // // allocate new complete array
        // editType === 'insert'
        //   ? (returnData = new Uint8Array(this.fileData.byteLength + 1))
        //   : (returnData = new Uint8Array(this.fileData.byteLength - 1))

        // // console.log(selectionToFileOffset)
        // for (let i = 0; i <= selectionToFileOffset; i++) {
        //   returnData[i] = this.fileData[i]
        // }

        // // console.log(selectionByteLength)
        // for (let i = 0; i < selectionByteLength; i++) {
        //   returnData[selectionToFileOffset + i] = selectionByteData[i]
        // }
        // // console.log(selectionToFileOffset + 1, returnData.byteLength)

        // for( let i = selectionToFileOffset + selectionByteLength - 1; i < returnData.byteLength; i++ ) {
        //   returnData[i + 1] = this.fileData[i]
        // }

        // this.fileData = Buffer.from(returnData)
        // this.displayState.editorDisplay.end++
        // const selectionDisplay: string = this.fileData
        //   .subarray(
        //     this.displayState.editorDisplay.start,
        //     this.displayState.editorDisplay.end
        //   )
        //   .toString(this.displayState.editorDisplay.encoding)
        // this.panel.webview.postMessage({
        //   command: MessageCommand.requestEditedData,
        //   data: new Uint8Array(returnData),
        //   display: selectionDisplay,
        // })
        break
    }
  }
}
