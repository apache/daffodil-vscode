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
import { commonCompletion } from './intellisense/commonItems'
import { isXPath } from '../semantics/dfdlExt'
import { xml2js } from 'xml-js'

const schemaPrefixRegEx = new RegExp('</?(|[^ ]+:)schema')

//List of high level dfdl element items
const items = [
  'element',
  'sequence',
  'choice',
  'group',
  'simpleType',
  'complexType',
  'annotation',
  'appinfo',
  'assert',
  'discriminator',
  'defineFormat',
  'format',
  'newVariableInstance',
  'defineVariable',
  'setVariable',
  'defineEscapeScheme',
  'escapeScheme',
  'dfdl:element',
  'dfdl:sequence',
  'dfdl:simpleType',
  'restriction',
  'schema',
  'xml version',
  'include',
  'import',
]

export class XmlItem {
  private _itemName: string = 'none'
  private _itemNS: string = 'none'
  private _itemAttributes: string[] = []

  public get itemName() {
    return this._itemName
  }

  public set itemName(name: string) {
    this._itemName = name
  }

  public get itemNS() {
    return this._itemNS
  }

  public set itemNS(nameSpace: string) {
    this._itemNS = nameSpace
  }

  public set itemAttributes(attributeNames: string[]) {
    this._itemAttributes = attributeNames
  }

  public get itemAttributes() {
    return this._itemAttributes
  }
}

export function getItems() {
  return items
}

export function getSchemaNsPrefix(document: vscode.TextDocument) {
  const pos = new vscode.Position(0, 0)
  return getNsPrefix(document, pos)
}

// default namespace in the event that a namespace was not found
export const defaultXsdNsPrefix = ''

// dfdl namespace for dfdl format element in non dfdl tags
export const dfdlDefaultPrefix = 'dfdl:'

// Function to insert snippet to active editor
export function insertSnippet(snippetString: string, backpos: vscode.Position) {
  vscode.window.activeTextEditor?.insertSnippet(
    new vscode.SnippetString(snippetString),
    backpos
  )
}

export function lineCount(
  document: vscode.TextDocument,
  position: vscode.Position,
  tag: string
) {
  let lineNum = position.line
  let lineCount = 0
  let nsPrefix = getNsPrefix(document, position)

  while (lineNum !== 0) {
    --lineNum
    ++lineCount

    const triggerText = document.lineAt(lineNum).text

    if (
      triggerText.includes('<' + nsPrefix + tag) &&
      !triggerText.includes('</' + nsPrefix + tag) &&
      !triggerText.includes('/>')
    ) {
      return lineCount
    }
  }
  return lineCount
}

export function nearestOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let xmlItem = new XmlItem()
  if (document.lineCount === 1 && position.character === 0) {
    return xmlItem
  }
  const nsPrefix = getNsPrefix(document, position)

  for (let i = 0; i < items.length; ++i) {
    let [isTagOpen, isDfdlNs, attributeNames] = checkTagOpen(
      document,
      position,
      nsPrefix,
      items[i]
    )
    if (isTagOpen) {
      if (isDfdlNs) {
        xmlItem.itemNS = 'dfdl:'
      } else {
        xmlItem.itemNS = nsPrefix
      }
      xmlItem.itemName = items[i]
      xmlItem.itemAttributes = attributeNames
      return xmlItem
    }
  }
  return xmlItem
}

