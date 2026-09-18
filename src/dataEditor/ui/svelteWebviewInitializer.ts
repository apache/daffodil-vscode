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
import { MessageResponseMap, PostMessageArgs } from 'ext_types'
import { DisplayState } from './displayState'
import { VSMessagePackage } from '../../ext_types'
import { isDFDLDebugSessionActive } from 'dataEditor/include/utils'
import path from 'path'

export interface DataEditorUI extends vscode.Disposable {
  readonly displayState: DisplayState
  dispose(): void
  isReady(): Promise<boolean>
  setTitle(title: string): void
  getMsgId(): string
  postMessage<K extends keyof MessageResponseMap>(
    ...payload: PostMessageArgs<MessageResponseMap, K>
  ): Thenable<boolean>
  reveal: vscode.WebviewPanel['reveal']
  onDidReceiveMessage(listener: (e: any) => void, thisArg?: any): void
  onDidDispose(listener: (e: any) => void): void
}

class SvelteUIWebviewPanel implements DataEditorUI {
  static readonly uiViewId: string = 'dataEditor'
  readonly displayState: DisplayState = new DisplayState()
  private _isReady: Promise<boolean>
  isReady() {
    return this._isReady
  }
  private readyResolve!: (v: boolean) => void

  constructor(
    private vscodePanel: vscode.WebviewPanel,
    private messengerId: string = ''
  ) {
    this._isReady = new Promise<boolean>((resolve) => {
      this.readyResolve = resolve
    })
    this.vscodePanel.webview.onDidReceiveMessage((msg: VSMessagePackage) => {
      if (msg.payload[0] === 'webviewReady') this.readyResolve(true)
    })
  }
  dispose() {
    this.vscodePanel.dispose()
  }
  getMsgId() {
    return this.messengerId
  }
  setMsgId(id: string) {
    if (this.messengerId !== '')
      throw new Error('Cannot reassign messenger id after initialization.')

    this.messengerId = id
  }
  setTitle(title: string) {
    this.vscodePanel.title = title
  }

  postMessage<K extends keyof MessageResponseMap>(
    ...msg: PostMessageArgs<MessageResponseMap, K>
  ) {
    const [type, payload] = msg as [K, MessageResponseMap[K]]
    return this.vscodePanel.webview.postMessage({
      command: type,
      id: this.messengerId,
      data: payload,
    })
  }

  public onDidReceiveMessage = this.vscodePanel.webview.onDidReceiveMessage

  public readonly reveal = () => {
    this.vscodePanel.reveal()
  }

  public onDidDispose(listener: (e: any) => void) {
    this.vscodePanel.onDidDispose(listener)
  }
}

interface SvelteInitializerState {
  isContextValid: boolean
  getExtensionCtx(): vscode.ExtensionContext
  getSvelteWebviewInitializer(): SvelteWebviewInitializer
}
const InvalidInitializerState: SvelteInitializerState = {
  isContextValid: false,
  getSvelteWebviewInitializer: () => {
    throw 'SvelteWebviewInitializer is in an invalid state'
  },
  getExtensionCtx: function (): vscode.ExtensionContext {
    throw 'SvelteWebviewInitializer is in an invalid state'
  },
}

const ValidInitializerState: SvelteInitializerState = {
  isContextValid: true,
  getSvelteWebviewInitializer: () => {
    return SvelteWebviewMgr
  },
  getExtensionCtx: () => {
    return ExtensionContextRef
  },
}

const UI_MSG_ID_MAX_LEN = 32

export type WebviewAttributes = {
  column: vscode.ViewColumn
  msgId: string
  title: string
}

class SvelteWebviewInitializer {
  static state: SvelteInitializerState = InvalidInitializerState
  constructor() {}
  getAttributes(targetFilePath: string): WebviewAttributes {
    const title = path.basename(targetFilePath)

    return {
      column: isDFDLDebugSessionActive(targetFilePath)
        ? vscode.ViewColumn.Two
        : vscode.ViewColumn.Active,
      msgId: this.formatMsgId(title),
      title,
    }
  }
  private formatMsgId(id: string, isDFDLDebugAttached: boolean = false) {
    let idStr = id.substring(0, UI_MSG_ID_MAX_LEN)
    idStr = idStr.replaceAll(' ', '_')
    return isDFDLDebugAttached ? 'dfdl-' + idStr : idStr
  }
  createSveltePanel(attr: WebviewAttributes): SvelteUIWebviewPanel {
    const opts = this.getWebviewOptions()
    const ret = vscode.window.createWebviewPanel(
      SvelteUIWebviewPanel.uiViewId,
      attr.title,
      attr.column,
      {
        ...opts,
      }
    )
    this.setHtmlContent(ret, attr.msgId)

    return new SvelteUIWebviewPanel(ret, attr.msgId)
  }

