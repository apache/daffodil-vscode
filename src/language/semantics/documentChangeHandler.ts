/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { XPathDocumentChangeHandler } from './xPathDocumentChangeHandler'
import { GlobalInstructionData } from './xslLexer'

export interface TagRenameEdit {
  range: vscode.Range
  text: string
  fullTagName: string
}
export class DocumentChangeHandler {
  public static lastActiveXMLEditor: vscode.TextEditor | null = null
  public static lastActiveXMLNonXSLEditor: vscode.TextEditor | null = null

  public static lastXMLDocumentGlobalData: GlobalInstructionData[] = []
  public static isWindowsOS: boolean | undefined

  private onDidChangeRegistration: vscode.Disposable | null = null
  private xmlDocumentRegistered = false
  private xpathDocumentChangeHanlder: XPathDocumentChangeHandler | null = null

  public registerXMLEditor = (editor: vscode.TextEditor | undefined) => {
    if (editor) {
      this.registerXMLDocument(editor)
    } else {
    }
  }

  private getXPathDocumentChangeHandler() {
    if (this.xpathDocumentChangeHanlder === null) {
      this.xpathDocumentChangeHanlder = new XPathDocumentChangeHandler()
    }
    return this.xpathDocumentChangeHanlder
  }

  private registerXMLDocument = (editor: vscode.TextEditor) => {
    const document = editor.document
    let isXPathDocument = document.languageId === 'dfdl'

    if (
      this.xmlDocumentRegistered &&
      !isXPathDocument &&
      this.onDidChangeRegistration
    ) {
      this.onDidChangeRegistration.dispose()
      this.xmlDocumentRegistered = false
    }
    if (isXPathDocument && !this.xmlDocumentRegistered) {
      this.xmlDocumentRegistered = true
      this.onDidChangeRegistration = vscode.workspace.onDidChangeTextDocument(
        (e) => this.getXPathDocumentChangeHandler().onDocumentChange(e)
      )
    }
  }
}
