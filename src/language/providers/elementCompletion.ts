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
import { checkMissingCloseTag, getCloseTag } from './closeUtils'
import {
  checkBraceOpen,
  getXsdNsPrefix,
  isInXPath,
  nearestOpen,
  createCompletionItem,
  getCommonItems,
  nearestTag,
  getItemsOnLineCount,
  cursorWithinBraces,
  cursorWithinQuotes,
  cursorAfterEquals,
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
      if (
        checkBraceOpen(document, position) ||
        cursorWithinBraces(document, position) ||
        cursorWithinQuotes(document, position) ||
        cursorAfterEquals(document, position) ||
        isInXPath(document, position)
      ) {
        return undefined
      }

      let nsPrefix = getXsdNsPrefix(document, position)
      let [triggerLine, triggerPos] = [position.line, position.character]
      let triggerText = document.lineAt(triggerLine).text
      let itemsOnLine = getItemsOnLineCount(triggerText)
      let nearestOpenItem = nearestOpen(document, position)
      let lastCloseSymbol = triggerText.lastIndexOf('>')
      let firstOpenSymbol = triggerText.indexOf('<')

      let missingCloseTag = checkMissingCloseTag(document, position, nsPrefix)

      if (nearestOpenItem.includes('none')) {
        if (missingCloseTag !== 'none') {
          return undefined
        }
        if (
          missingCloseTag === 'none' &&
          itemsOnLine > 1 &&
          (triggerPos === lastCloseSymbol + 1 || triggerPos === firstOpenSymbol)
        ) {
          return undefined
        }

        let definedVariables = getDefinedVariables(document)

        let [tagNearestTrigger, tagPosition] = getTagNearestTrigger(
          document,
          position,
          triggerText,
          triggerLine,
          triggerPos,
          itemsOnLine,
          nsPrefix
        )

        return nearestOpenTagChildElements(
          document,
          position,
          tagNearestTrigger,
          tagPosition,
          definedVariables,
          nsPrefix
        )
      }
    },
  })
}

