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
  nearestOpen,
  checkBraceOpen,
  lineCount,
  checkLastItemOpen,
  checkSequenceOpen,
  checkElementOpen,
  checkSimpleTypeOpen,
  createCompletionItem,
  getCommonItems,
  getXsdNsPrefix,
} from './utils'

import { attributeCompletion } from './intellisense/attributeItems'

function getCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = '',
  nsPrefix: string
) {
  let compItems: vscode.CompletionItem[] = getCommonItems(
    itemsToUse,
    preVal,
    additionalItems,
    nsPrefix
  )

  attributeCompletion(additionalItems, nsPrefix).items.forEach((e) => {
    if (itemsToUse.includes(e.item)) {
      const completionItem = createCompletionItem(e, preVal, nsPrefix)
      compItems.push(completionItem)
    }
  })

  return compItems
}

export function getAttributeCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    { language: 'dfdl' },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)
        var nearestOpenItem = nearestOpen(document, position)
        const nsPrefix = getXsdNsPrefix(document, position)

        if (
          !checkBraceOpen(document, position) &&
          !triggerText.includes('assert') &&
          !nearestOpenItem.includes('none')
        ) {
          if (nearestOpenItem.includes('element')) {
            var preVal = ''
            if (!triggerText.includes(nsPrefix + 'element')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }
            var additionalItems = getDefinedTypes(document, nsPrefix)

            if (
              checkLastItemOpen(document, position) &&
              (triggerText.includes('<' + nsPrefix + 'element name="') ||
                triggerText.includes('<' + nsPrefix + 'element ref="') ||
                checkElementOpen(document, position))
            ) {
              return getCompletionItems(
                [
                  'dfdl:defineFormat',
                  'dfdl:defineEscapeScheme',
                  'type=',
                  'minOccurs=',
                  'maxOccurs=',
                  'dfdl:occursCount=',
                  'dfdl:byteOrder=',
                  'dfdl:occursCountKind=',
                  'dfdl:length=',
                  'dfdl:lengthKind=',
                  'dfdl:encoding=',
                  'dfdl:alignment=',
                  'dfdl:lengthUnits=',
                  'dfdl:lengthPattern=',
                  'dfdl:inputValueCalc=',
                  'dfdl:outputValueCalc=',
                  'dfdl:alignmentUnits=',
                  'dfdl:terminator=',
                  'dfdl:outputNewLine=',
                  'dfdl:choiceBranchKey=',
                  'dfdl:representation',
                ],
                preVal,
                additionalItems,
                nsPrefix
              )
            }
          }

          if (nearestOpenItem.includes('sequence')) {
            var preVal = ''
            if (!triggerText.includes(nsPrefix + 'sequence')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }

            if (
              checkLastItemOpen(document, position) &&
              (triggerText.includes('<' + nsPrefix + 'sequence') ||
                checkSequenceOpen(document, position))
            ) {
              return getCompletionItems(
                [
                  'dfdl:hiddenGroupRef=',
                  'dfdl:sequenceKind=',
                  'dfdl:separator=',
                  'dfdl:separatorPosition=',
                  'dfdl:separatorSuppressionPolicy',
                ],
                preVal,
                undefined,
                nsPrefix
              )
            }
          }

          if (triggerText.includes('choice')) {
            if (!triggerText.includes('>')) {
              return getCompletionItems(
                [
                  'dfdl:choiceLengthKind=',
                  'dfdl:choiceLength=',
                  'dfdl:initiatedContent=',
                  'dfdl:choiceDispatchKey=',
                  'dfdl:choiceBranchKey=',
                ],
                undefined,
                undefined,
                nsPrefix
              )
            }
          }

          if (
            triggerText.includes('simpleType') ||
            checkSimpleTypeOpen(document, position)
          ) {
            if (!triggerText.includes('>')) {
              return getCompletionItems(
                [
                  'dfdl:length=',
                  'dfdl:lengthKind=',
                  'dfdl:simpleType',
                  'dfdl:simpleType',
                  nsPrefix + 'restriction',
                ],
                undefined,
                undefined,
                nsPrefix
              )
            }
          }

          if (triggerText.includes('defineVariable')) {
            var preVal = ''
            if (!triggerText.includes('dfdl:defineVariable')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }
            var additionalItems = getDefinedTypes(document, nsPrefix)

            var xmlItems = [
              {
                item: 'external=',
                snippetString: preVal + 'external="${1|true,false|}"$0',
              },
              {
                item: 'defaultValue=',
                snippetString: preVal + 'defaultValue="0$1"$0',
              },
            ]

            if (!triggerText.includes('>')) {
              let compItems: vscode.CompletionItem[] = []
              xmlItems.forEach((e) => {
                const completionItem = new vscode.CompletionItem(e.item)
                completionItem.insertText = new vscode.SnippetString(
                  e.snippetString
                )

                compItems.push(completionItem)
              })

              getCommonItems(['type='], '', additionalItems, nsPrefix).forEach(
                (ci) => {
                  compItems.push(ci)
                }
              )

              return compItems
            }
          }

          if (nearestOpenItem.includes('setVariable')) {
            var preVal = ''
            if (!triggerText.includes('dfdl:setVariable')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }

            const xmlValue = new vscode.CompletionItem('value=')
            xmlValue.insertText = new vscode.SnippetString('value="$1"$0')
            xmlValue.documentation = new vscode.MarkdownString('')

            if (!triggerText.includes('>')) {
              return [xmlValue]
            }
          }
        }
        return undefined
      },
    },
    ' ',
    '\n' // triggered whenever a newline is typed
  )
}

function getDefinedTypes(document: vscode.TextDocument, nsPrefix: string) {
  var additionalTypes = ''
  var lineNum = 0
  const lineCount = document.lineCount

  while (lineNum !== lineCount) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
    if (
      triggerText.includes(nsPrefix + 'simpleType Name=') ||
      triggerText.includes(nsPrefix + 'complexType Name=')
    ) {
      var startPos = triggerText.indexOf('"', 0)
      var endPos = triggerText.indexOf('"', startPos + 1)
      var newType = triggerText.substring(startPos + 1, endPos)
      additionalTypes = String(additionalTypes + ',' + newType)
    }
    ++lineNum
  }
  return additionalTypes
}
