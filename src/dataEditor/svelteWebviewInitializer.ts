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
export class SvelteWebviewInitializer {
  constructor(private context: vscode.ExtensionContext) {}

  initialize(view: string, webView: vscode.Webview): void {
    webView.options = this.getWebViewOptions(this.context, view)
    webView.html = this.getHtmlContent(this.context, view, webView)
  }

  // get the HTML content for the webview
  private getHtmlContent(
    context: vscode.ExtensionContext,
    view: string,
    webView: vscode.Webview
  ): string {
    const nonce = this.getNonce()

    const scriptUri = this.getResourceUri('js', context, (uri) => {
      return webView.asWebviewUri(uri)
    })
    const stylesUri = this.getResourceUri('css', context, (uri) => {
      return webView.asWebviewUri(uri)
    })
    const indexPath = this.getResourceUri('index', context)
    let indexHTML = this.injectNonce(
      this.getIndexHTML(context),
      webView,
      nonce,
      scriptUri
    )!
    indexHTML = fs
      .readFileSync(indexPath!.fsPath, 'utf-8')
      .replace(/src="\.\/index.js"/, `src="${scriptUri.toString()}"`)
      .replace(/href="\.\/style.css"/, `href="${stylesUri.toString()}"`)
      .replaceAll(/nonce="__nonce__"/g, `nonce="${nonce}""`)
    return indexHTML
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

  // get the webview options
  private getWebViewOptions(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.WebviewPanelOptions & vscode.WebviewOptions {
    return {
      enableScripts: true,
      localResourceRoots: [
        this.getSvelteAppDistributionFolderUri(context),
        this.getSvelteAppDistributionViewFolderUri(context, view),
      ],
    }
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
