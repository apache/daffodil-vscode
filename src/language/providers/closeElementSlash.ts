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
  checkMissingCloseTag,
  checkBraceOpen,
  getXsdNsPrefix,
  getItemsOnLineCount,
} from './utils'

export function getCloseElementSlashProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        let backpos = position.with(position.line, position.character - 1)
        const nsPrefix = getXsdNsPrefix(document, position)
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)
        let nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )
        const itemsOnLine = getItemsOnLineCount(triggerText)
        if (checkBraceOpen(document, position)) {
          return undefined
        }
        if (triggerText.endsWith('/')) {
          let range = new vscode.Range(backpos, position)
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
          if (itemsOnLine == 1 || itemsOnLine == 0) {
            if (
              nearestTagNotClosed.includes('element') ||
              nearestTagNotClosed.includes('group') ||
              nearestTagNotClosed.includes('sequence')
            ) {
              if (itemsOnLine == 1) {
                insertSnippet(' />$0', backpos)
              }
              if (itemsOnLine == 0) {
                const backpos3 = position.with(
                  position.line,
                  position.character - 3
                )
                insertSnippet(
                  '</' + nsPrefix + nearestTagNotClosed + '>$0',
                  backpos3
                )
              }
            }
            if (
              nearestTagNotClosed.includes('defineVariable') ||
              nearestTagNotClosed.includes('setVariable')
            ) {
              let startPos = document.lineAt(position).text.indexOf('<', 0)
              let range = new vscode.Range(backpos, position)
              vscode.window.activeTextEditor?.edit((editBuilder) => {
                editBuilder.replace(range, '')
              })
              insertSnippet('/>\n', backpos)
              let backpos2 = position.with(position.line + 1, startPos - 2)
              insertSnippet('</' + nsPrefix + 'appinfo>\n', backpos2)
              let backpos3 = position.with(position.line + 2, startPos - 4)
              insertSnippet('</' + nsPrefix + 'annotation>$0', backpos3)
            }
          }
          if (itemsOnLine > 1) {
            const tagPos = triggerText.lastIndexOf(
              '<' + nsPrefix + nearestTagNotClosed
            )
            const nextTagPos = triggerText.indexOf('<', tagPos + 1)
            if (
              triggerText.substr(tagPos, nextTagPos).includes('>') ||
              triggerText.includes('</' + nsPrefix + nearestTagNotClosed)
            ) {
              insertSnippet(
                '</' + nsPrefix + nearestTagNotClosed + '>$0',
                backpos
              )
            } else {
              insertSnippet(' />$0', backpos)
            }
          }
        }
        return undefined
      },
    },
    '/' // triggered whenever a '/' is typed
  )
}
