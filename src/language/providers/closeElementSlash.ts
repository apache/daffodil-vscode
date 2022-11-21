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
import {
  insertSnippet,
  nearestOpen,
  checkBraceOpen,
  getXsdNsPrefix,
} from './utils'

export function getCloseElementSlashProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        var backpos = position.with(position.line, position.character - 1)
        const nsPrefix = getXsdNsPrefix(document, position)
        const wholeLine = document
          .lineAt(position)
          .text.substring(0, position.character)
        const nearestOpenItem = nearestOpen(document, position)
        if (checkBraceOpen(document, position)) {
          return undefined
        }
        if (
          wholeLine.endsWith('/') &&
          (wholeLine.includes('<' + nsPrefix + 'element') ||
            nearestOpenItem.includes('element') ||
            wholeLine.includes('<' + nsPrefix + 'group') ||
            nearestOpenItem.includes('group') ||
            wholeLine.includes('<' + nsPrefix + 'sequence') ||
            nearestOpenItem.includes('sequence'))
        ) {
          var range = new vscode.Range(backpos, position)
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
          insertSnippet(' />$0', backpos)
        }
        if (
          wholeLine.endsWith('/') &&
          (wholeLine.includes('dfdl:defineVariable') ||
            wholeLine.includes('dfdl:setVariable') ||
            nearestOpenItem.includes('defineVariable') ||
            nearestOpenItem.includes('setVariable'))
        ) {
          var startPos = document.lineAt(position).text.indexOf('<', 0)
          var range = new vscode.Range(backpos, position)
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
          insertSnippet('/>\n', backpos)
          var backpos2 = position.with(position.line + 1, startPos - 2)
          insertSnippet('</<' + nsPrefix + 'appinfo>\n', backpos2)
          var backpos3 = position.with(position.line + 2, startPos - 4)
          insertSnippet('</<' + nsPrefix + 'annotation>$0', backpos3)
        }
        return undefined
      },
    },
    '/' // triggered whenever a '/' is typed
  )
}
