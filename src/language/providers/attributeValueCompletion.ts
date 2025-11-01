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
 * Attribute Value Completion Provider for DFDL and TDML Documents
 *
 * This module provides intelligent completion suggestions for attribute values in DFDL schemas
 * and TDML test files. It offers context-aware value suggestions based on:
 * - The attribute name (e.g., different values for dfdl:representation, dfdl:length, etc.)
 * - Valid enumerated values from the DFDL specification
 * - Previously defined types (for type references)
 * - Previously defined variables (for variable references)
 * - Boolean values (true/false, yes/no) for boolean attributes
 * - Standard values like encoding names, byte orders, etc.
 *
 * Features:
 * - Enumerated value completion for DFDL properties with fixed value sets
 * - Type name completion (references to xs:simpleType or xs:complexType definitions)
 * - Variable name completion (references to dfdl:defineVariable declarations)
 * - Custom completion items for attributes requiring user input
 * - Filtering based on attribute context (element type, namespace, etc.)
 * - Integration with DFDL and TDML specification data
 *
 * The provider is triggered when the user types opening quotes (\" or ') for an attribute value.
 */

import * as vscode from 'vscode'

import {
  checkBraceOpen,
  cursorWithinBraces,
  cursorWithinQuotes,
  getNsPrefix,
  insertSnippet,
} from './utils'
import { getDefinedTypes } from './attributeCompletion'
import { attributeCompletion } from './intellisense/attributeItems'
import { noChoiceAttributes } from './intellisense/attributeValueItems'

/**
 * Registers the attribute value completion provider for DFDL documents.
 * This provider suggests valid values for DFDL attributes based on the attribute name
 * and context.
 *
 * The provider:
 * 1. Identifies the attribute being edited
 * 2. Looks up valid values for that attribute from the intellisense data
 * 3. Includes user-defined types and variables as applicable
 * 4. Provides completion items with appropriate snippets
 *
 * @returns A VS Code Disposable for the registered completion provider
 */
export function getAttributeValueCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Don't provide completion in these contexts:
        // - Inside curly braces (DFDL expression language)
        // - Outside of quoted strings (not in an attribute value)
        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position) ||
          !cursorWithinQuotes(document, position)
        ) {
          return undefined
        }
        const schemaPosition = new vscode.Position(0, 0)
        const nsPrefix = getNsPrefix(document, schemaPosition)
        let additionalItems = getDefinedTypes(document, nsPrefix)
        let [attributeName, startPos, endPos] = getAttributeDetails(
          document,
          position
        )

        if (attributeName !== 'none' && !attributeName.includes('xmlns:')) {
          let replaceValue = ''
          if (startPos === endPos) {
            replaceValue = ' '
          }

          if (attributeName.includes(':')) {
            attributeName = attributeName.substring(
              attributeName.indexOf(':') + 1
            )
          }

          if (noChoiceAttributes.includes(attributeName)) {
            return undefined
          }

          let startPosition = position.with(position.line, startPos)
          let endPosition = position.with(position.line, endPos + 1)

          let range = new vscode.Range(startPosition, endPosition)

          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, replaceValue)
          })

          /**
           * Generates appropriate completion snippets for attribute values based on the attribute name.
           *
           * This function is called by the completion provider when the cursor is positioned in an
           * attribute value context. It uses a switch statement to map attribute names to their
           * corresponding value snippets and inserts them at the specified position.
           *
           * @param attributeName - The name of the attribute being completed (without namespace prefix for most cases)
           *
           * Implementation Notes:
           * ---------------------
           * - Uses insertSnippet() utility to insert snippets at the cursor position
           * - Snippet syntax: ${1|choice1,choice2|} for dropdowns, "$1" for free text
           * - Expression attributes use "{$1}" to include required curly braces
           * - Some attributes have default values (e.g., "0" for numeric properties)
           * - Type attribute merges XSD primitive types with custom types from the schema
           */
          function getAttributeValues(attributeName: string) {
            type AttributeItem = {
              item: string
              snippetString: string
              markdownString: string
            }
            const attributeItems: AttributeItem[] = []

            attributeCompletion(
              additionalItems,
              '',
              'dfdl',
              '',
              ''
            ).items.forEach((r) => attributeItems.push(r))

            const foundItem = attributeItems.find((attributeItem) =>
              attributeItem.item.includes(attributeName)
            )

            if (foundItem?.item.includes(attributeName)) {
              let parts = foundItem.snippetString.split('=')
              let snippet = parts.slice(1).toString()
              if (snippet != null) {
                return insertSnippet(snippet, startPosition)
              } else {
                return undefined
              }
            }
          }
          getAttributeValues(attributeName)
        }
        return undefined
      },
    },
    ' ' // triggered whenever a space is typed
  )
}

