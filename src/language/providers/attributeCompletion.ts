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
  isInXPath,
  lineCount,
  createCompletionItem,
  getCommonItems,
  getXsdNsPrefix,
  getItemsOnLineCount,
  cursorWithinQuotes,
  cursorWithinBraces,
  dfdlDefaultPrefix,
  cursorAfterEquals,
} from './utils'

import { attributeCompletion } from './intellisense/attributeItems'

function getCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = '',
  nsPrefix: string,
  dfdlPrefix: string,
  spacingChar: string,
  afterChar: string
) {
  let compItems: vscode.CompletionItem[] = getCommonItems(
    itemsToUse,
    preVal,
    additionalItems,
    nsPrefix
  )

  attributeCompletion(
    additionalItems,
    nsPrefix,
    dfdlPrefix,
    spacingChar,
    afterChar
  ).items.forEach((e) => {
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
        const charBeforeTrigger = triggerText.charAt(position.character - 1)
        const charAfterTrigger = triggerText.charAt(position.character)
        let nearestOpenItem = nearestOpen(document, position)
        let itemsOnLine = getItemsOnLineCount(triggerText)
        const nsPrefix = getXsdNsPrefix(document, position)
        let additionalItems = getDefinedTypes(document, nsPrefix)

        if (isInXPath(document, position)) return undefined

        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position) ||
          cursorWithinQuotes(document, position) ||
          cursorAfterEquals(document, position) ||
          nearestOpenItem.includes('none')
        ) {
          return undefined
        }
        let preVal =
          !triggerText.includes('<' + nsPrefix + nearestOpenItem) &&
          lineCount(document, position, nearestOpenItem) === 1 &&
          itemsOnLine < 2
            ? '\t'
            : ''

        return checkNearestOpenItem(
          nearestOpenItem,
          triggerText,
          nsPrefix,
          preVal,
          additionalItems,
          charBeforeTrigger,
          charAfterTrigger
        )
      },
    },
    ' ',
    '\n' // triggered whenever a newline is typed
  )
}

export function getTDMLAttributeCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    { language: 'tdml' },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)
        const charBeforeTrigger = triggerText.charAt(position.character - 1)
        const charAfterTrigger = triggerText.charAt(position.character)
        let nearestOpenItem = nearestOpen(document, position)
        let itemsOnLine = getItemsOnLineCount(triggerText)
        const nsPrefix = getXsdNsPrefix(document, position)
        let additionalItems = getDefinedTypes(document, nsPrefix)

        if (isInXPath(document, position)) return undefined

        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position) ||
          cursorWithinQuotes(document, position) ||
          cursorAfterEquals(document, position) ||
          nearestOpenItem.includes('none')
        ) {
          return undefined
        }
        let preVal =
          !triggerText.includes('<' + nsPrefix + nearestOpenItem) &&
          lineCount(document, position, nearestOpenItem) === 1 &&
          itemsOnLine < 2
            ? '\t'
            : ''

        return checkNearestOpenItem(
          nearestOpenItem,
          triggerText,
          nsPrefix,
          preVal,
          additionalItems,
          charBeforeTrigger,
          charAfterTrigger
        )
      },
    },
    ' ',
    '\n' // triggered whenever a newline is typed
  )
}

export function getDefinedTypes(
  document: vscode.TextDocument,
  nsPrefix: string
) {
  let additionalTypes = ''
  let lineNum = 0
  const lineCount = document.lineCount

  while (lineNum !== lineCount) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)

    if (
      triggerText.includes(nsPrefix + 'simpleType name=') ||
      triggerText.includes(nsPrefix + 'complexType name=')
    ) {
      let startPos = triggerText.indexOf('"', 0)
      let endPos = triggerText.indexOf('"', startPos + 1)
      let newType = triggerText.substring(startPos + 1, endPos)

      additionalTypes = String(additionalTypes + ',' + newType)
    }

    ++lineNum
  }

  return additionalTypes
}