export function getTDMLElementCompletionProvider(tdmlFormatString: string) {
  return vscode.languages.registerCompletionItemProvider('tdml', {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      if (
        checkBraceOpen(document, position) ||
        cursorWithinBraces(document, position) ||
        cursorWithinQuotes(document, position) ||
        cursorAfterEquals(document, position) ||
        isInXPath(document, position)
      ) {
        return undefined
      }

      let nsPrefix = getXsdNsPrefix(document, position)
      let [triggerLine, triggerPos] = [position.line, position.character]
      let triggerText = document.lineAt(triggerLine).text
      let itemsOnLine = getItemsOnLineCount(triggerText)
      let nearestOpenItem = nearestOpen(document, position)
      let lastCloseSymbol = triggerText.lastIndexOf('>')
      let firstOpenSymbol = triggerText.indexOf('<')

      let missingCloseTag = checkMissingCloseTag(document, position, nsPrefix)

      if (nearestOpenItem.includes('none')) {
        if (missingCloseTag !== 'none') {
          return undefined
        }
        if (
          missingCloseTag === 'none' &&
          itemsOnLine > 1 &&
          (triggerPos === lastCloseSymbol + 1 || triggerPos === firstOpenSymbol)
        ) {
          return undefined
        }

        let definedVariables = getDefinedVariables(document)

        let [tagNearestTrigger, tagPosition] = getTagNearestTrigger(
          document,
          position,
          triggerText,
          triggerLine,
          triggerPos,
          itemsOnLine,
          nsPrefix
        )

        return nearestOpenTagChildElements(
          document,
          position,
          tagNearestTrigger,
          tagPosition,
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

  elementCompletion(definedVariables, nsPrefix).items.forEach((e) => {
    for (let i = 0; i < itemsToUse.length; ++i) {
      if (e.item.includes(itemsToUse[i])) {
        if (
          (e.item.includes('dfdl:') && itemsToUse[i].includes('dfdl:')) ||
          !e.item.includes('dfdl')
        ) {
          const completionItem = createCompletionItem(e, preVal, nsPrefix)
          compItems.push(completionItem)
        }
      }
    }
  })

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

function nearestOpenTagChildElements(
  document: vscode.TextDocument,
  position: vscode.Position,
  tagNearestTrigger: string,
  tagPosition: vscode.Position,
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
        ['element', 'sequence', 'choice', 'annotation'],
        '',
        '',
        nsPrefix
      )
    case 'choice':
      return getElementCompletionItems(
        ['element', 'sequence', 'group', 'annotation'],
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
      return getElementCompletionItems(
        ['sequence', 'group', 'choice'],
        '',
        '',
        nsPrefix
      )
    case 'simpleType':
      return getElementCompletionItems(
        ['annotation', 'restriction'],
        '',
        '',
        nsPrefix
      )
    case 'restriction':
      return getElementCompletionItems(
        [
          'maxInclusive',
          'maxExclusive',
          'minInclusive',
          'minExclusive',
          'pattern',
          'totalDigits',
          'fractionDigits',
          'enumeration',
        ],
        '',
        '',
        nsPrefix
      )
    case 'annotation':
      return getElementCompletionItems(['appinfo'], '', '', nsPrefix)
    case 'appinfo':
      let triggerText = document.lineAt(tagPosition.line).text
      let iCount = getItemsOnLineCount(triggerText)
      const newPosition =
        iCount < 2
          ? new vscode.Position(tagPosition.line - 1, tagPosition.character)
          : tagPosition
      let pElement = getAnnotationParent(document, newPosition, nsPrefix)
      switch (pElement) {
        case 'schema':
          return getElementCompletionItems(
            [
              'dfdl:defineFormat',
              'dfdl:defineVariable',
              'dfdl:defineEscapeScheme',
              'dfdl:format',
            ],
            '',
            '',
            nsPrefix
          )
        case 'element':
          return getElementCompletionItems(
            [
              'dfdl:assert',
              'dfdl:discriminator',
              'dfdl:element',
              'dfdl:setVariable',
              'dfdl:property',
            ],
            '',
            '',
            nsPrefix
          )
        case 'sequence':
          return getElementCompletionItems(
            [
              'dfdl:assert',
              'dfdl:discriminator',
              'dfdl:newVariableInstance',
              'dfdl:sequence',
            ],
            '',
            '',
            nsPrefix
          )
        case 'choice':
          return getElementCompletionItems(
            [
              'dfdl:assert',
              'dfdl:choice',
              'dfdl:discriminator',
              'dfdl:newVariableInstance',
              'dfdl:setVariable',
            ],
            '',
            '',
            nsPrefix
          )
        case 'group':
          return getElementCompletionItems(
            [
              'dfdl:assert',
              'dfdl:group',
              'dfdl:discriminator',
              'dfdl:newVariableInstance',
              'dfdl:setVariable',
            ],
            '',
            '',
            nsPrefix
          )
        case 'simpleType':
          return getElementCompletionItems(
            [
              'dfdl:assert',
              'dfdl:discriminator',
              'dfdl:setVariable',
              'dfdl:simpleType',
              'dfdl:property',
            ],
            '',
            '',
            nsPrefix
          )
        default:
          return undefined
      }
    case 'assert':
      return getElementCompletionItems(['CDATA', '{}'], '', '', nsPrefix)
    case 'discriminator':
      return getElementCompletionItems(['CDATA', '{}'], '', '', nsPrefix)
    case 'defineFormat':
      return getElementCompletionItems(['dfdl:format'], '', '', nsPrefix)
    case 'defineEscapeScheme':
      return getElementCompletionItems(['dfdl:escapeScheme'], '', '', nsPrefix)
    case 'format':
      return getElementCompletionItems(['dfdl:property'], '', '', nsPrefix)
    case 'schema':
      return getElementCompletionItems(
        [
          'sequence',
          'element',
          'choice',
          'group',
          'complexType',
          'simpleType',
          'annotation',
        ],
        '',
        '',
        nsPrefix
      )
    case 'xml version':
      return getElementCompletionItems(['schema'], '', '', '')
    case 'emptySchema':
      return getElementCompletionItems(['xml version'], '', '', '')
    default:
      return undefined
  }
}

export function getAnnotationParent(
  document: vscode.TextDocument,
  tagPosition: vscode.Position,
  nsPrefix: string
): string {
  let pElementText = document.lineAt(tagPosition.line).text
  let iCount = getItemsOnLineCount(pElementText)
  let pElement = ''
  let [nElement, newPosition] = getTagNearestTrigger(
    document,
    tagPosition,
    pElementText,
    tagPosition.line,
    tagPosition.character,
    iCount,
    nsPrefix
  )
  pElement = nElement
  //get parent of annotation tag
  if (pElement === 'annotation') {
    if (iCount < 2) {
      newPosition = new vscode.Position(
        newPosition.line - 1,
        newPosition.character
      )
    }
    pElementText = document.lineAt(newPosition.line).text
    let [nElement] = getTagNearestTrigger(
      document,
      newPosition,
      pElementText,
      newPosition.line,
      newPosition.character,
      iCount,
      nsPrefix
    )
    pElement = nElement
  }
  return pElement
}

export function getTagNearestTrigger(
  document: vscode.TextDocument,
  position: vscode.Position,
  triggerText: string,
  triggerLine: number,
  triggerPos: number,
  itemsOnLine: number,
  nsPrefix: string
): [string, vscode.Position] {
  let [startLine, startPos] = [triggerLine, triggerPos]
  let tagNearestTrigger = 'none'

  if (
    itemsOnLine === 0 &&
    document.lineCount === 1 &&
    position.character === 0
  ) {
    return ['emptySchema', position]
  }

  while (true) {
    let [foundTag, foundLine, foundPos] = nearestTag(
      document,
      position,
      nsPrefix,
      startLine,
      startPos
    )

    if (itemsOnLine > 1) {
      const afterTriggerText = triggerText.substring(triggerPos)
      const afterTriggerPos = afterTriggerText.indexOf('<') + triggerPos
      const beforeTriggerText = triggerText.substring(0, triggerPos)
      const lastOpenTagBeforeTriggerPos = beforeTriggerText.lastIndexOf('<')
      const beforeTriggerPos = beforeTriggerText.lastIndexOf('>')
      const beforeTriggerTag = beforeTriggerText.substring(
        lastOpenTagBeforeTriggerPos
      )

      if (
        triggerPos === afterTriggerPos &&
        triggerPos === beforeTriggerPos + 1 &&
        !beforeTriggerTag.startsWith('</')
      ) {
        tagNearestTrigger = foundTag
        return [tagNearestTrigger, new vscode.Position(foundLine, foundPos)]
      }
    }

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
        return [tagNearestTrigger, new vscode.Position(foundLine, foundPos)]
      }

      if (endTag === 'none') {
        startLine = foundLine - 1
      } else {
        startPos = foundPos - 1
      }
    }

    if (itemsOnLine < 2) {
      if (
        (foundTag === endTag && endTagLine >= triggerLine) ||
        endTag === 'xml version'
      ) {
        tagNearestTrigger = foundTag
        return [tagNearestTrigger, new vscode.Position(foundLine, foundPos)]
      }

      startLine = foundLine - 1
    }
  }
}
