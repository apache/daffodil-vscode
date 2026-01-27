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
  XmlItem,
  checkBraceOpen,
  getNsPrefix,
  isInXPath,
  isTagEndTrigger,
  nearestOpen,
  createCompletionItem,
  nearestTag,
  getAttributeNames,
  getItemsOnLineCount,
  cursorWithinBraces,
  cursorWithinQuotes,
  cursorAfterEquals,
} from './utils'
import { elementCompletion } from './intellisense/elementItems'
/**
 * Registers an element completion provider for DFDL language files.
 * This provider suggests child elements when the user is inside an XML element
 * and types a newline, helping to construct DFDL schema structures.
 *
 * **Trigger:** Newline character (`\n`)
 *
 * **Key Behaviors:**
 * - Provides context-aware element suggestions based on the parent element
 * - Respects DFDL schema hierarchy (e.g., inside `sequence` suggests `element`, `choice`, etc.)
 * - Handles annotation/appinfo contexts specially for DFDL format definitions
 * - Scans document for defined variables to include in completions
 * - Prevents suggestions when cursor is in inappropriate contexts (XPath, quotes, braces, etc.)
 */
export function getElementCompletionProvider(dfdlFormatString: string) {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      /**
       * Provides completion items when newline is pressed in a DFDL document.
       * Determines which child elements are valid based on the current XML context.
       *
       * **Context Detection Flow:**
       * 1. Check if cursor is in a valid context (not XPath, quotes, braces, etc.)
       * 2. Find the nearest open parent element
       * 3. Check if there are any unclosed tags that need completion
       * 4. Determine which element is nearest to the cursor position
       * 5. Return appropriate child elements for that parent
       *
       * @param document - The active text document
       * @param position - The cursor position where newline was pressed
       * @param token - Cancellation token for async operations
       * @param context - Completion context including trigger character
       * @returns Array of completion items or undefined
       */
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        const triggerChar = context.triggerCharacter

        // **GUARD CLAUSES**: Only provide completions in valid XML contexts
        // Prevent completion inside XPath expressions, braces, quotes, after equals, or at tag ends
        if (
          !checkBraceOpen(document, position) &&
          !cursorWithinBraces(document, position) &&
          !cursorWithinQuotes(document, position) &&
          !cursorAfterEquals(document, position) &&
          !isInXPath(document, position) &&
          !isTagEndTrigger(triggerChar)
        ) {
          let nsPrefix = getNsPrefix(document, position)
          let [triggerLine, triggerPos] = [position.line, position.character]
          let triggerText = document.lineAt(triggerLine).text
          let itemsOnLine = getItemsOnLineCount(triggerText)
          let nearestOpenItem = nearestOpen(document, position)

          // If we found an open item with a namespace, use that namespace
          if (nearestOpenItem.itemNS != 'none') {
            nsPrefix = nearestOpenItem.itemNS
          }
          let lastCloseSymbol = triggerText.lastIndexOf('>')
          let firstOpenSymbol = triggerText.indexOf('<')
          let missingCloseTag = checkMissingCloseTag(
            document,
            position,
            nsPrefix
          )
          // **EARLY RETURN**: If inside an open element with no missing close tags, don't suggest
          if (
            !nearestOpenItem.itemName.includes('none') &&
            missingCloseTag == 'none'
          ) {
            return undefined
          }

          // **EARLY RETURN**: For multi-item lines at specific positions, don't suggest
          if (
            missingCloseTag === 'none' &&
            itemsOnLine > 1 &&
            (triggerPos === lastCloseSymbol + 1 ||
              triggerPos === firstOpenSymbol)
          ) {
            return undefined
          }
          // Scan document for user-defined variables to include in completions
          let definedVariables = getDefinedVariables(document)
          // Find which tag is nearest to the cursor position
          let [tagNearestTrigger, tagPosition] = getTagNearestTrigger(
            document,
            position,
            triggerText,
            triggerLine,
            triggerPos,
            itemsOnLine,
            nsPrefix
          )
          // Return appropriate child elements for the parent context
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
    },
    '\n' // Triggered on newline
  )
}
/**
 * Registers a simpler element completion provider for TDML files.
 * TDML has less complex requirements than DFDL schemas.
 */
