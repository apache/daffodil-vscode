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

import { checkBraceOpen, cursorWithinBraces, getXsdNsPrefix } from './utils'
import { getDefinedTypes } from './attributeCompletion'
import {
  attributeValues,
  noChoiceAttributes,
} from './intellisense/attributeValueItems'

export function getAttributeValueCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position)
        ) {
          return undefined
        }
        const nsPrefix = getXsdNsPrefix(document, position)
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

          attributeValues(attributeName, startPosition, additionalItems)
        }
        return undefined
      },
    },
    ' ' // triggered whenever a newline is typed
  )
}

export function getTDMLAttributeValueCompletionProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position)
        ) {
          return undefined
        }
        const nsPrefix = getXsdNsPrefix(document, position)
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

          attributeValues(attributeName, startPosition, additionalItems)
        }
        return undefined
      },
    },
    ' ' // triggered whenever a newline is typed
  )
}

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
          endPos = currentText.indexOf(quoteChar[i], currentPos + 1)
          attributeStartPos = textBeforeTrigger.lastIndexOf(' ')
          attributeName = textBeforeTrigger.substring(
            attributeStartPos + 1,
            currentPos - 1
          )
        }
      }
    }

    if (attributeName !== 'none') {
      break
    }
  }
  return [attributeName, currentPos, endPos]
}