export function nearestTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  startLine: number,
  startPos: number
): [string, number, number] {
  const triggerLine = position.line
  let lineNum = startLine
  const triggerText = document.lineAt(triggerLine).text
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  let tagPos = triggerText.indexOf('<')
  let endPos = triggerText.lastIndexOf('>')

  if (
    itemsOnLine > 1 &&
    startPos !== tagPos &&
    startPos < endPos &&
    endPos != startPos
  ) {
    let textBeforeTrigger = triggerText.substring(0, startPos)
    let prevTagPos = 0

    while (prevTagPos > -1) {
      prevTagPos = textBeforeTrigger.lastIndexOf('<')
      let tag = textBeforeTrigger.substring(prevTagPos)

      if (
        !textBeforeTrigger.includes('</') &&
        !textBeforeTrigger.includes('/>')
      ) {
        for (let i = 0; i < items.length; ++i) {
          if (tag.includes('<' + nsPrefix + items[i])) {
            return [items[i], startLine, prevTagPos]
          }
        }
      }
      textBeforeTrigger = textBeforeTrigger.substring(0, prevTagPos)
    }
  } else {
    if (
      startLine === triggerLine &&
      (tagPos === startPos || triggerText.trim() === '')
    ) {
      --lineNum
    }

    while (lineNum > -1 && lineNum < document.lineCount) {
      let currentText = document.lineAt(lineNum).text

      if (getItemsOnLineCount(currentText) < 2) {
        if (!currentText.includes('/>')) {
          for (let i = 0; i < items.length; ++i) {
            nsPrefix = getNsPrefix(document, position)

            if (
              !currentText.includes('</') &&
              (currentText.includes('<' + nsPrefix + items[i]) ||
                (lineNum === 0 && currentText.includes(items[i])))
            ) {
              tagPos = currentText.lastIndexOf('<')
              return [items[i], lineNum, tagPos]
            }
            if (
              currentText.includes('<' + nsPrefix + items[i]) &&
              currentText.includes('</' + nsPrefix + items[i]) &&
              position.character > currentText.indexOf('>') &&
              position.character <= currentText.indexOf('</')
            ) {
              tagPos = currentText.lastIndexOf('<')
              return [items[i], lineNum, tagPos]
            }
          }
        }
      }
      --lineNum
    }
  }
  return ['none', 0, 0]
}

export function checkTagOpen(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  tag: string
): [boolean, boolean, string[]] {
  let triggerLine = position.line
  let triggerText = document.lineAt(triggerLine).text
  let itemsOnLine = getItemsOnLineCount(triggerText)
  let isMultiLineTag = false
  let isDfdlPrefix = false
  let origTriggerLine = triggerLine
  let compareText = triggerText
  let compareLine = triggerLine
  let attributeNames: string[] = []
  const triggerPos = position.character

  while (itemsOnLine < 2 && !triggerText.trim().startsWith('<')) {
    triggerText = document.lineAt(--triggerLine).text
  }

  let tagPos = triggerText.lastIndexOf('<' + nsPrefix + tag)

  if (tagPos < 0) {
    tagPos = triggerText.lastIndexOf('<dfdl:' + tag)
    if (tagPos > 0) {
      isDfdlPrefix = true
      nsPrefix = 'dfdl:'
    }
  }

  // If there is one or less xml tags on the line and the beginning of the line
  // contains the start tag and there is not an ending tag character after the
  // start tag assume it is a multi-line tag
  if (
    itemsOnLine < 2 &&
    triggerText.trim().startsWith('<' + nsPrefix + tag) &&
    triggerText.indexOf('>', tagPos) < 0 //if tag ending character is missing will return -1
  ) {
    isMultiLineTag = true
  }

  if (!isMultiLineTag) {
    const nextTagPos = triggerText.indexOf('<', tagPos + 1)
    let tagEndPos = triggerText.indexOf('>', tagPos)

    if (tagPos > -1 && itemsOnLine > 1) {
      if (
        triggerPos > tagPos &&
        ((triggerPos <= tagEndPos &&
          (nextTagPos > tagEndPos || nextTagPos === -1)) ||
          tagEndPos === -1)
      ) {
        attributeNames = getAttributeNames(document, position, nsPrefix, tag)
        return [true, isDfdlPrefix, attributeNames]
      }
    }

    while (compareText.trim() === '') {
      compareText = document.lineAt(--compareLine).text
    }
    tagPos = triggerText.indexOf('<' + nsPrefix + tag)
    if (tagPos < 0) {
      tagPos = triggerText.lastIndexOf('<dfdl:' + tag)
      if (tagPos > 0) {
        isDfdlPrefix = true
        nsPrefix = 'dfdl:'
      }
    }

    if (itemsOnLine < 2 && tagPos > -1) {
      if (triggerText !== compareText) {
        tagEndPos = compareText.indexOf('>')
      }

      if (
        (triggerPos > tagPos &&
          triggerPos <= tagEndPos &&
          triggerLine === position.line) ||
        (compareLine == position.line &&
          triggerPos <= tagEndPos &&
          triggerPos > tagPos) ||
        position.line < origTriggerLine
      ) {
        attributeNames = getAttributeNames(document, position, nsPrefix, tag)
        return [true, isDfdlPrefix, attributeNames]
      }
    }
  }

  if (!isMultiLineTag || tagPos === -1) {
    return [false, isDfdlPrefix, attributeNames]
  }
  //if this tag is part of a multi line set of annotations return true
  //else this tag is not open return false
  return checkMultiLineTag(
    document,
    position,
    itemsOnLine,
    nsPrefix,
    tagPos,
    triggerLine,
    tag
  )
}

