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
import { insertSnippet, nearestOpen } from './utils'

export function getCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        var backpos = position.with(position.line, position.character - 1)
        const nearestOpenItem = nearestOpen(document, position)
        const triggerText = document
          .lineAt(position)
          .text.substr(0, position.character)

        if (
          triggerText.endsWith('>') &&
          (triggerText.includes('xs:element') ||
            nearestOpenItem.includes('element') ||
            triggerText.includes('xs:group') ||
            nearestOpenItem.includes('group') ||
            triggerText.includes('xs:sequence') ||
            nearestOpenItem.includes('sequence') ||
            triggerText.includes('xs:simpleType') ||
            nearestOpenItem.includes('simpleType') ||
            triggerText.includes('xs:choice') ||
            nearestOpenItem.includes('choice') ||
            triggerText.includes('dfdl:defineVariable') ||
            nearestOpenItem.includes('Variable'))
        ) {
          var range = new vscode.Range(backpos, position)
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
          if (
            triggerText.endsWith('>') &&
            (triggerText.includes('xs:element ref') ||
              triggerText.includes('xs:group ref'))
          ) {
            insertSnippet(' />\n$0', backpos)
          } else if (
            triggerText.endsWith('>') &&
            (triggerText.includes('xs:element') ||
              nearestOpenItem.includes('element'))
          ) {
            insertSnippet('>\n\t$0\n</xs:element>', backpos)
          } else if (
            triggerText.endsWith('>') &&
            (triggerText.includes('xs:group') ||
              nearestOpenItem.includes('group'))
          ) {
            insertSnippet('>\n\t$0\n</xs:group>', backpos)
          } else if (
            (triggerText.endsWith('>') &&
              triggerText.includes('xs:sequence')) ||
            nearestOpenItem.includes('sequence')
          ) {
            insertSnippet('>\n\t$0\n</xs:sequence>', backpos)
          } else if (
            (triggerText.endsWith('>') && triggerText.includes('xs:choice')) ||
            nearestOpenItem.includes('choice')
          ) {
            insertSnippet('>\n\t$0\n</xs:choice>', backpos)
          } else if (
            (triggerText.endsWith('>') &&
              triggerText.includes('xs:simpleType')) ||
            nearestOpenItem.includes('simpleType')
          ) {
            insertSnippet('>\n\t$0\n</xs:simpleType>', backpos)
          } else if (
            (triggerText.endsWith('>') &&
              triggerText.includes('dfdl:defineVariable')) ||
            nearestOpenItem.includes('defineVariable')
          ) {
            var startPos = document.lineAt(position).text.indexOf('<', 0)
            var range = new vscode.Range(backpos, position)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            insertSnippet('>\n</dfdl:defineVariable>\n', backpos)
            var backpos2 = position.with(position.line + 2, startPos - 2)
            insertSnippet('</xs:appinfo>\n', backpos2)
            var backpos3 = position.with(position.line + 3, startPos - 4)
            insertSnippet('</xs:annotation>$0', backpos3)
          } else if (
            (triggerText.endsWith('>') &&
              triggerText.includes('dfdl:setVariable')) ||
            nearestOpenItem.includes('setVariable')
          ) {
            var startPos = document.lineAt(position).text.indexOf('<', 0)
            var range = new vscode.Range(backpos, position)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            insertSnippet('>\n</dfdl:setVariable>\n', backpos)
            var backpos2 = position.with(position.line + 2, startPos - 2)
            insertSnippet('</xs:appinfo>\n', backpos2)
            var backpos3 = position.with(position.line + 3, startPos - 4)
            insertSnippet('</xs:annotation>$0', backpos3)
          }
        }
        return undefined
      },
    },
    '>' // triggered whenever a '>' is typed
  )
}
