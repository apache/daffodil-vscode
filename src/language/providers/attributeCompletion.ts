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

/**
 * Attribute Completion Provider for DFDL and TDML Documents
 *
 * This module provides intelligent attribute name completion for XML elements in DFDL schemas
 * and TDML test files. It offers context-aware suggestions based on:
 * - The current XML element type (xs:element, xs:sequence, dfdl:format, etc.)
 * - The namespace being used (XSD, DFDL, TDML)
 * - Previously entered attributes (to avoid suggesting duplicates)
 * - The cursor position within the element tag
 *
 * Features:
 * - Suggests valid DFDL attributes for DFDL-specific elements
 * - Suggests XSD attributes for XML Schema elements
 * - Suggests TDML attributes for TDML test elements
 * - Filters out already-present attributes to avoid duplicates
 * - Handles both space-triggered and equals-triggered completion
 * - Provides appropriate snippets with placeholders for attribute values
 *
 * The provider is triggered when the user types ' ' (space) or '=' within an XML element tag.
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
  getItemsOnLineCount,
  cursorWithinQuotes,
  cursorWithinBraces,
  dfdlDefaultPrefix,
  cursorAfterEquals,
} from './utils'

import { attributeCompletion } from './intellisense/attributeItems'

/**
 * Builds a list of completion items for attributes based on the element context.
 * Combines common items with element-specific attribute suggestions from the intellisense data.
 *
 * @param itemsToUse - Array of attribute names that are valid for the current element
 * @param preVal - Prefix value to prepend to completion text
 * @param additionalItems - The element name for which to get attribute suggestions
 * @param nsPrefix - The XML Schema namespace prefix (e.g., 'xs:', 'xsd:')
 * @param dfdlPrefix - The DFDL namespace prefix (typically 'dfdl:')
 * @param spacingChar - Character for spacing in the completion snippet
 * @param afterChar - Character to insert after the attribute value
 * @returns Array of VS Code completion items for attributes
 */
function getCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = '',
  nsPrefix: string,
  dfdlPrefix: string,
  spacingChar: string,
  afterChar: string
) {
  // array for completion item that will be returned
  let compItems: vscode.CompletionItem[] = []

  // Add element-specific attribute completion items from intellisense data
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

/**
 * Retrieves the relevant text of the current XML element for attribute parsing.
 * Extracts the portion of the document that contains the element tag being edited,
 * which may span multiple lines. This text is used to identify existing attributes
 * and determine what new attributes can be suggested.
 *
 * The function searches backwards to find the opening '<' of the element and forwards
 * to find where the element ends (either '>' or '/>').
 *
 * @param position - The current cursor position
 * @param document - The VS Code text document
 * @returns A tuple of [element text, cursor index within that text]
 */
function getPotentialAttributeText(
  position: vscode.Position,
  document: vscode.TextDocument
): [string, number] {
  // Overall strategy: Find the lines that are relevant to the XML element we're looking at.
  // The element can be incomplete and not yet closed.
  let lowerLineBound: number = position.line
  let upperLineBound: number = position.line

  // Determining the lower bound strategy: Traverse backwards line-by-line until we encounter
  // an opening character (<), which marks the start of the current element.

  // Handle edge case if there's an element closing on the same line or if there is a
  // closing tag after the cursor on the same line
  if (lowerLineBound > 0) {
    lowerLineBound--
  }
  while (
    lowerLineBound > 0 && // Make sure we aren't going to negative line indexes
    document.lineAt(lowerLineBound).text.indexOf('<') == -1 // Continue going up if no '<' found
  ) {
    lowerLineBound-- // Traverse backwards via decrementing line index
  }

  // Upper bound strategy: Increment the upperLineBound 1 line downward to avoid the edge case
  // where it's equal to the lowerLineBound and there's more content beyond lowerLineBound
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
    indexUpperBound < relevantDocText.length &&
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
      ? `${relevantDocText.substring(indexLowerBound, indexUpperBound)}>`
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

/**
 * Registers the attribute completion provider for DFDL documents.
 * This provider suggests valid attribute names when the user types within an XML element tag.
 *
 * The provider:
 * 1. Determines the current element context (which element the cursor is inside)
 * 2. Gets the list of valid attributes for that element
 * 3. Filters out attributes that are already present
 * 4. Returns context-appropriate attribute suggestions
 *
 * Triggered by: space (' ') and newline ('\n') characters
 *
 * @returns A VS Code Disposable for the registered completion provider
 */
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
        const attributeNames = xmlItem.itemAttributes
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
          attributeNames,
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

/**
 * Registers the attribute completion provider for TDML test documents.
 * Similar to the DFDL provider but tailored for TDML-specific attributes
 * like test types, validation modes, and TDML configuration options.
 *
 * Triggered by: space (' ') and newline ('\n') characters
 *
 * @returns A VS Code Disposable for the registered completion provider
 */
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
        const attributeNames = xmlItem.itemAttributes
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
          attributeNames,
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

/**
 * Scans the entire document to find all user-defined type names.
 * Searches for xs:simpleType and xs:complexType declarations and extracts
 * their names, which can then be used for type attribute completion.
 *
 * This allows users to get completion suggestions for their custom-defined
 * types when specifying the 'type' attribute on elements.
 *
 * @param document - The VS Code text document to scan
 * @param nsPrefix - The namespace prefix for schema elements (e.g., 'xs:')
 * @returns Comma-separated string of defined type names
 */
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

/**
 * Determines which completion items to show based on the nearest open element.
 * Matches the element name against known DFDL elements and returns appropriate
 * attribute suggestions for that element type.
 *
 * The function handles special cases for different element types:
 * - Schema root elements
 * - Element declarations
 * - Sequence/choice/group definitions
 * - Format definitions
 * - Variables and assertions
 * - TDML test case elements
 *
 * @param nearestOpenItem - The name of the current enclosing element
 * @param attributeNames - Array of attributes already present on the element
 * @param triggerText - The text of the current line up to the cursor
 * @param nsPrefix - The namespace prefix being used
 * @param preVal - Prefix value to add before attribute (for formatting)
 * @param additionalItems - String of additional items (types/variables) to include
 * @param charBeforeTrigger - Character immediately before the cursor
 * @param charAfterTrigger - Character immediately after the cursor
 * @returns Array of completion items appropriate for the element, or undefined
 */
function checkNearestOpenItem(
  nearestOpenItem: string,
  attributeNames: string[],
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
          'maxOccurs',
          'minOccurs',
          'nillable',
          'ref',
          'type',
          'default',
          'fixed',
          'dfdl:occursCount',
          'dfdl:bitOrder',
          'dfdl:byteOrder',
          'dfdl:encoding',
          'dfdl:utf16Width',
          'dfdl:encodingErrorPolicy',
          'dfdl:alignment',
          'dfdl:alignmentUnits',
          'dfdl:fillbyte',
          'dfdl:leadingSkip',
          'dfdl:trailingSkip',
          'dfdl:initiator',
          'dfdl:terminator',
          'dfdl:emptyValueDelimiterPolicy',
          'dfdl:outputNewLine',
          'dfdl:emptyElementParsePolicy',
          'dfdl:lengthKind',
          'dfdl:lengthUnits',
          'dfdl:length',
          'dfdl:prefixIncludesPrefixLength',
          'dfdl:prefixLengthType',
          'dfdl:lengthPattern',
          'dfdl:representation',
          'dfdl:textPadKind',
          'dfdl:textTrimKind',
          'dfdl:textOutputMinLength',
          'dfdl:escapeSchemeRef',
          'dfdl:textBidi',
          'dfdl:textStringustification',
          'dfdl:textStringPadChar',
          'dfdl:truncateSpecifiedLengthString',
          'dfdl:decimalSigned',
          'dfdl:textNumberRep',
          'dfdl:textNumberJustification',
          'dfdl:textNumberPadCharacter',
          'dfdl:textNumberPattern',
          'dfdl:textnumberRounding',
          'dfdl:textNumberRoundingMode',
          'dfdl:textNumberRoundingIncrement',
          'dfdl:textNumberCheckPolicy',
          'dfdl:textStandardDecimalSeparator',
          'dfdl:textStandardGroupingSeparator',
          'dfdl:textStandardExponentRep',
          'dfdl:textStandardInfinityRep',
          'dfdl:textStandardNaNRep',
          'dfdl:textStandardZeroRep',
          'dfdl:textStandardBase',
          'dfdl:textZonedSignStyle',
          'dfdl:binaryNumberRep',
          'dfdl:binaryDecimalVirtualPoint',
          'dfdl:binaryPakedSignCodes',
          'dfdl:binaryNumberCheckPolicy',
          'dfdl:binaryFloatRep',
          'dfdl:textBooleanTrueRep',
          'dfdl:textBooleanFalseRep',
          'dfdl:textBooleanJustification',
          'dfdl:textBooleanPadChar',
          'dfdl:binaryBooleanTrueRep',
          'dfdl:binaryBooleanFalseRep',
          'dfdl:calendarPattern',
          'dfdl:calendarPatternKind',
          'dfdl:calendarCheckPolicy',
          'dfdl:calendarTimeZone',
          'dfdl:calendarObserveDST',
          'dfdl:calendarFirstDayOfWeek',
          'dfdl:calendarDaysInFirstWeek',
          'dfdl:calendarCenturyStart',
          'dfdl:calendarLanguage',
          'dfdl:textCalendarJustification',
          'dfdl:textCalendarPadCharacter',
          'dfdl:binaryCalendarRep',
          'dfdl:binaryCalendarEpoch',
          'dfdl:nillKind',
          'dfdl:nilValue',
          'dfdl:nilValueDelimiterPolicy',
          'dfdl:useNilValueForDefault',
          'dfdl:floating',
          'dfdl:choiceBranchKey',
          'dfdl:occursCountKind',
          'dfdl:occursCount',
          'dfdl:inputValueCalc',
          'dfdl:outputValueCalc',
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
        ['testKind', 'test', 'testPattern', 'message'],
        '',
        '',
        nsPrefix,
        '',
        spacingChar,
        afterChar
      )
    case 'restriction':
      return getCompletionItems(
        ['base'],
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
          'ref',
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
          'dfdl:floating',
          'dfdl:inputValueCalc',
          'dfdl:outputValueCalc',
          'dfdl:alignment',
          'dfdl:alignmentUnits',
          'dfdl:representation',
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
          'dfdl:prefixIncludesPrefixLength',
          'dfdl:prefixLengthType',
          'dfdl:escapeSchemeRef',
          'dfdl:escapeKind',
          'dfdl:escapeBlockStart',
          'dfdl:escapeBlockEnd',
          'dfdl:escapeEscapeCharacter',
          'dfdl:extraEscapeCharacters',
          'dfdl:generateEscapeBlock',
          'dfdl:escapeCharacterPolicy',
          'dfdl:textBooleanTrueRep',
          'dfdl:textBooleanFalseRep',
          'dfdl:textCalendarJustification',
          'dfdl:textCalendarPadCharacter',
          'dfdl:binaryCalaendarRep',
          'dfdl:binaryCalendarEpoch',
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

/**
 * Creates completion items specifically for dfdl:defineVariable elements.
 * Provides attribute suggestions for variable declarations including:
 * - external: Whether the variable is externally provided
 * - defaultValue: Default value for the variable
 * - type: Data type of the variable (with custom type suggestions)
 *
 * @param preVal - Prefix value for formatting
 * @param additionalItems - Comma-separated list of user-defined types
 * @param nsPrefix - The namespace prefix
 * @param spacingChar - Character for spacing before the attribute
 * @param afterChar - Character to insert after the attribute value
 * @returns Array of completion items for defineVariable attributes
 */
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

  return compItems
}