export function getItemPrefix(item: string, nsPrefix: string) {
  let itemPrefix = nsPrefix

  if (
    item === 'assert' ||
    item === 'discriminator' ||
    item === 'defineFormat' ||
    item === 'format' ||
    item.includes('Variable') ||
    item.includes('scape')
  ) {
    itemPrefix = 'dfdl:'
  }

  if (item === 'xml version') {
    itemPrefix = '?'
  }

  if (
    item === 'dfdl:element' ||
    item === 'dfdl:sequence' ||
    item === 'dfdl:simpleType' ||
    item === 'dfdl:format'
  ) {
    itemPrefix = ''
  }
  return itemPrefix
}

export function checkMultiLineTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  itemsOnLine: number,
  nsPrefix: string,
  tagPos: number,
  tagLine: number,
  tag: string,
  isDfdlTag = false
): [boolean, boolean, string[]] {
  if (nsPrefix === 'dfdl:') {
    isDfdlTag = true
  }
  let attributeNames: string[] = []
  if (itemsOnLine > 1) {
    return [false, isDfdlTag, attributeNames]
  }
  let currentLine = position.line
  let openTagLine = position.line
  let closeTagLine = position.line
  let origText = document.lineAt(currentLine).text
  //if the original line is blank get the previous line
  while (origText.trim() === '') {
    origText = document.lineAt(--currentLine).text
  }
  //If the cursor is after an end tag return false
  if (
    (position.character > origText.indexOf('</') ||
      position.line > currentLine) &&
    (origText.includes('</' + nsPrefix + tag) || origText.includes('/>'))
  ) {
    return [false, isDfdlTag, attributeNames]
  }

  let currentText = origText

  //Get the opening tag
  while (
    (currentText.trim() === '' ||
      !currentText.includes('<' + nsPrefix + tag)) &&
    openTagLine > 0
  ) {
    --openTagLine
    currentText = document.lineAt(openTagLine).text
  }

  if (currentText.includes('<' + nsPrefix + tag)) {
    let multiLineText = currentText.trim()
    let closeText = document.lineAt(openTagLine).text

    closeTagLine = openTagLine

    //Get closing tag
    while (
      (closeText.trim() === '' || !closeText.includes('>')) &&
      closeTagLine < document.lineCount
    ) {
      ++closeTagLine
      closeText = document.lineAt(closeTagLine).text
      multiLineText += ' ' + closeText.trim()
    }
    if (closeText.includes('>')) {
      multiLineText += closeText.trim()
    }
    currentText = multiLineText

    if (
      currentText.includes('<' + nsPrefix + tag) &&
      currentText.includes('>')
    ) {
      attributeNames = getAttributeNames(document, position, nsPrefix, tag)
      return [true, isDfdlTag, attributeNames]
    }
  }
  return [false, isDfdlTag, attributeNames]
}

//returns an empty value or a prefix plus a colon
export function getNsPrefix(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let initialLineNum = position.line
  let lineNum = 0

  while (initialLineNum !== 0 && lineNum <= initialLineNum) {
    const lineText = document.lineAt(lineNum).text
    // returns either empty prefix value or a prefix plus a colon
    let text = lineText.match(schemaPrefixRegEx)

    if (text != null) {
      return text[1]
    }
    ++lineNum
  }

  //returns the standard prefix plus a colon in the case of missing schema tag
  return defaultXsdNsPrefix
}