function checkNearestOpenItem(
  nearestOpenItem: string,
  triggerText: string,
  nsPrefix: string,
  preVal: string,
  additionalItems: string,
  charBeforeTrigger: string,
  charAfterTrigger: string
): vscode.CompletionItem[] | undefined {
  const spacingChar: string =
    charBeforeTrigger !== ' ' &&
    charBeforeTrigger !== '\n' &&
    charBeforeTrigger !== '\t'
      ? ' '
      : ''
  const afterChar: string =
    charAfterTrigger !== ' ' &&
    charAfterTrigger !== '\n' &&
    charAfterTrigger !== '\t'
      ? ' '
      : ''
  switch (nearestOpenItem) {
    case 'element':
      return getCompletionItems(
        [
          'name',
          'ref',
          'type',
          'minOccurs',
          'maxOccurs',
          'dfdl:occursCount',
          'dfdl:bitOrder',
          'dfdl:byteOrder',
          'dfdl:occursCountKind',
          'dfdl:length',
          'dfdl:lengthKind',
          'dfdl:encoding',
          'dfdl:alignment',
          'dfdl:lengthUnits',
          'dfdl:lengthPattern',
          'dfdl:inputValueCalc',
          'dfdl:outputValueCalc',
          'dfdl:alignmentUnits',
          'dfdl:binaryNumberRep',
          'dfdl:terminator',
          'dfdl:outputNewLine',
          'dfdl:choiceBranchKey',
          'dfdl:prefixIncludesPrefixLength',
          'dfdl:prefixLengthType',
          'dfdl:representation',
          'dfdl:binaryBooleanTrueRep',
          'dfdl:binaryBooleanFalseRep',
        ],
        preVal,
        additionalItems,
        nsPrefix,
        dfdlDefaultPrefix,
        spacingChar,
        afterChar
      )
    case 'sequence':
      return getCompletionItems(
        [
          'dfdl:hiddenGroupRef',
          'dfdl:sequenceKind',
          'dfdl:separator',
          'dfdl:separatorPosition',
          'dfdl:separatorSuppressionPolicy',
        ],
        preVal,
        '',
        nsPrefix,
        dfdlDefaultPrefix,
        spacingChar,
        afterChar
      )
    case 'choice':
      return getCompletionItems(
        [
          'dfdl:choiceLengthKind',
          'dfdl:choiceLength',
          'dfdl:initiatedContent',
          'dfdl:choiceDispatchKey',
          'dfdl:choiceBranchKey',
        ],
        '',
        '',
        nsPrefix,
        dfdlDefaultPrefix,
        spacingChar,
        afterChar
      )
    case 'group':
      return getCompletionItems(
        [
          'ref',
          'name',
          'dfdl:separator',
          'dfdl:separatorPosition',
          'dfdl:separatorSuppressionPolicy',
        ],
        '',
        '',
        nsPrefix,
        dfdlDefaultPrefix,
        spacingChar,
        afterChar
      )

    case 'simpleType':
      return getCompletionItems(
        [
          'dfdl:binaryNumberRep',
          'dfdl:length',
          'dfdl:lengthKind',
          'dfdl:representation',
          'dfdl:binaryBooleanTrueRep',
          'dfdl:binaryBooleanFalseRep',
        ],
        '',
        '',
        nsPrefix,
        dfdlDefaultPrefix,
        spacingChar,
        afterChar
      )
    case 'assert':
      return getCompletionItems(
        ['testKind', 'test', 'testPattern', 'message', 'failureType'],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'discriminator':
      return getCompletionItems(
        ['test', 'message'],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'format':
      return getCompletionItems(
        [
          'dfdl:byteOrder',
          'dfdl:bitOrder',
          'dfdl:binaryNumberRep',
          'dfdl:binaryFloatRep',
          'dfdl:binaryDecimalVirtualPoint',
          'dfdl:binaryPackedSignCodes',
          'dfdl:binaryNumberCheckPolicy',
          'dfdl:encoding',
          'dfdl:encodingErrorPolicy',
          'dfdl:initiator',
          'dfdl:length',
          'dfdl:lengthKind',
          'dfdl:lengthUnits',
          'dfdl:utf16Width',
          'dfdl:nilKind',
          'dfdl:nilValue',
          'dfdl:nilValueDelimiterPolicy',
          'dfdl:useNilForDefault',
          'dfdl:lengthPattern',
          'dfdl:outputNewLine',
          'dfdl:separator',
          'dfdl:separatorPosition',
          'dfdl:separatorSuppressionPolicy',
          'dfdl:terminator',
          'dfdl:occursCountKind',
          'dfdl:decimalSigned',
          'dfdl:textStandardZeroRep',
          'dfdl:textStandardInfinityRep',
          'dfdl:textStandardExponentRep',
          'dfdl:textStandardNaNRep',
          'dfdl:textNumberPattern',
          'dfdl:textNumberRep',
          'dfdl:textNumberJustification',
          'dfdl:textNumberRoundingIncrement',
          'dfdl:textNumberRoundingMode',
          'dfdl:textStandardRoundingIncrement',
          'dfdl:textNumberRounding',
          'dfdl:textNumberCheckPolicy',
          'dfdl:textOutputMinLength',
          'dfdl:textPolicyOutputMinLength',
          'dfdl:textStandardDecimalSeparator',
          'dfdl:textStandardGroupingSeparator',
          'dfdl:textStringJustification',
          'dfdl:textStringPadCharacter',
          'dfdl:textPadKind',
          'dfdl:textStandardBase',
          'dfdl:textZonedSignStyle',
          'dfdl:textTrimKind',
          'dfdl:leadingSkip',
          'dfdl:trailingSkip',
          'dfdl:truncateSpecifiedLengthString',
          'dfdl:sequenceKind',
          'dfdl:textBidi',
          'dfdl:choiceLengthKind',
          'dfdl:choiceLength',
          'dfdl:fillByte',
          'dfdl:ignoreCase',
          'dfdl:initiatedContent',
          'dfdl:initiator',
          'dfdl:floating',
          'dfdl:inputValueCalc',
          'dfdl:outputValueCalc',
          'dfdl:alignment',
          'dfdl:alignmentUnits',
          'dfdl:terminator',
          'dfdl:outputNewLine',
          'dfdl:representation',
          'dfdl:escapeSchemeRef',
          'dfdl:calendarPattern',
          'dfdl:calendarPatternKind',
          'dfdl:calendarCheckPolicy',
          'dfdl:calendarTimeZone',
          'dfdl:calendarObserveDST',
          'dfdl:calendarFirstDayOfWeek',
          'dfdl:calendarDaysInFirstWeek',
          'dfdl:calendarCenturyStart',
          'dfdl:calendarLanguage',
          'dfdl:documentFinalTerminatorCanBeMissing',
          'dfdl:emptyValueDelimiterPolicy',
          'dfdl:emptyElementParsePolicy',
        ],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'escapeScheme':
      return getCompletionItems(
        [
          'dfdl:escapeKind',
          'dfdl:escapeCharacter',
          'dfdl:escapeBlockStart',
          'dfdl:escapeBlockEnd',
          'dfdl:escapeEscapeCharacter',
          'dfdl:extraEscapedCharacters',
          'dfdl:generateEscapeBlock',
          'dfdl:escapeCharacterPolicy',
        ],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'defineVariable':
      return getDefineVariableCompletionItems(
        preVal,
        additionalItems,
        nsPrefix,
        spacingChar,
        afterChar
      )
    case 'newVariableInstance':
      return getDefineVariableCompletionItems(
        preVal,
        additionalItems,
        nsPrefix,
        spacingChar,
        afterChar
      )
    case 'setVariable':
      const xmlValue = new vscode.CompletionItem('value')
      xmlValue.insertText = new vscode.SnippetString('value="$1"$0')
      xmlValue.documentation = new vscode.MarkdownString('')
      return undefined
    default:
      return undefined
  }
}

function getDefineVariableCompletionItems(
  preVal: string,
  additionalItems: string,
  nsPrefix: string,
  spacingChar: string,
  afterChar: string
): vscode.CompletionItem[] {
  let xmlItems = [
    {
      item: 'external',
      snippetString:
        spacingChar + preVal + 'external="${1|true,false|}"$0' + afterChar,
    },
    {
      item: 'defaultValue',
      snippetString: spacingChar + preVal + 'defaultValue="0$1"$0' + afterChar,
    },
  ]

  let compItems: vscode.CompletionItem[] = []
  xmlItems.forEach((e) => {
    const completionItem = new vscode.CompletionItem(e.item)
    completionItem.insertText = new vscode.SnippetString(e.snippetString)

    compItems.push(completionItem)
  })

  getCommonItems(['type'], '', additionalItems, nsPrefix).forEach((ci) => {
    compItems.push(ci)
  })

  return compItems
}