/**
 * Registers the attribute value completion provider for TDML test documents.
 * This provider suggests valid values for TDML-specific attributes such as:
 * - Test types (parser, unparser, negative)
 * - Validation modes (on, limited, off)
 * - Encoding names (UTF-8, ASCII, ISO-8859-1, etc.)
 * - Boolean values (true, false)
 *
 * @returns A VS Code Disposable for the registered completion provider
 */
export function getTDMLAttributeValueCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Don't provide completion inside curly braces (expressions)
        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position)
        ) {
          return undefined
        }
        const nsPrefix = getNsPrefix(document, position)
        let additionalItems = getDefinedTypes(document, nsPrefix)
        let [attributeName, startPos, endPos] = getAttributeDetails(
          document,
          position
        )

        if (attributeName !== 'none') {
          let replaceValue = ''
          if (startPos === endPos) {
            replaceValue = ' '
          }

          if (attributeName.includes(':')) {
            attributeName = attributeName.substring(
              attributeName.indexOf(':') + 1
            )
          }

          if (noChoiceAttributes.includes(attributeName)) {
            return undefined
          }

          let startPosition = position.with(position.line, startPos)
          let endPosition = position.with(position.line, endPos + 1)

          let range = new vscode.Range(startPosition, endPosition)

          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, replaceValue)
          })

          function getAttributeValues(attributeName: string) {
            type AttributeItem = {
              item: string
              snippetString: string
              markdownString: string
            }
            const attributeItems: AttributeItem[] = []

            attributeCompletion(
              additionalItems,
              '',
              'dfdl',
              '',
              ''
            ).items.forEach((r) => attributeItems.push(r))

            const foundItem = attributeItems.find((attributeItem) =>
              attributeItem.item.includes(attributeName)
            )

            if (foundItem?.item.includes(attributeName)) {
              let parts = foundItem.snippetString.split('=')
              let snippet = parts.slice(1).toString()
              if (snippet != null) {
                return insertSnippet(snippet, startPosition)
              } else {
                return undefined
              }
            }
          }
          getAttributeValues(attributeName)
        }
        return undefined
      },
    },
    ' ' // triggered whenever a space is typed
  )
}

/**
 * Extracts details about the attribute being edited at the cursor position.
 * Identifies the attribute name and the position range of its value (between quotes).
 *
 * The function:
 * 1. Searches backwards to find the '=' sign and attribute name
 * 2. Searches for the opening quote (' or ") after the '=' sign
 * 3. Searches for the closing quote
 * 4. Returns the attribute name and value range
 *
 * This information is used to provide context-appropriate attribute value completions
 * and to replace the existing value when a completion is selected.
 *
 * @param document - The VS Code text document
 * @param position - Current cursor position
 * @returns Tuple of [attribute name, start position of value, end position of value]
 *          Returns ['none', 0, 0] if not in an attribute value context
 */
function getAttributeDetails(
  document: vscode.TextDocument,
  position: vscode.Position
): [attributeName: string, valueStartPos: number, valueEndPos: number] {
  const quoteChar: string[] = ["'", '"']
  const triggerLine = position.line
  const triggerPos = position.character
  let currentLine = triggerLine
  let currentPos = triggerPos
  let endPos = -1
  let currentText = document.lineAt(currentLine).text
  let textBeforeTrigger = currentText.substring(0, triggerPos)
  let attributeName = 'none'
  let attributeStartPos = 0

  while (
    !currentText.includes("'") &&
    !currentText.includes('"') &&
    !currentText.includes('=') &&
    !currentText.includes('<') &&
    !currentText.includes('>') &&
    currentLine > 0 &&
    currentLine < document.lineCount
  ) {
    currentText = document.lineAt(--currentLine).text
  }

  if (currentLine === 0 || currentLine === document.lineCount) {
    return ['none', 0, 0]
  }

  if ((currentPos = textBeforeTrigger.lastIndexOf('=')) !== -1) {
    if (triggerPos === currentPos + 1) {
      attributeStartPos = textBeforeTrigger.lastIndexOf(' ') + 1
      attributeName = textBeforeTrigger.substring(attributeStartPos, currentPos)
      return [attributeName, currentPos + 1, currentPos + 1]
    }
  }

  for (let i = 0; i < quoteChar.length; ++i) {
    if (currentText.includes(quoteChar[i])) {
      if (currentLine === triggerLine) {
        currentPos = textBeforeTrigger.lastIndexOf(quoteChar[i])

        if (
          currentPos < triggerPos &&
          textBeforeTrigger.lastIndexOf('=') === currentPos - 1
        ) {
          textBeforeTrigger = textBeforeTrigger.substring(
            0,
            textBeforeTrigger.lastIndexOf('=')
          )
          endPos = currentText.indexOf(quoteChar[i], currentPos + 1)
          attributeStartPos = textBeforeTrigger.lastIndexOf(' ')
          attributeName = textBeforeTrigger
            .substring(attributeStartPos + 1, currentPos - 1)
            .trim()
        }
      }
    }

    if (attributeName !== 'none') {
      break
    }
  }
  return [attributeName, currentPos, endPos]
}
