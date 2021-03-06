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
import { checkBraceOpen } from './utils'
import { elementCompletion } from './intellisense/elementItems'

export function getElementCompletionProvider(dfdlFormatString: string) {
  return vscode.languages.registerCompletionItemProvider('dfdl', {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      if (checkBraceOpen(document, position)) {
        console.log('in elementCompletionProvider - brace is showing open')
        return undefined
      }
      var definedVariables = getDefinedVariables(document)

      // a completion item that inserts its text as snippet,
      // the `insertText`-property is a `SnippetString` which will be
      // honored by the editor.
      let compItems: vscode.CompletionItem[] = []

      elementCompletion(definedVariables, dfdlFormatString).items.forEach(
        (e) => {
          const completionItem = new vscode.CompletionItem(e.item)
          completionItem.insertText = new vscode.SnippetString(e.snippetString)

          if (e.markdownString) {
            completionItem.documentation = new vscode.MarkdownString(
              e.markdownString
            )
          }
          compItems.push(completionItem)
        }
      )

      return compItems
    },
  })
}

function getDefinedVariables(document: vscode.TextDocument) {
  var additionalTypes = ''
  var lineNum = 0
  var itemCnt = 0
  const lineCount = document.lineCount
  while (lineNum !== lineCount) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
    if (wholeLine.includes('dfdl:defineVariable name=')) {
      var startPos = wholeLine.indexOf('"', 0)
      var endPos = wholeLine.indexOf('"', startPos + 1)
      var newType = wholeLine.substring(startPos + 1, endPos)
      if (itemCnt === 0) {
        additionalTypes = newType
        ++itemCnt
      } else {
        additionalTypes = String(additionalTypes + ',' + newType)
        ++itemCnt
      }
    }
    ++lineNum
  }
  return additionalTypes
}