export function getTDMLElementCompletionProvider(tdmlFormatString: string) {
  return vscode.languages.registerCompletionItemProvider('tdml', {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      // **SIMPLER GUARD CLAUSES**: TDML uses less strict validation
      if (
        checkBraceOpen(document, position) ||
        cursorWithinBraces(document, position) ||
        cursorWithinQuotes(document, position) ||
        cursorAfterEquals(document, position) ||
        isInXPath(document, position)
      ) {
        return undefined
      }
      let nsPrefix = getNsPrefix(document, position)
      let [triggerLine, triggerPos] = [position.line, position.character]
      let triggerText = document.lineAt(triggerLine).text
      let itemsOnLine = getItemsOnLineCount(triggerText)
      let xmlItem = new XmlItem()
      xmlItem = nearestOpen(document, position)
      let nearestOpenItem = xmlItem.itemName
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
/**
 * Creates completion items from the elementItems data structure.
 * Filters items based on which elements are valid in the current context.
 *
 * @param itemsToUse - Array of element names that are valid in this context
 * @param preVal - Prefix value to prepend (usually empty for elements)
 * @param definedVariables - Comma-separated list of variable names for dfdl:setVariable completion
 * @param nsPrefix - Namespace prefix to use (xs:, dfdl:, etc.)
 * @returns Array of VS Code completion items
 */
function getElementCompletionItems(
  itemsToUse: string[],
  preVal: string = '',
  definedVariables: string = '',
  nsPrefix: string
) {
  let compItems: vscode.CompletionItem[] = []
  // Iterate through all available element completions
  elementCompletion(definedVariables, nsPrefix).items.forEach((e) => {
    for (let i = 0; i < itemsToUse.length; ++i) {
      // Check if this item matches one of the valid elements for this context
      if (e.item.includes(itemsToUse[i])) {
        // Handle dfdl-prefixed items specially
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
/**
 * Scans the document to find all dfdl:defineVariable declarations.
 * Extracts variable names to populate the dropdown for dfdl:setVariable completion.
 *
 * @param document - The VS Code text document to scan
 * @returns Comma-separated string of variable names, or empty string if none found
 */
function getDefinedVariables(document: vscode.TextDocument) {
  let additionalTypes = ''
  let lineNum = 0
  let itemCnt = 0
  const lineCount = document.lineCount
  // Scan entire document line by line
  while (lineNum !== lineCount) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
    // Look for variable definitions
    if (triggerText.includes('dfdl:defineVariable name=')) {
      let startPos = triggerText.indexOf('"', 0)
      let endPos = triggerText.indexOf('"', startPos + 1)
      let newType = triggerText.substring(startPos + 1, endPos)
      // Build comma-separated list of variable names
      additionalTypes =
        itemCnt === 0 ? newType : String(additionalTypes + ',' + newType)
      ++itemCnt
    }
    ++lineNum
  }
  return additionalTypes
}
/**
 * Determines which child elements are valid for a given parent element.
 * This is the core logic for context-aware element completion in DFDL schemas.
 *
 * **DFDL Schema Hierarchy Rules:**
 * - `element` can contain: `complexType`, `simpleType`, `annotation`
 * - `sequence` can contain: `element`, `sequence`, `choice`, `annotation`
 * - `choice` can contain: `element`, `sequence`, `group`, `annotation`
 * - `complexType` can contain: `sequence`, `group`, `choice`, `annotation`
 * - `simpleType` can contain: `annotation`, `restriction`
 * - `annotation` → `appinfo` → DFDL format definitions
 * - `schema` root can contain: `sequence`, `element`, `choice`, `group`, `complexType`, `simpleType`, `annotation`, `include`, `import`
 *
 * **Special Contexts:**
 * - Inside `appinfo`: Provides DFDL-specific elements based on parent of annotation
 * - `assert`/`discriminator`: Suggests CDATA and {} for expressions
 * - Variable-related tags: Provide specific DFDL variable elements
 *
 * @param document - The VS Code text document
 * @param position - The cursor position
 * @param tagNearestTrigger - The parent element name
 * @param tagPosition - Position of the parent element
 * @param definedVariables - Comma-separated variable names for setVariable completion
 * @param nsPrefix - Namespace prefix (xs:, dfdl:, etc.)
 * @returns Array of completion items or undefined
 */
function nearestOpenTagChildElements(
  document: vscode.TextDocument,
  position: vscode.Position,
  tagNearestTrigger: string,
  tagPosition: vscode.Position,
  definedVariables: string,
  nsPrefix: string
) {
  // **MAIN SWITCH**: Determine valid child elements based on parent tag
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
        ['sequence', 'group', 'choice', 'annotation'],
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
    case 'annotation':
      // Annotation can only contain appinfo
      return getElementCompletionItems(['appinfo'], '', '', nsPrefix)
    case 'appinfo':
      // Appinfo context requires special handling - need to find parent of annotation
      let triggerText = document.lineAt(tagPosition.line).text
      let iCount = getItemsOnLineCount(triggerText)

      // Adjust position if needed for multi-line tags
      const newPosition =
        iCount < 2
          ? new vscode.Position(tagPosition.line - 1, tagPosition.character)
          : tagPosition

      // Find the parent element that contains this annotation
      let [pElement, pPosition] = getAnnotationParent(
        document,
        newPosition,
        nsPrefix
      )

      // Get attributes of the parent element
      let attributeNames: string[] = getAttributeNames(
        document,
        pPosition,
        nsPrefix,
        pElement
      )

      // Provide DFDL-specific elements based on parent type
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
              'dfdl:setVariable',
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
          // Group behavior depends on whether it has a 'ref' attribute
          if (attributeNames.includes('ref')) {
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
          } else {
            return getElementCompletionItems(
              [
                'dfdl:assert',
                'dfdl:group',
                'dfdl:discriminator',
                'dfdl:setVariable',
              ],
              '',
              '',
              nsPrefix
            )
          }
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
      // Assert can contain CDATA or expressions
      return getElementCompletionItems(['CDATA', '{}'], '', '', nsPrefix)
    case 'discriminator':
      // Discriminator can contain CDATA or expressions
      return getElementCompletionItems(['CDATA', '{}'], '', '', nsPrefix)
    case 'defineFormat':
      return getElementCompletionItems(['dfdl:format'], '', '', nsPrefix)
    case 'defineEscapeScheme':
      return getElementCompletionItems(['dfdl:escapeScheme'], '', '', nsPrefix)
    case 'format':
      return getElementCompletionItems(['dfdl:property'], '', '', nsPrefix)
    case 'include':
      return getElementCompletionItems([''], '', '', nsPrefix)
    case 'import':
      return getElementCompletionItems([''], '', '', nsPrefix)
    case 'schema':
      // Root schema can contain many top-level elements
      return getElementCompletionItems(
        [
          'sequence',
          'element',
          'choice',
          'group',
          'complexType',
          'simpleType',
          'annotation',
          'include',
          'import',
          'defineVariable',
        ],
        '',
        '',
        nsPrefix
      )
    case 'xml version':
      // After XML declaration, suggest schema
      return getElementCompletionItems(['schema'], '', '', '')
    case 'emptySchema':
      // Empty document, suggest XML declaration
      return getElementCompletionItems(['xml version'], '', '', '')
    default:
      return undefined
  }
}
/**
 * Finds the parent element of an annotation tag.
 * In DFDL schemas, the content of `appinfo` depends on what element the annotation is attached to.
 * This function traverses up to find that parent element.
 *
 * **Example:**
 * ```xml
 * <xs:element name="example">
 *   <xs:annotation>
 *     <xs:appinfo>|cursor here|</xs:appinfo>
 *   </xs:annotation>
 * </xs:element>
 * ```
 * Returns `['element', positionOfElement]`
 *
 * @param document - The VS Code text document
 * @param tagPosition - Position within the annotation/appinfo
 * @param nsPrefix - Namespace prefix
 * @returns Tuple: [parentElementName, parentElementPosition]
 */
export function getAnnotationParent(
  document: vscode.TextDocument,
  tagPosition: vscode.Position,
  nsPrefix: string
): [string, vscode.Position] {
  let pElementText = document.lineAt(tagPosition.line).text
  let iCount = getItemsOnLineCount(pElementText)
  let pElement = ''
  let pPosition = tagPosition
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

  // If we found an annotation, we need to go up one more level to get the actual parent
  if (pElement === 'annotation') {
    if (iCount < 2) {
      // Adjust position for multi-line cases
      newPosition = new vscode.Position(
        newPosition.line - 1,
        newPosition.character
      )
    }
    pElementText = document.lineAt(newPosition.line).text
    let [nElement, nPosition] = getTagNearestTrigger(
      document,
      newPosition,
      pElementText,
      newPosition.line,
      newPosition.character,
      iCount,
      nsPrefix
    )
    pElement = nElement
    pPosition = nPosition
  }
  return [pElement, pPosition]
}
/**
 * Finds the nearest tag to the cursor position that should trigger completion.
 * This is a complex function that handles single-line and multi-line tag scenarios.
 *
 * **Algorithm:**
 * 1. For empty documents, returns special 'emptySchema' indicator
 * 2. For multi-item lines: checks cursor position relative to tags
 * 3. For single-item lines: walks up the document tree to find the appropriate parent
 * 4. Uses `nearestTag()` and `getCloseTag()` to determine tag relationships
 * 5. Handles edge cases where tags are unclosed or nested
 *
 * **Key Logic:**
 * - On multi-tag lines, ensures cursor is positioned correctly between tags
 * - Tracks tag closure state to find the nearest open tag
 * - Adjusts search position based on nesting levels
 *
 * @param document - The VS Code text document
 * @param position - The cursor position
 * @param triggerText - Text of the current line
 * @param triggerLine - Current line number
 * @param triggerPos - Current character position
 * @param itemsOnLine - Count of XML items on the line
 * @param nsPrefix - Namespace prefix
 * @returns Tuple: [nearestTagName, tagPosition]
 */
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
  // **SPECIAL CASE**: Empty document - return special indicator
  if (
    itemsOnLine === 0 &&
    document.lineCount === 1 &&
    position.character === 0
  ) {
    return ['emptySchema', position]
  }
  // **MAIN LOOP**: Continuously search for the nearest tag
  while (true) {
    let [foundTag, foundLine, foundPos] = nearestTag(
      document,
      position,
      nsPrefix,
      startLine,
      startPos
    )
    // **MULTI-ITEM LINE HANDLING**: Complex logic for lines with multiple tags
    if (itemsOnLine > 1) {
      const afterTriggerText = triggerText.substring(triggerPos)
      const afterTriggerPos = afterTriggerText.indexOf('<') + triggerPos
      const beforeTriggerText = triggerText.substring(0, triggerPos)
      const lastOpenTagBeforeTriggerPos = beforeTriggerText.lastIndexOf('<')
      const beforeTriggerPos = beforeTriggerText.lastIndexOf('>')
      const beforeTriggerTag = beforeTriggerText.substring(
        lastOpenTagBeforeTriggerPos
      )
      // Verify cursor is in a valid position between tags (not inside a closing tag)
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
    // Check if the found tag is closed
    let [endTag, endTagLine, endTagPos] = getCloseTag(
      document,
      position,
      nsPrefix,
      foundTag,
      foundLine,
      foundPos
    )
    // **MULTI-ITEM LINE LOGIC**: Ensure we're targeting the right tag
    if (itemsOnLine > 1 && foundLine === triggerLine) {
      if (foundTag === endTag && endTagPos >= triggerPos) {
        tagNearestTrigger = foundTag
        return [tagNearestTrigger, new vscode.Position(foundLine, foundPos)]
      }
      // Tag is closed, adjust search position
      if (endTag === 'none') {
        startLine = foundLine - 1
      } else {
        startPos = foundPos - 1
      }
    }
    // **SINGLE-ITEM LINE LOGIC**: Walk up the tree to find appropriate parent
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
