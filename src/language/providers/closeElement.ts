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
  nearestOpen,
  getItemsOnLineCount,
} from './utils'

export function getCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        var backpos = position.with(position.line, position.character - 1)
        const nsPrefix = getXsdNsPrefix(document, position)
        const nearestOpenItem = nearestOpen(document, position)
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)
        var itemsOnLine = getItemsOnLineCount(triggerText)

        if (
          triggerText.endsWith('>') &&
          ((triggerText.includes('<' + nsPrefix + 'element') &&
            nearestOpenItem.includes('element')) ||
            (triggerText.includes('<' + nsPrefix + 'group') &&
              nearestOpenItem.includes('group')) ||
            (triggerText.includes('<' + nsPrefix + 'sequence') &&
              nearestOpenItem.includes('sequence')) ||
            (triggerText.includes('<' + nsPrefix + 'simpleType') &&
              nearestOpenItem.includes('simpleType')) ||
            (triggerText.includes('<' + nsPrefix + 'choice') &&
              nearestOpenItem.includes('choice')) ||
            (triggerText.includes('dfdl:defineVariable') &&
              nearestOpenItem.includes('Variable')))
        ) {
          var range = new vscode.Range(backpos, position)
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
          if (!triggerText.includes('</') && itemsOnLine == 1) {
            if (
              triggerText.endsWith('>') &&
              (triggerText.includes('<' + nsPrefix + 'element ref') ||
                triggerText.includes('<' + nsPrefix + 'group ref'))
            ) {
              insertSnippet(' />\n$0', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'element') &&
              nearestOpenItem.includes('element')
            ) {
              insertSnippet('>\n\t$0\n</' + nsPrefix + 'element>', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'group') &&
              nearestOpenItem.includes('group')
            ) {
              insertSnippet('>\n\t$0\n</' + nsPrefix + 'group>', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'sequence') &&
              nearestOpenItem.includes('sequence')
            ) {
              insertSnippet('>\n\t$0\n</' + nsPrefix + 'sequence>', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'choice') &&
              nearestOpenItem.includes('choice')
            ) {
              insertSnippet('>\n\t$0\n</' + nsPrefix + 'choice>', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'simpleType') &&
              nearestOpenItem.includes('simpleType')
            ) {
              insertSnippet('>\n\t$0\n</' + nsPrefix + 'simpleType>', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('dfdl:defineVariable') &&
              nearestOpenItem.includes('defineVariable')
            ) {
              var startPos = document.lineAt(position).text.indexOf('<', 0)
              var range = new vscode.Range(backpos, position)
              vscode.window.activeTextEditor?.edit((editBuilder) => {
                editBuilder.replace(range, '')
              })
              insertSnippet('>\n</dfdl:defineVariable>\n', backpos)
              var backpos2 = position.with(position.line + 2, startPos - 2)
              insertSnippet('</<' + nsPrefix + 'appinfo>\n', backpos2)
              var backpos3 = position.with(position.line + 3, startPos - 4)
              insertSnippet('</<' + nsPrefix + 'annotation>$0', backpos3)
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
              insertSnippet('</' + nsPrefix + 'appinfo>\n', backpos2)
              var backpos3 = position.with(position.line + 3, startPos - 4)
              insertSnippet('</' + nsPrefix + 'annotation>$0', backpos3)
            }
          }
          if (itemsOnLine > 1) {
            if (
              triggerText.endsWith('>') &&
              (triggerText.includes('<' + nsPrefix + 'element ref') ||
                triggerText.includes('<' + nsPrefix + 'group ref'))
            ) {
              insertSnippet(' />\n$0', backpos)
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'element') &&
              nearestOpenItem.includes('element')
            ) {
              var tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'element')
              var tagEndPos = triggerText.indexOf('>', tagPos)
              if (tagPos != -1) {
                if (
                  !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
                  !triggerText.includes('</' + nsPrefix + 'element')
                ) {
                  if (
                    triggerText.substr(backpos.character - 1, 1).includes('>')
                  ) {
                    insertSnippet('</' + nsPrefix + 'element>$0', backpos)
                  } else {
                    insertSnippet('></' + nsPrefix + 'element>$0', backpos)
                  }
                }
              }
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'sequence') &&
              nearestOpenItem.includes('sequence')
            ) {
              var tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'sequence')
              var tagEndPos = triggerText.indexOf('>', tagPos)
              if (tagPos != -1) {
                if (
                  !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
                  !triggerText.includes('</' + nsPrefix + 'sequence')
                ) {
                  if (
                    triggerText.substr(backpos.character - 1, 1).includes('>')
                  ) {
                    insertSnippet('</' + nsPrefix + 'sequence>$0', backpos)
                  } else {
                    insertSnippet('></' + nsPrefix + 'sequence>$0', backpos)
                  }
                }
              }
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'group') &&
              nearestOpenItem.includes('group')
            ) {
              var tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'group')
              var tagEndPos = triggerText.indexOf('>', tagPos)
              if (tagPos != -1) {
                if (
                  !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
                  !triggerText.includes('</' + nsPrefix + 'group')
                ) {
                  if (
                    triggerText.substr(backpos.character - 1, 1).includes('>')
                  ) {
                    insertSnippet('</' + nsPrefix + 'group>$0', backpos)
                  } else {
                    insertSnippet('></' + nsPrefix + 'group>$0', backpos)
                  }
                }
              }
            } else if (
              triggerText.endsWith('>') &&
              triggerText.includes('<' + nsPrefix + 'choice') &&
              nearestOpenItem.includes('choice')
            ) {
              var tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'choice')
              var tagEndPos = triggerText.indexOf('>', tagPos)
              if (tagPos != -1) {
                if (
                  !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
                  !triggerText.includes('</' + nsPrefix + 'choice')
                ) {
                  if (
                    triggerText.substr(backpos.character - 1, 1).includes('>')
                  ) {
                    insertSnippet('</' + nsPrefix + 'choice>$0', backpos)
                  } else {
                    insertSnippet('></' + nsPrefix + 'choice>$0', backpos)
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