export function getAttributeNames(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  tag: string
): string[] {
  let currentLine = position.line
  let openTagLine = position.line
  let closeTagLine = position.line
  let currentText = document.lineAt(currentLine).text
  let closeText = currentText

  //if mulit-line tag
  if (
    !(
      currentText.trim().startsWith('<' + nsPrefix + tag) &&
      currentText.endsWith('>')
    )
  ) {
    //Get the opening tag
    while (
      (currentText.trim() === '' ||
        !currentText.includes('<' + nsPrefix + tag)) &&
      openTagLine > -1
    ) {
      --openTagLine
      currentText = document.lineAt(openTagLine).text
    }

    let multiLineText = currentText.trim()

    closeTagLine = openTagLine

    //Get closing tag
    closeText = document.lineAt(openTagLine).text
    while (
      (closeText.trim() === '' || !closeText.includes('>')) &&
      closeTagLine < document.lineCount
    ) {
      ++closeTagLine
      closeText = document.lineAt(closeTagLine).text
      multiLineText += ' ' + closeText.trim()
    }
    currentText = multiLineText
  }

  let attributeNames: string[] = []
  const xmljs = xml2js(currentText, {})
  const attributes = xmljs.elements?.[0].attributes
  if (attributes) {
    const attributeSet: Set<string> = new Set(Object.keys(attributes))
    attributeNames = [...attributeSet]
    return attributeNames
  }

  return attributeNames
}

export function getItemsOnLineCount(triggerText: String) {
  let itemsOnLine = 0
  let nextPos = 0
  let result = 0

  if (
    triggerText.includes('schema') &&
    !triggerText.includes('schemaLocation')
  ) {
    itemsOnLine = 1
    return itemsOnLine
  }

  while (result != -1 && triggerText.includes('<')) {
    result = triggerText.indexOf('<', nextPos)
    if (result > -1) {
      let endPos = triggerText.indexOf('>', nextPos)
      if (endPos === -1) {
        ++itemsOnLine
        break
      }
      let testForCloseTag = triggerText.substring(nextPos, endPos)

      if (
        !testForCloseTag.includes('</') &&
        !testForCloseTag.includes('<!--') &&
        !testForCloseTag.includes('-->') &&
        !testForCloseTag.includes('<[') &&
        !testForCloseTag.includes('<![')
      ) {
        ++itemsOnLine
      }
      result = nextPos
      nextPos = endPos + 1
    }
  }
  return itemsOnLine
}

//Determines if the current curser is in XPath and dfdl intellisense should be turned off
export function isInXPath(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  return isXPath(position)
}

export function isNotTriggerChar(
  document: vscode.TextDocument,
  position: vscode.Position,
  triggerChar: string
) {
  const triggerText = document.lineAt(position.line).text
  const triggerPos = position.character
  const trigChar = triggerText.substring(triggerPos - 1, triggerPos)
  if (trigChar != triggerChar) {
    return true
  } else {
    return false
  }
}

export function isTagEndTrigger(trigChar: string | undefined) {
  if (trigChar == '/' || trigChar == '>') {
    return true
  } else {
    return false
  }
}

export function cursorAfterEquals(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const triggerText = document.lineAt(position.line).text
  const triggerPos = position.character
  const textBeforeTrigger = triggerText.substring(0, triggerPos)
  let currentPos = -1

  if ((currentPos = textBeforeTrigger.lastIndexOf('=')) === -1) {
    return false
  }
  if (triggerPos === currentPos + 1) {
    return true
  }
  return false
}

