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
