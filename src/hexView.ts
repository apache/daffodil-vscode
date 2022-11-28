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
import * as daf from './daffodil'
import * as fs from 'fs'
import * as hexy from 'hexy'
import XDGAppPaths from 'xdg-app-paths'
import { ConfigEvent, DaffodilData } from './daffodil'
const xdgAppPaths = XDGAppPaths({ name: 'daffodil-dap' })
import { onDebugStartDisplay } from './utils'

export class DebuggerHexView {
  context: vscode.ExtensionContext
  dataFile: string = ''
  hexFile: string = vscode.workspace.workspaceFolders
    ? `${vscode.workspace.workspaceFolders[0].uri.fsPath}/datafile-hex`
    : `${xdgAppPaths.data()}/datafile-hex`
  hexString: string = ''
  bytePos1b: number = -1
  decorator: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({})

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.debug.onDidTerminateDebugSession(
        this.onTerminatedDebugSession,
        this
      )
    )
    context.subscriptions.push(
      vscode.debug.onDidReceiveDebugSessionCustomEvent(
        this.onDebugSessionCustomEvent,
        this
      )
    )
    context.subscriptions.push(
      vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession, this)
    )
    context.subscriptions.push(
      vscode.commands.registerCommand('hexview.display', async () => {
        await this.openHexFile()
      })
    )
    this.context = context

    this.decorator = vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.context.asAbsolutePath('./images/arrow.svg'),
      gutterIconSize: 'contain',
      color: 'black',
      backgroundColor: 'yellow',
    })
  }

  // Method for getting the decorator
  getDecorator(hexLength, dataPositon) {
    this.decorator.dispose() // needed to reset decorator

    if (hexLength !== dataPositon) {
      this.decorator = vscode.window.createTextEditorDecorationType({
        gutterIconPath: this.context.asAbsolutePath('./images/arrow.svg'),
        gutterIconSize: 'contain',
        color: 'black',
        backgroundColor: 'yellow',
      })
    }
    return this.decorator
  }

  // Method for deleting files
  deleteFile(fileName) {
    if (fs.existsSync(fileName)) {
      if (fileName === this.hexFile) {
        this.closeHexFile()
      }

      fs.unlink(fileName, function (err) {
        if (err) {
          vscode.window.showInformationMessage(
            `error code: ${err.code} - ${err.message}`
          )
        }
      })
    }
  }

  // Overriden onTerminatedDebugSession method
  onTerminatedDebugSession(session: vscode.DebugSession) {
    if (session.type === 'dfdl') {
      this.decorator.dispose()
      this.dataFile = ''
      this.bytePos1b = -1
    }
  }

  // Overriden onDebugSessionCustomEvent method
  onDebugSessionCustomEvent(e: vscode.DebugSessionCustomEvent) {
    if (e.session.type === 'dfdl') {
      switch (e.event) {
        case daf.configEvent:
          this.setDataFile(e.body)
          break
        case daf.dataEvent:
          this.onDisplayHex(e.session, e.body)
          break
      }

      let hexFileOpened = false

      vscode.window.visibleTextEditors.forEach((editor) => {
        if (editor.document.fileName === this.hexFile) {
          hexFileOpened = true
        }
      })

      if (!hexFileOpened) {
        onDebugStartDisplay(['hex-view'])
      }
    }
  }

  // Override onDidStartDebugSession method
  onDidStartDebugSession(session: vscode.DebugSession) {
    // On debug session make sure hex file is deleted and not opened
    if (session.type === 'dfdl') {
      this.closeHexFile()
      this.deleteFile(this.hexFile)
      this.decorator.dispose()
    }
  }

  // Method for extracting the data file used
  setDataFile(cfg: ConfigEvent) {
    this.dataFile = cfg.launchArgs.dataPath
  }

  // Method for getting the selection range
  getSelectionRange(): [vscode.Range, number] {
    let lineNum = Math.floor((this.bytePos1b - 1) / 16)
    let paddingForSpaces =
      this.bytePos1b - 1 > 0 ? (this.bytePos1b - lineNum * 16 - 1) * 2 : 0
    let paddingForLine =
      this.bytePos1b - 16 > 0 ? this.bytePos1b - lineNum * 16 : this.bytePos1b
    let dataPositon = 9 + paddingForLine + paddingForSpaces
    let start = new vscode.Position(lineNum, dataPositon)
    let end = new vscode.Position(lineNum, dataPositon + 2)
    return [new vscode.Range(start, end), lineNum]
  }

  // Method for updating the line selected in the hex file using the current data position
  updateSelectedDataPosition() {
    let hexEditor = vscode.window.activeTextEditor
    let [range, lineNum] = this.getSelectionRange()
    let hexLength = this.hexString.split('\n')[lineNum]
      ? this.hexString.split('\n')[lineNum].length
      : this.bytePos1b

    vscode.window.visibleTextEditors.forEach((editior) => {
      if (editior.document.fileName === this.hexFile) {
        hexEditor = editior
        return
      }
    })

    if (!hexEditor) {
      return
    }
    hexEditor.selection = new vscode.Selection(range.start, range.end)
    hexEditor.setDecorations(this.getDecorator(hexLength, this.bytePos1b), [
      range,
    ])
    hexEditor.revealRange(range)
  }

  // Method to close hexFile if opened in editor
  closeHexFile() {
    vscode.window.visibleTextEditors.forEach((editior) => {
      if (editior.document.fileName === this.hexFile) {
        editior.hide()
      }
    })
  }

  // Method to open the hex file via text editor, selecting the line at the current data position
  openHexFile() {
    let [range, _] = this.getSelectionRange()
    let hexLength = this.hexString.split('\n')[this.bytePos1b - 1]
      ? this.hexString.split('\n')[this.bytePos1b - 1].length
      : this.bytePos1b
    vscode.workspace.openTextDocument(this.hexFile).then((doc) => {
      vscode.window
        .showTextDocument(doc, {
          selection: range,
          viewColumn: vscode.ViewColumn.Two,
          preserveFocus: true,
          preview: false,
        })
        .then((editor) => {
          editor.setDecorations(this.getDecorator(hexLength, this.bytePos1b), [
            range,
          ])
        })
    })
  }

  // Method to see hexFile is opened
  checkIfHexFileOpened() {
    let result = false
    vscode.window.visibleTextEditors.forEach((editior) => {
      if (editior.document.fileName === this.hexFile) {
        result = true
      }
    })
    return result
  }

  // Method to display the hex of the current data position sent from the debugger
  async onDisplayHex(session: vscode.DebugSession, body: DaffodilData) {
    if (!vscode.workspace.workspaceFolders) {
      return
    }

    this.bytePos1b = body.bytePos1b

    let file = fs.readFileSync(this.dataFile)
    let hex = hexy.hexy(file)
    let hexLines = hex.split('\n')

    // Format hex code to make the file look nicer
    hexLines.forEach((h) => {
      if (h) {
        let splitHex = h.split(':')
        let dataLocations = splitHex[1].split(' ')

        this.hexString += splitHex[0] + ': '
        for (var i = 1; i < dataLocations.length - 2; i++) {
          let middle = Math.floor(dataLocations[i].length / 2)
          this.hexString +=
            dataLocations[i].substring(0, middle).toUpperCase() +
            ' ' +
            dataLocations[i].substring(middle).toUpperCase() +
            ' '
        }
        this.hexString += '\t' + dataLocations[dataLocations.length - 1] + '\n'
      }
    })

    // Create file that holds path to data file used
    if (!fs.existsSync(this.hexFile)) {
      fs.writeFile(this.hexFile, this.hexString, function (err) {
        if (err) {
          vscode.window.showInformationMessage(
            `error code: ${err.code} - ${err.message}`
          )
        }
      })
    }

    // Only update position if hex file is opened
    if (this.checkIfHexFileOpened()) {
      this.updateSelectedDataPosition()
    }

    let hexLength = this.hexString.split('\n')[this.bytePos1b - 1]
      ? this.hexString.split('\n')[this.bytePos1b - 1].length
      : 0
    if (hexLength === 0) {
      this.closeHexFile()
    }
  }
}