  // get the HTML content for the webview
  private setHtmlContent(vsPanel: vscode.WebviewPanel, msgId: string) {
    let vsWebview = vsPanel.webview
    const nonce = this.getNonce()

    const scriptUri = this.getResourceUri('js', ExtensionContextRef, (uri) => {
      return vsWebview.asWebviewUri(uri)
    })
    const stylesUri = this.getResourceUri('css', ExtensionContextRef, (uri) => {
      return vsWebview.asWebviewUri(uri)
    })

    let indexHTML = this.injectNonce(
      this.getIndexHTML(ExtensionContextRef),
      vsWebview,
      nonce,
      scriptUri
    )!
    indexHTML = indexHTML
      .replace(/src="\.\/index.js"/, `src="${scriptUri.toString()}"`)
      .replace(/href="\.\/style.css"/, `href="${stylesUri.toString()}"`)
      .replaceAll(/nonce="__nonce__"/g, `nonce="${nonce}"`)
      .replace('__extension_msg_id__', this.escapeHtmlAttribute(msgId))

    vsWebview.html = indexHTML
  }
  private escapeHtmlAttribute(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }
  private injectNonce(
    html: string,
    webView: vscode.Webview,
    nonce: string,
    scriptsUri: vscode.Uri
  ) {
    let ret = html.replaceAll(
      '<head>',
      `<head><meta http-equiv="Content-Security-Policy" content="default-src ${webView.cspSource}; font-src ${webView.cspSource}; style-src 'self' 'unsafe-inline' ${webView.cspSource}; img-src ${webView.cspSource}; script-src 'nonce-${nonce}' ${webView.cspSource};">`
    )
    return ret
  }
  private getIndexHTML(context: vscode.ExtensionContext) {
    const indexFile = vscode.Uri.joinPath(
      context.extensionUri,
      'dist',
      'views',
      'dataEditor',
      'index.html'
    )
    const indexContent = fs.readFileSync(indexFile.fsPath).toString()
    return indexContent
  }
  // get a nonce for use in a content security policy
  private getNonce(): string {
    let text = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }
  private getWebviewOptions() {
    const opts: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        this.getSvelteAppDistributionFolderUri(ExtensionContextRef),
        this.getSvelteAppDistributionViewFolderUri(
          ExtensionContextRef,
          SvelteUIWebviewPanel.uiViewId
        ),
      ],
    }
    return opts
  }

  // get the svelte app distribution folder uri
  private getSvelteAppDistributionFolderUri(
    context: vscode.ExtensionContext
  ): vscode.Uri {
    return vscode.Uri.joinPath(context.extensionUri, 'dist')
  }

  // get the svelte app distribution view folder uri
  private getSvelteAppDistributionViewFolderUri(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.Uri {
    return vscode.Uri.joinPath(context.extensionUri, 'dist', 'views', view)
  }

  private getResourceUri(
    item: 'index' | 'css' | 'js',
    context: vscode.ExtensionContext,
    uriDecorator?: (uriPath: vscode.Uri) => any
  ): vscode.Uri

  private getResourceUri<R>(
    item: 'index' | 'css' | 'js',
    context: vscode.ExtensionContext,
    uriDecorator: (uriPath: vscode.Uri) => R
  ): R
  private getResourceUri<R>(
    item: 'index' | 'css' | 'js',
    context: vscode.ExtensionContext,
    uriDecorator?: (uriPath: vscode.Uri) => R
  ): vscode.Uri | R {
    let resourceFile = ''
    switch (item) {
      case 'index':
        resourceFile = item + '.html'
        break
      case 'css':
        resourceFile = 'style.css'
        break
      case 'js':
        resourceFile = 'index.js'
        break
    }
    let ret = vscode.Uri.joinPath(
      context.extensionUri,
      'dist',
      'views',
      'dataEditor',
      resourceFile
    )
    return uriDecorator ? uriDecorator(ret) : ret
  }
}

const SvelteWebviewMgr: SvelteWebviewInitializer =
  new SvelteWebviewInitializer()
let ExtensionContextRef: vscode.ExtensionContext

export function getSvelteWebviewInitializer() {
  return SvelteWebviewInitializer.state['getSvelteWebviewInitializer']()
}

export function startSvelteWebviewInitializer(ctx: vscode.ExtensionContext) {
  if (SvelteWebviewInitializer.state === ValidInitializerState) {
    return
  }
  ExtensionContextRef = ctx
  SvelteWebviewInitializer.state = ValidInitializerState
}
