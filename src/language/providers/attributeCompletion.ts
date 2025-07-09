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
import { xml2js } from 'xml-js'
import {
  XmlItem,
  getSchemaNsPrefix,
  nearestOpen,
  checkBraceOpen,
  isInXPath,
  lineCount,
  createCompletionItem,
  getCommonItems,
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

/** Retrieves relevant lines of the document for use in prunedDuplicateAttributes
 * Format of return is as follows [relevant parts of the string, index representing the location of the cursor in the string]
 *
 * @param position
 * @param document
 * @returns
 */
function getPotentialAttributeText(
  position: vscode.Position,
  document: vscode.TextDocument
): [string, number] {
  // Overall strategy: Find the lines that are relevant to the XML element we're looking at. The element can be incomplete and not closed.
  let lowerLineBound: number = position.line
  let upperLineBound: number = position.line

  // Determining the lowerbound strategy: Traverse backwards line-by-line until we encounter an opening character (<)
  while (
    lowerLineBound > 0 && // Make sure we aren't going to negative line indexes
    document.lineAt(lowerLineBound).text.indexOf('<') == -1 // continue going up the document if there is no <
  ) {
    lowerLineBound-- // traverse backwards via decrementing line index
  }

  // Upperbound strategy: Increment the upperLineBound 1 line downward to avoid the edge case it's equal to the lowerLineBound and there's more content beyond lowerLineBound
  if (upperLineBound != document.lineCount - 1) {
    upperLineBound++
  }

  // then, check the subsequent lines if there is an opening character (<)
  while (
    upperLineBound != document.lineCount - 1 &&
    document.lineAt(upperLineBound).text.indexOf('<') == -1
  ) {
    upperLineBound++
  }

  let joinedStr = ''
  let cursorIndexInStr = -1
  // start joining the lines from lowerLineBound to upperLineBound
  for (
    let currLineIndex: number = lowerLineBound;
    currLineIndex <= upperLineBound;
    currLineIndex++
  ) {
    const currLine: string = document.lineAt(currLineIndex).text

    if (currLineIndex == position.line) {
      // note where the cursor is placed as an index relative to the fully joined string
      cursorIndexInStr = joinedStr.length + position.character + -1
    }

    joinedStr += currLine + '\n'
  }

  return [joinedStr, cursorIndexInStr]
}

/** Removes duplicate attribute suggestions from an element. Also handles cases where the element is prefixed with dfdl:
 *
 * @param originalAttributeSuggestions  The completion item list
 * @param position position object provided by VSCode of the cursor
 * @param document vscode object
 * @param nsPrefix namespace prefix of the element (includes the :)
 * @returns
 */
function prunedDuplicateAttributes(
  originalAttributeSuggestions: vscode.CompletionItem[] | undefined,
  position: vscode.Position,
  document: vscode.TextDocument,
  nsPrefix: string
): vscode.CompletionItem[] | undefined {
  if (
    originalAttributeSuggestions == undefined ||
    originalAttributeSuggestions.length == 0
  ) {
    return originalAttributeSuggestions
  }

  const relevantJoinedLinesOfTextItems = getPotentialAttributeText(
    position,
    document
  )
  const textIndex = 0
  const cursorPosIndex = 1

  // Setting up stuff to create a full string representation of the XML element
  const relevantDocText = relevantJoinedLinesOfTextItems[textIndex]
  let indexLowerBound = relevantJoinedLinesOfTextItems[cursorPosIndex] // This gets the character right behind the cursor
  let indexUpperBound = indexLowerBound + 1 // This gets the character after the cursor

  // Traverse backwards character by character to find the first <
  while (indexLowerBound >= 1 && relevantDocText[indexLowerBound] != '<') {
    indexLowerBound--
  }

  // Traverse forward character by character to find > or <
  while (
    indexUpperBound < relevantDocText.length - 1 &&
    !(
      relevantDocText[indexUpperBound] == '<' ||
      relevantDocText[indexUpperBound] == '>'
    )
  ) {
    indexUpperBound++
  }

  // Create the full representation of the current XML element for parsing
  // Force it to be closed if the current xml element isn't closed it
  const fullXMLElementText =
    relevantDocText[indexUpperBound - 1] != '>'
      ? `${relevantDocText.substring(indexLowerBound, indexUpperBound - 1)}>`
      : relevantDocText.substring(indexLowerBound, indexUpperBound)

  // Obtain attributes for the currentl XML element after attempting to parse the whole thing as an XML element
  const xmlRep = xml2js(fullXMLElementText, {})
  const attributes = xmlRep.elements?.[0].attributes

  if (attributes) {
    // Some autocompletion attributes may or may not contain the dfdl: attribute when you accept it
    // This flag determines whether or not we should ignore the dfdl: label when looking at the original attribute suggestions
    const removeDFDLPrefix = nsPrefix === 'dfdl:'
    const attributeSet: Set<string> = new Set(Object.keys(attributes))

    // Return attributes that don't exist in the orignal all encompassing list
    // Note if the element has a dfdl: prefix, then only look at the suffix of the attribute
    return originalAttributeSuggestions.filter((suggestionItem) => {
      const SuggestionLabel = suggestionItem.label.toString()
      return !attributeSet.has(
        removeDFDLPrefix && SuggestionLabel.startsWith('dfdl:')
          ? SuggestionLabel.substring('dfdl:'.length)
          : SuggestionLabel
      )
    })
  }

  return originalAttributeSuggestions
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
        let xmlItem = new XmlItem()
        xmlItem = nearestOpen(document, position)
        let nearestOpenItem = xmlItem.itemName
        let itemsOnLine = getItemsOnLineCount(triggerText)
        const nsPrefix = xmlItem.itemNS
        let additionalItems = getDefinedTypes(
          document,
          getSchemaNsPrefix(document)
        )

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
        const fullAttrCompletionList = checkNearestOpenItem(
          nearestOpenItem,
          triggerText,
          nsPrefix,
          preVal,
          additionalItems,
          charBeforeTrigger,
          charAfterTrigger
        )

        return prunedDuplicateAttributes(
          fullAttrCompletionList,
          position,
          document,
          nsPrefix
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
        let xmlItem = new XmlItem()
        xmlItem = nearestOpen(document, position)
        let nearestOpenItem = xmlItem.itemName
        let itemsOnLine = getItemsOnLineCount(triggerText)
        const nsPrefix = xmlItem.itemNS
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

  const dfdlPrefix = nsPrefix === 'dfdl:' ? '' : dfdlDefaultPrefix

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
        dfdlPrefix,
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
        dfdlPrefix,
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
        dfdlPrefix,
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
        dfdlPrefix,
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
        dfdlPrefix,
        spacingChar,
        afterChar
      )
    case 'include':
      return getCompletionItems(
        ['schemaLocation'],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'import':
      return getCompletionItems(
        ['schemaLocation', 'namespace'],
        '',
        '',
        nsPrefix,
        '',
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
