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

export class SvelteWebviewInitializer {
  constructor(private context: vscode.ExtensionContext) {}

  initialize(view: string, webView: vscode.Webview): void {
    webView.options = this.getWebViewOptions(this.context, view)
    webView.html = this.getHtmlContent(this.context, view, webView)
  }

  private getHtmlContent(
    context: vscode.ExtensionContext,
    view: string,
    webView: vscode.Webview
  ): string {
    const nonce = this.getNonce()
    const scriptUri = webView.asWebviewUri(
      this.getSvelteAppDistributionIndexJsUri(context, view)
    )
    const stylesUri = webView.asWebviewUri(this.getStylesUri(context))
    const codiconsUri = webView.asWebviewUri(this.getCodeIconsUri(context))
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset='UTF-8'>
        <!--
          Use a content security policy to only allow loading images from the extension directory,
          and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webView.cspSource}; img-src ${webView.cspSource}; script-src 'nonce-${nonce}';">
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <link href="${stylesUri}" rel="stylesheet" type="text/css" />
        <link href="${codiconsUri}" rel="stylesheet" type="text/css" />
    </head>
    <body>
    </body>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</html>
`
  }

  private getNonce(): string {
    let text = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

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

  private getSvelteAppDistributionFolderUri(
    context: vscode.ExtensionContext
  ): vscode.Uri {
    return vscode.Uri.joinPath(context.extensionUri, 'svelte', 'dist')
  }

  private getSvelteAppDistributionViewFolderUri(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'views',
      view
    )
  }

  private getSvelteAppDistributionIndexJsUri(
    context: vscode.ExtensionContext,
    view: string
  ): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'views',
      view,
      'index.js'
    )
  }

  private getStylesUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'dist',
      'styles.css'
    )
  }

  private getCodeIconsUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(
      context.extensionUri,
      'svelte',
      'node_modules',
      '@vscode/codicons',
      'dist',
      'codicon.css'
    )
  }
}
