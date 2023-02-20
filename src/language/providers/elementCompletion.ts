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
import { getCloseTag } from './closeUtils'
import {
  checkBraceOpen,
  getXsdNsPrefix,
  nearestOpen,
  createCompletionItem,
  getCommonItems,
  nearestTag,
  getItemsOnLineCount,
} from './utils'
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

      let nsPrefix = getXsdNsPrefix(document, position)
      let [triggerLine, triggerPos] = [position.line, position.character]
      let triggerText = document.lineAt(triggerLine).text
      let itemsOnLine = getItemsOnLineCount(triggerText)
      let nearestOpenItem = nearestOpen(document, position)

      if (nearestOpenItem.includes('none')) {
        let definedVariables = getDefinedVariables(document)

        let tagNearestTrigger = getTagNearestTrigger(
          document,
          position,
          triggerText,
          triggerLine,
          triggerPos,
          itemsOnLine,
          nsPrefix
        )

        return checkTagNearestOpen(
          document,
          position,
          tagNearestTrigger,
          definedVariables,
          nsPrefix
        )
      }
    },
  })
}

function getElementCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  definedVariables: string = '',
  nsPrefix: string
) {
  let compItems: vscode.CompletionItem[] = getCommonItems(
    itemsToUse,
    preVal,
    definedVariables,
    nsPrefix
  )
  let dfdlFormatString: string = ''

  elementCompletion(definedVariables, dfdlFormatString, nsPrefix).items.forEach(
    (e) => {
      for (let i = 0; i < itemsToUse.length; ++i) {
        if (e.item.includes(itemsToUse[i])) {
          const completionItem = createCompletionItem(e, preVal, nsPrefix)
          compItems.push(completionItem)
        }
      }
    }
  )

  return compItems
}

function getDefinedVariables(document: vscode.TextDocument) {
  let additionalTypes = ''
  let lineNum = 0
  let itemCnt = 0
  const lineCount = document.lineCount

  while (lineNum !== lineCount) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)

    if (triggerText.includes('dfdl:defineVariable name=')) {
      let startPos = triggerText.indexOf('"', 0)
      let endPos = triggerText.indexOf('"', startPos + 1)
      let newType = triggerText.substring(startPos + 1, endPos)

      additionalTypes =
        itemCnt === 0 ? newType : String(additionalTypes + ',' + newType)
      ++itemCnt
    }

    ++lineNum
  }

  return additionalTypes
}

function checkTagNearestOpen(
  document: vscode.TextDocument,
  position: vscode.Position,
  tagNearestTrigger: string,
  definedVariables: string,
  nsPrefix: string
) {
  switch (tagNearestTrigger) {
    case 'element':
      return getElementCompletionItems(
        ['complexType', 'simpleType', 'annotation'],
        '',
        definedVariables,
        nsPrefix
      )
    case 'sequence':
      return getElementCompletionItems(
        ['element', 'sequence', 'choice', 'annotation', 'appinfo'],
        '',
        '',
        nsPrefix
      )
    case 'choice':
      return getElementCompletionItems(
        ['element', 'group ref', 'annotation'],
        '',
        '',
        nsPrefix
      )
    case 'group':
      return getElementCompletionItems(
        ['sequence', 'annotation'],
        '',
        '',
        nsPrefix
      )
    case 'complexType':
      return getElementCompletionItems(['sequence'], '', '', nsPrefix)
    case 'simpleType':
      return getElementCompletionItems(
        ['annotation', 'restriction'],
        '',
        '',
        nsPrefix
      )
    case 'annotation':
      return getElementCompletionItems(['appinfo'], '', '', nsPrefix)
    case 'appinfo':
      return getElementCompletionItems(
        [
          'assert',
          'discriminator',
          'defineFormat',
          'format',
          'defineVariable',
          'setVariable',
        ],
        '',
        '',
        nsPrefix
      )
    case 'defineFormat':
      return getElementCompletionItems(['format'], '', '', nsPrefix)
    case 'schema':
      return getElementCompletionItems(
        [
          'sequence',
          'element',
          'group',
          'complexType',
          'simpleType',
          'annotation',
        ],
        '',
        '',
        nsPrefix
      )
    default:
      return undefined
  }
}

export function getTagNearestTrigger(
  document: vscode.TextDocument,
  position: vscode.Position,
  triggerText: string,
  triggerLine: number,
  triggerPos: number,
  itemsOnLine: number,
  nsPrefix: string
): string {
  let [startLine, startPos] = [triggerLine, triggerPos]
  let tagNearestTrigger = 'none'

  if (
    itemsOnLine > 1 &&
    (triggerPos === triggerText.indexOf('<') ||
      triggerPos === triggerText.lastIndexOf('>') + 1)
  ) {
    return tagNearestTrigger
  }
  while (true) {
    let [foundTag, foundLine, foundPos] = nearestTag(
      document,
      position,
      nsPrefix,
      startLine,
      startPos
    )

    startLine = foundLine

    let [endTag, endTagLine, endTagPos] = getCloseTag(
      document,
      position,
      nsPrefix,
      foundTag,
      foundLine,
      foundPos
    )

    if (itemsOnLine > 1 && foundLine === triggerLine) {
      if (foundTag === endTag && endTagPos >= triggerPos) {
        tagNearestTrigger = foundTag
        return tagNearestTrigger
      }
      if (endTag === 'none') {
        startLine = foundLine - 1
      } else {
        startPos = foundPos - 1
      }
    }

    if (itemsOnLine < 2) {
      if (foundTag === endTag && endTagLine >= triggerLine) {
        tagNearestTrigger = foundTag
        return tagNearestTrigger
      }

      startLine = foundLine - 1
    }
  }
}
