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
import { getItemsOnLineCount, getItemPrefix, getItems } from './utils'

export function checkMissingCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string
) {
  const triggerLine = position.line
  const triggerPos = position.character
  const triggerText = document.lineAt(triggerLine).text
  const itemsOnLine = getItemsOnLineCount(triggerText)
  const origPrefix = nsPrefix

  const items = getItems()
  for (let i = 0; i < items.length; ++i) {
    const textBeforeTrigger = triggerText.substring(0, triggerPos)

    nsPrefix = getItemPrefix(items[i], origPrefix)

    if (itemsOnLine > 1) {
      if (textBeforeTrigger.lastIndexOf('<' + nsPrefix + items[i]) > -1) {
        let gt1res = getItemsForLineGT1(
          triggerText,
          triggerPos,
          nsPrefix,
          items,
          i
        )

        if (gt1res != undefined) {
          return gt1res
        }
      }
    }

    if (itemsOnLine < 2) {
      let lt2res = getItemsForLineLT2(
        document,
        triggerText,
        triggerLine,
        nsPrefix,
        items,
        i
      )

      if (lt2res != undefined) {
        return lt2res
      }
    }
  }

  return 'none'
}

export function getCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  tag: string,
  startLine: number,
  startPos: number
): [string, number, number] {
  let lineNum = startLine
  let tagOpen = startPos
  const triggerLine = position.line
  const triggerPos = position.character
  const triggerText = document.lineAt(startLine).text
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  let endPos = triggerText.lastIndexOf('>')
  nsPrefix = getItemPrefix(tag, nsPrefix)

  if (itemsOnLine > 1 && startPos < endPos) {
    while (tagOpen > -1 && tagOpen <= triggerPos) {
      tagOpen = triggerText.indexOf('<', tagOpen)
      let tagClose = triggerText.indexOf('>', tagOpen)
      let tagPart = triggerText.substring(tagOpen, tagClose)

      if (
        tagPart.includes(tag) &&
        (tagPart.includes('</') || tagPart.includes('/>'))
      ) {
        return [tag, startLine, tagOpen]
      }

      tagOpen = tagClose + 1
    }
  } else {
    let endPos = triggerText.indexOf('>', startPos)

    if (
      (triggerText.includes('</') || triggerText.includes('/>')) &&
      triggerText.includes(tag) &&
      endPos > -1 &&
      itemsOnLine < 2
    ) {
      return [tag, startLine, startPos]
    }

    while (lineNum > -1 && lineNum < document.lineCount) {
      let currentText = document.lineAt(lineNum).text
      startPos = currentText.indexOf('<')

      if (getItemsOnLineCount(currentText) < 2) {
        //skip lines until the close tag for this item
        if (
          currentText.includes('<' + nsPrefix + tag) &&
          (currentText.includes('>') || tag === 'schema') &&
          !currentText.includes('/>')
        ) {
          //skipping to closing tag
          while (!currentText.includes('</' + nsPrefix + tag)) {
            currentText = document.lineAt(++lineNum).text
            if (getItemsOnLineCount(currentText) > 1) {
              currentText = document.lineAt(++lineNum).text
            }
          }
        }

        if (currentText.includes('</' + nsPrefix + tag)) {
          //if the cursor is after the closing tag
          if (
            lineNum == triggerLine &&
            currentText.indexOf('>', triggerPos) === -1
          ) {
            return ['none', lineNum, startPos]
          }
          return [tag, lineNum, startPos]
        }
      }

      ++lineNum
    }
  }

  return ['none', 0, 0]
}

export function getItemsForLineGT1(
  triggerText: string,
  triggerPos: number,
  nsPrefix: string,
  items: string[],
  i: number
) {
  let openTagArray: number[] = []
  let closeTagArray: number[] = []
  let [nextCloseCharPos, nextOpenTagPos] = [0, 0, 0]

  while (
    (nextOpenTagPos = triggerText.indexOf(
      '<' + nsPrefix + items[i],
      nextOpenTagPos
    )) > -1
  ) {
    openTagArray.push(nextOpenTagPos)

    if ((nextCloseCharPos = triggerText.indexOf('>', nextOpenTagPos)) > -1) {
      //if tag is self closing remove it from the openTagArray
      if (
        triggerText.substring(nextCloseCharPos - 1, nextCloseCharPos + 1) ===
        '/>'
      ) {
        openTagArray.splice(-1, 1)
      }

      nextOpenTagPos = nextOpenTagPos + 1
    }
  }

  while (
    (nextCloseCharPos = triggerText.indexOf(
      '</' + nsPrefix + items[i],
      nextCloseCharPos
    )) > -1
  ) {
    closeTagArray.push(nextCloseCharPos)
    nextCloseCharPos = nextCloseCharPos + 1
  }

  if (openTagArray.length > closeTagArray.length) {
    return items[i]
  }

  return undefined
}

export function getItemsForLineLT2(
  document: vscode.TextDocument,
  triggerText: string,
  triggerLine: number,
  nsPrefix: string,
  items: string[],
  i: number
) {
  let [currentText, currentLine] = [triggerText, triggerLine]
  let [lineBefore, lineAfter] = [triggerLine, triggerLine]
  let openTagArray: number[] = []
  let closeTagArray: number[] = []

  while (
    currentText.indexOf('<' + nsPrefix + items[i]) === -1 &&
    currentLine > -1
  ) {
    --currentLine

    if (currentLine > -1) {
      currentText = document.lineAt(currentLine).text
    }

    if (getItemsOnLineCount(currentText) > 1) {
      --currentLine
    }
  }

  if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
    while (lineBefore > -1) {
      currentText = document.lineAt(lineBefore).text
      if (getItemsOnLineCount(currentText) < 2) {
        if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
          openTagArray.push(lineBefore)

          //if selfclosing remove from the array
          if (currentText.indexOf('/>') > -1) {
            openTagArray.splice(openTagArray.length - 1, 1)
          }
        }

        if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
          closeTagArray.push(lineBefore)
        }
      }

      --lineBefore
    }

    ++lineAfter

    while (lineAfter < document.lineCount) {
      currentText = document.lineAt(lineAfter).text

      if (getItemsOnLineCount(currentText) < 2) {
        if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
          openTagArray.push(lineAfter)

          //if selfclosing remove from the array
          if (currentText.indexOf('/>') > -1) {
            openTagArray.splice(openTagArray.length - 1, 1)
          }
        }

        if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
          closeTagArray.push(lineAfter)
        }
      }

      ++lineAfter
    }

    if (openTagArray.length > closeTagArray.length) {
      return items[i]
    }
  }

  return undefined
}
