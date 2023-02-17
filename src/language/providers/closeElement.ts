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
  getXsdNsPrefix,
  insertSnippet,
  getItemsOnLineCount,
  checkMissingCloseTag,
} from './utils'

export function getCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        let backpos = position.with(position.line, position.character - 1)
        let backpos3 = position.with(position.line, position.character - 3)
        const nsPrefix = getXsdNsPrefix(document, position)
        //TODO close tag is blowing up in this function
        const nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)
        let itemsOnLine = getItemsOnLineCount(triggerText)

        if (nearestTagNotClosed.includes('none')) {
          return undefined
        }

        if (triggerText.endsWith('>')) {
          if (
            nearestTagNotClosed.includes('element') ||
            nearestTagNotClosed.includes('group') ||
            nearestTagNotClosed.includes('sequence') ||
            nearestTagNotClosed.includes('simpleType') ||
            nearestTagNotClosed.includes('choice') ||
            nearestTagNotClosed.includes('Variable') ||
            itemsOnLine == 0
          ) {
            let range = new vscode.Range(backpos, position)
            //This works also, instead of the replace() just below it ...
            /*let selection = new vscode.Selection(backpos, backpos)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.delete(range)
              editBuilder.insert(backpos, '')
            }).then(function() {
              if(vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.selection = selection
              }
            })*/
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            if (itemsOnLine == 1 || itemsOnLine === 0) {
              if (!triggerText.includes('</')) {
                if (itemsOnLine == 0) {
                  insertSnippet(
                    '</' + nsPrefix + nearestTagNotClosed + '>$0',
                    backpos3
                  )
                }
                if (itemsOnLine === 1) {
                  if (
                    nearestTagNotClosed.includes('element ref') ||
                    nearestTagNotClosed.includes('group ref')
                  ) {
                    insertSnippet(' />\n$0', backpos)
                  }
                  if (
                    nearestTagNotClosed.includes('defineVariable') ||
                    nearestTagNotClosed.includes('setVariable')
                  ) {
                    let startPos = document
                      .lineAt(position)
                      .text.indexOf('<', 0)
                    vscode.window.activeTextEditor?.edit((editBuilder) => {
                      editBuilder.replace(range, '')
                    })
                    insertSnippet(
                      '>\n</dfdl:' + nearestTagNotClosed + '>\n',
                      backpos
                    )
                    let backpos2 = position.with(
                      position.line + 2,
                      startPos - 2
                    )
                    insertSnippet('</' + nsPrefix + 'appinfo>\n', backpos2)
                    let backpos3 = position.with(
                      position.line + 3,
                      startPos - 4
                    )
                    insertSnippet('</' + nsPrefix + 'annotation>$0', backpos3)
                  }
                  if (
                    !(
                      nearestTagNotClosed.includes('ref') ||
                      nearestTagNotClosed.includes('Variable')
                    )
                  ) {
                    insertSnippet(
                      '>\n\t$0\n</' + nsPrefix + nearestTagNotClosed + '>',
                      backpos
                    )
                  }
                }
              }
            }
            if (itemsOnLine > 1) {
              if (
                triggerText.includes('<' + nsPrefix + 'element ref') ||
                triggerText.includes('<' + nsPrefix + 'group ref')
              ) {
                insertSnippet(' />\n$0', backpos)
              }
              if (
                !triggerText.includes('ref') &&
                triggerText.endsWith('>') &&
                triggerText.includes('<' + nsPrefix + nearestTagNotClosed)
              ) {
                let tagPos = triggerText.lastIndexOf(
                  '<' + nsPrefix + nearestTagNotClosed
                )
                let tagEndPos = triggerText.indexOf('>', tagPos)
                if (
                  tagPos != -1 &&
                  !triggerText.substring(tagEndPos - 1, 2).includes('/>') &&
                  !triggerText
                    .substring(tagEndPos)
                    .includes('</' + nsPrefix + nearestTagNotClosed)
                ) {
                  if (
                    triggerText
                      .substring(backpos.character - 1, 1)
                      .includes('>')
                  ) {
                    insertSnippet(
                      '</' + nsPrefix + nearestTagNotClosed + '>$0',
                      backpos
                    )
                  } else {
                    insertSnippet(
                      '></' + nsPrefix + nearestTagNotClosed + '>$0',
                      backpos
                    )
                  }
                }
              }
            }
          }
        }
        return undefined
      },
    },
    '>' // triggered whenever a '>' is typed
  )
}
