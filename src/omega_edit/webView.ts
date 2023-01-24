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
        let msgData = new Uint8Array(
          data
            .toString(this.displayState.editorDisplay.encoding)
            .split('')
            .map((e) => e.charCodeAt(0))
        )

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
    switch (message.command) {
      case MessageCommand.addressOnChange:
        console.log(message)
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

        const bufSlice: string = this.fileData
          .subarray(
            this.displayState.editorDisplay.start,
            this.displayState.editorDisplay.end
          )
          .toString(message.data.editor.encoding)

        // console.log(message, bufSlice)

        this.panel.webview.postMessage({
          command: MessageCommand.editorOnChange,
          display: { editor: bufSlice },
        })
        break

      case MessageCommand.commit:
        vscode.window
          .showInformationMessage(`Request OmegaEdit change { offset: ${message.data.fileOffset},
          dataLength: ${message.data.dataLength},
          convertFromEncoding: ${message.data.encoding},
          data: [ ${message.data.data} ] }`)
        break
    }
  }
}