export function cursorWithinQuotes(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const quoteChar: string[] = ["'", '"']
  let startLine = position.line

  for (let i = 0; i < quoteChar.length; ++i) {
    let currentText = document.lineAt(startLine).text

    if (
      currentText.includes('<') &&
      !currentText.includes("'") &&
      !currentText.includes('"')
    ) {
      return false
    }

    if (currentText.includes(quoteChar[i])) {
      let textBeforeTrigger = currentText.substring(0, position.character)

      if (
        currentText.indexOf('=' + quoteChar[i]) > position.character &&
        textBeforeTrigger.trim() == ''
      ) {
        return false
      }

      let quoteStartLine = startLine
      let quoteStartPos = -1
      let equalStartPos = -1

      while (
        (equalStartPos = textBeforeTrigger.lastIndexOf('=' + quoteChar[i])) ===
        -1
      ) {
        if (textBeforeTrigger.indexOf('<') !== -1) {
          break
        }
        textBeforeTrigger = document.lineAt(--quoteStartLine).text
      }

      quoteStartPos = equalStartPos + 1
      let quoteEndLine = quoteStartLine
      let quoteEndPos = -1

      if (quoteStartPos > -1) {
        while (
          quoteEndLine < document.lineCount &&
          (quoteEndPos = currentText.indexOf(
            quoteChar[i],
            quoteStartPos + 1
          )) === -1
        ) {
          currentText = document.lineAt(++quoteEndLine).text
        }

        if (
          quoteEndPos > -1 &&
          currentText.indexOf('=', quoteStartPos - 1) === quoteStartPos - 1
        ) {
          if (
            (position.line > quoteStartLine && position.line < quoteEndLine) ||
            (quoteEndLine === quoteStartLine &&
              position.character > quoteStartPos &&
              position.character <= quoteEndPos) ||
            (position.line === quoteStartLine &&
              position.character > quoteStartPos &&
              position.line < quoteEndLine) ||
            (position.line === quoteEndLine &&
              position.character <= quoteEndPos &&
              position.line > quoteStartLine)
          ) {
            return true
          }
        }
      }
    }
  }
  return false
}

export function cursorWithinBraces(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let startLine = position.line
  let currentText = document.lineAt(startLine).text
  let braceStartLine = startLine
  let braceStartPos = -1

  while (
    braceStartLine > 0 &&
    (braceStartPos = currentText.indexOf('{')) === -1
  ) {
    currentText = document.lineAt(--braceStartLine).text
  }
  let braceEndLine = braceStartLine
  let braceEndPos = -1

  if (braceStartPos > -1) {
    while (
      braceEndLine < document.lineCount &&
      (braceEndPos = currentText.indexOf('}')) === -1
    ) {
      currentText = document.lineAt(++braceEndLine).text
    }

    if (braceEndPos > -1) {
      if (
        (position.line > braceStartLine && position.line < braceEndLine) ||
        (braceEndLine === braceStartLine &&
          position.character > braceStartPos &&
          position.character <= braceEndPos) ||
        (position.line === braceStartLine &&
          position.character > braceStartPos &&
          position.line < braceEndLine) ||
        (position.line === braceEndLine &&
          position.character <= braceEndPos &&
          position.line > braceStartLine)
      ) {
        return true
      }
    }
  }
  return false
}

export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let lineNum = position.line
  let triggerText = document.lineAt(lineNum).text

  if (triggerText.includes('{')) {
    while (!triggerText.includes('}') && lineNum < document.lineCount) {
      triggerText = document.lineAt(++lineNum).text
    }

    if (!triggerText.includes('}')) {
      return true
    }
  }

  if (triggerText.includes('}')) {
    while (!triggerText.includes('{') && lineNum > 0) {
      triggerText = document.lineAt(--lineNum).text
    }

    if (!triggerText.includes('{')) {
      return true
    }
  }
  return false
}

export function createCompletionItem(
  e:
    | {
        item: string
        snippetString: string
        markdownString: string
      }
    | {
        item: string
        snippetString: string
        markdownString: undefined
      },
  preVal: string,
  nsPrefix: string
) {
  const completionItem = new vscode.CompletionItem(e.item)

  const noPreVals = [
    'dfdl:choiceBranchKey=',
    'dfdl:representation',
    'dfdl:choiceDispatchKey=',
    'dfdl:simpleType',
    'dfdl:element',
    'restriction',
  ]

  if (preVal !== '' && !noPreVals.includes(e.item)) {
    completionItem.insertText = new vscode.SnippetString(
      preVal + e.snippetString
    )
  } else {
    completionItem.insertText = new vscode.SnippetString(e.snippetString)
  }

  if (e.markdownString) {
    completionItem.documentation = new vscode.MarkdownString(e.markdownString)
  }

  return completionItem
}

export function getCommonItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = '',
  nsPrefix: string
) {
  let compItems: vscode.CompletionItem[] = []

  commonCompletion(additionalItems).items.forEach((e) => {
    if (itemsToUse.includes(e.item)) {
      const completionItem = createCompletionItem(e, preVal, nsPrefix)
      compItems.push(completionItem)
    }
  })

  return compItems
}
