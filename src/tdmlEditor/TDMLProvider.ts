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
import { getNonce } from './utilities/getNonce'
import { printChannelOutput } from './extension'
import { newTestCaseInput } from './addNewTest'
import { AppConstants } from './utilities/constants'
import { getTestCaseDisplayData } from './utilities/tdmlXmlUtils'

export class TDMLProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new TDMLProvider(context)
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      TDMLProvider.viewType,
      provider
    )
    printChannelOutput('TDML Editor custom editor provider registered.', true)
    return providerRegistration
  }

  public static getDocumentUri(): vscode.Uri | undefined {
    return TDMLProvider.currentUri
  }

  private static readonly viewType = AppConstants.viewTypeId
  private registered = false
  private currentPanel: vscode.WebviewPanel | undefined = undefined
  private static currentUri: vscode.Uri | undefined = undefined

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.currentPanel = webviewPanel
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src/tdmlEditor/media'),
        vscode.Uri.joinPath(
          this.context.extensionUri,
          'dist/views/tdmlEditor/webview'
        ),
      ],
    }
    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview)
    webviewPanel.onDidChangeViewState((e) => {
      this.currentPanel = e.webviewPanel
      // Create a custom context key 'dfdl-debug.tdml-editor-active' to diplay appropriate commands on menu/editor/title bar and command pallet.
      if (e.webviewPanel.active) {
        TDMLProvider.currentUri = document.uri
        vscode.commands.executeCommand(
          'setContext',
          'dfdl-debug.tdml-editor-active',
          TDMLProvider.viewType
        )
      } else if (
        TDMLProvider.currentUri?.toString() === document.uri.toString()
      ) {
        TDMLProvider.currentUri = undefined
        vscode.commands.executeCommand(
          'setContext',
          'dfdl-debug.tdml-editor-active',
          undefined
        )
      }
    })

    if (webviewPanel.active) {
      TDMLProvider.currentUri = document.uri
      vscode.commands.executeCommand(
        'setContext',
        'dfdl-debug.tdml-editor-active',
        TDMLProvider.viewType
      )
    }

    try {
      printChannelOutput(document.uri.toString(), true)
      if (!this.registered) {
        this.registered = true
        let deleteCommand = vscode.commands.registerCommand(
          AppConstants.deleteTestCommand,
          () => {
            this.currentPanel?.webview.postMessage({
              type: 'delete',
            })
          }
        )

        let addCommand = vscode.commands.registerCommand(
          AppConstants.addNewTestCommand,
          () => {
            // get all the inputs we need
            const inputs = newTestCaseInput(this.context)
            // then do something with them
            inputs.then((result) => {
              this.currentPanel?.webview.postMessage({
                type: 'add',
                testCaseName: result.testName,
                testCaseModel: result.testDesc,
                testCaseDescription: result.testModel,
                dataDocuments: result.dfdlInfoset,
                dfdlInfosets: result.dataDocs,
              })
            })
          }
        )

        let openInTextEditorCommand = vscode.commands.registerCommand(
          AppConstants.openInTextEditorCommand,
          () => {
            printChannelOutput('openInTextEditor command called', true)
            vscode.commands.executeCommand(
              'workbench.action.reopenTextEditor',
              document?.uri
            )
          }
        )

        this.context.subscriptions.push(openInTextEditorCommand)
        this.context.subscriptions.push(deleteCommand)
        this.context.subscriptions.push(addCommand)
      }
    } catch (e) {
      console.log(e)
    }

    async function updateWebview() {
      webviewPanel.webview.postMessage({
        type: 'update',
        text: await getTestCaseDisplayData(document.getText()),
      })
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview()
        }
      }
    )

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()

      if (TDMLProvider.currentUri?.toString() === document.uri.toString()) {
        TDMLProvider.currentUri = undefined
        vscode.commands.executeCommand(
          'setContext',
          'dfdl-debug.tdml-editor-active',
          undefined
        )
      }
    })

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.json)
          return
        case 'log':
          printChannelOutput(e.message, true)
          return
        case 'error':
          printChannelOutput(e.message, true)
          vscode.window.showErrorMessage(e.message)
          return
        case 'info':
          printChannelOutput(e.message, true)
          vscode.window.showInformationMessage(e.message)
          return
        case 'add':
          vscode.commands.executeCommand(AppConstants.addNewTestCommand)
          return
      }
    })

    updateWebview()
  }

  private async updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit()

    return vscode.workspace.applyEdit(edit)
  }

  private _getWebviewContent(webview: vscode.Webview) {
    const webviewUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'dist/views/tdmlEditor/webview',
        'webview.js'
      )
    )
    const nonce = getNonce()

    return /*html*/ `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'nonce-${nonce}'; style-src-elem ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};"
                  />
                  <link rel="stylesheet" nonce="${nonce}">
                </head>
                <body>
                  <h2>TDML Test Cases</h2><br>
                  <vscode-data-grid id="TDML-table" aria-label="Basic" generate-header="sticky" aria-label="Sticky Header"></vscode-data-grid>
                  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
                </body>
              </html>
            `
  }
}
