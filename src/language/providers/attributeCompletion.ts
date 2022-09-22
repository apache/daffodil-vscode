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
import { getXsdNsPrefix } from './utils'

import {
  nearestOpen,
  checkBraceOpen,
  lineCount,
  checkLastItemOpen,
  checkSequenceOpen,
  checkElementOpen,
  checkSimpleTypeOpen,
} from './utils'

import { attributeCompletion } from './intellisense/attributeItems'
import { getCommonItems, createCompletionItem } from './utils'

function getCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = ''
) {
  let compItems: vscode.CompletionItem[] = getCommonItems(
    itemsToUse,
    preVal,
    additionalItems
  )

  attributeCompletion(additionalItems).items.forEach((e) => {
    if (itemsToUse.includes(e.item)) {
      const completionItem = createCompletionItem(e, preVal)
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
        const nsPrefix = getXsdNsPrefix(document, position)
        const wholeLine = document
          .lineAt(position)
          .text.substr(0, position.character)
        var nearestOpenItem = nearestOpen(document, position)

        if (
          !checkBraceOpen(document, position) &&
          !wholeLine.includes('assert') &&
          !nearestOpenItem.includes('none')
        ) {
          if (nearestOpenItem.includes('element')) {
            var preVal = ''
            if (!wholeLine.includes(nsPrefix + 'element')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }
            var additionalItems = getDefinedTypes(document, position)

            if (
              checkLastItemOpen(document, position) &&
              (wholeLine.includes('<' + nsPrefix + 'element name=') ||
                wholeLine.includes('<' + nsPrefix + 'element ref="') ||
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
                additionalItems
              )
            }
          }

          if (nearestOpenItem.includes('sequence')) {
            var preVal = ''
            if (!wholeLine.includes(nsPrefix + 'sequence')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }

            if (
              checkLastItemOpen(document, position) &&
              (wholeLine.includes('<' + nsPrefix + 'sequence') ||
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
                preVal
              )
            }
          }

          if (wholeLine.includes('choice')) {
            if (!wholeLine.includes('>')) {
              return getCompletionItems([
                'dfdl:choiceLengthKind=',
                'dfdl:choiceLength=',
                'dfdl:intiatedContent=',
                'dfdl:choiceDispatchKey=',
                'dfdl:choiceBranchKey=',
              ])
            }
          }

          if (
            wholeLine.includes('simpleType') ||
            checkSimpleTypeOpen(document, position)
          ) {
            if (!wholeLine.includes('>')) {
              return getCompletionItems([
                'dfdl:length=',
                'dfdl:lengthKind=',
                'dfdl:simpleType',
                'dfdl:simpleType',
                'xs:restriction',
              ])
            }
          }

          if (wholeLine.includes('defineVariable')) {
            var preVal = ''
            if (!wholeLine.includes('dfdl:defineVariable')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }
            var additionalItems = getDefinedTypes(document, position)

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

            if (!wholeLine.includes('>')) {
              let compItems: vscode.CompletionItem[] = []
              xmlItems.forEach((e) => {
                const completionItem = new vscode.CompletionItem(e.item)
                completionItem.insertText = new vscode.SnippetString(
                  e.snippetString
                )

                compItems.push(completionItem)
              })

              getCommonItems(['type='], '', additionalItems).forEach((ci) => {
                compItems.push(ci)
              })

              return compItems
            }
          }

          if (nearestOpenItem.includes('setVariable')) {
            var preVal = ''
            if (!wholeLine.includes('dfdl:setVariable')) {
              if (lineCount(document, position) === 1) {
                preVal = '\t'
              } else {
                preVal = ''
              }
            }

            const xmlValue = new vscode.CompletionItem('value=')
            xmlValue.insertText = new vscode.SnippetString('value="$1"$0')
            xmlValue.documentation = new vscode.MarkdownString('')

            if (!wholeLine.includes('>')) {
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

function getDefinedTypes(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var additionalTypes = ''
  var lineNum = 0
  const lineCount = document.lineCount
  const nsPrefix = getXsdNsPrefix(document, position)
  while (lineNum !== lineCount) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
    if (
      wholeLine.includes(nsPrefix + 'simpleType Name=') ||
      wholeLine.includes(nsPrefix + 'complexType Name=')
    ) {
      var startPos = wholeLine.indexOf('"', 0)
      var endPos = wholeLine.indexOf('"', startPos + 1)
      var newType = wholeLine.substring(startPos + 1, endPos)
      additionalTypes = String(additionalTypes + ',' + newType)
    }
    ++lineNum
  }
  return additionalTypes
}
