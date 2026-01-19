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

/**
 * Main function to determine if there's an unclosed XML/DFDL tag at the cursor position.
 * This is the core logic that drives the auto-completion behavior in closeElementSlash.ts.
 * It scans the document to find the nearest tag that has been opened but not closed.
 *
 * @param document - The active text document
 * @param position - The current cursor position
 * @param nsPrefix - The XML namespace prefix (e.g., 'xs:', 'dfdl:', or empty string)
 * @returns string - The name of the unclosed tag, or 'none' if all tags are closed
 */
export function checkMissingCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string
) {
  // Extract context about the current line
  const triggerLine = position.line
  const triggerPos = position.character
  const triggerText = document.lineAt(triggerLine).text
  const itemsOnLine = getItemsOnLineCount(triggerText)
  const origPrefix = nsPrefix // Preserve original prefix for reference

  // Get the list of all DFDL/XML items/tags defined in the extension
  const items = getItems()

  // Iterate through all possible tag types to find any unclosed instances
  for (let i = 0; i < items.length; ++i) {
    // Get text before cursor to analyze incomplete tags
    const textBeforeTrigger = triggerText.substring(0, triggerPos)

    // Adjust namespace prefix based on tag type (some tags force 'dfdl:' prefix)
    nsPrefix = getItemPrefix(items[i], origPrefix)

    // Find the last occurrence of this specific tag before the cursor
    let tagPos = triggerText.lastIndexOf('<' + nsPrefix + items[i])

    // Fallback: if not found with current prefix, try 'dfdl:' prefix
    if (tagPos < 0) {
      tagPos = triggerText.lastIndexOf('<dfdl:' + items[i])
      if (tagPos > 0) {
        nsPrefix = 'dfdl:'
      }
    }

    // **BRANCH 1**: Multiple items on the current line
    // This is a complex case requiring careful parsing to determine which tag is active
    if (itemsOnLine > 1) {
      // Check if this tag appears before the cursor position
      if (textBeforeTrigger.lastIndexOf('<' + nsPrefix + items[i]) > -1) {
        // Use specialized logic for multi-tag lines
        let gt1res = getItemsForLineGT1(
          triggerText,
          triggerPos,
          nsPrefix,
          items,
          i
        )

        // If an unclosed tag was found, return it immediately
        if (gt1res != 'none') {
          return gt1res
        }
      }
    }

    // **BRANCH 2**: Single item (or zero) on the current line
    // This is simpler - scan upwards through the document
    if (itemsOnLine < 2) {
      let lt2res = getItemsForLineLT2(
        document,
        triggerText,
        triggerLine,
        nsPrefix,
        items,
        i
      )

      // If an unclosed tag was found, return it immediately
      if (lt2res != 'none') {
        return lt2res
      }
    }
  }

  // No unclosed tags found
  return 'none'
}

/**
 * Checks if the cursor is currently positioned inside a closing tag.
 * Used to prevent auto-completion from interfering when manually typing closing tags.
 *
 * @param document - The active text document
 * @param position - The current cursor position
 * @returns boolean - True if cursor is inside a closing tag (between </ and >)
 */
export function cursorInsideCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const triggerText = document.lineAt(position.line).text
  const triggerPos = position.character

  // Find positions of closing tag markers
  const closeTagStart = triggerText.lastIndexOf('</')
  const closeTagEnd = triggerText.lastIndexOf('>')

  // Cursor is inside closing tag if it's after </ but before or at >
  if (
    triggerPos > closeTagStart &&
    triggerPos <= closeTagEnd &&
    closeTagStart !== -1
  ) {
    return true
  }
  return false
}

/**
 * Locates the closing tag for a given tag name and position.
 * Used to find where a tag is closed to understand document structure.
 *
 * @param document - The active text document
 * @param position - The current cursor position
 * @param nsPrefix - The namespace prefix for the tag
 * @param tag - The tag name to find the closing tag for
 * @param startLine - Starting line number for the search
 * @param startPos - Starting character position for the search
 * @returns [string, number, number] - Tuple: [tagName, lineNumber, position] of closing tag, or ['none', 0, 0] if not found
 */
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

  // Adjust prefix based on tag type
  nsPrefix = getItemPrefix(tag, nsPrefix)

  // If cursor is inside a closing tag, return 'none' to avoid interfering
  if (itemsOnLine === 1) {
    if (cursorInsideCloseTag(document, position))
      return ['none', lineNum, startPos]
  }

  // **CASE: Multiple items on line and cursor is inside a tag**
  // Need to parse through the line to find which tag is being closed
  if (itemsOnLine > 1 && startPos < endPos) {
    // Iterate through tags on the line
    while (tagOpen > -1 && tagOpen <= triggerPos) {
      tagOpen = triggerText.indexOf('<', tagOpen)
      let tagClose = triggerText.indexOf('>', tagOpen)
      let tagPart = triggerText.substring(tagOpen, tagClose)

      // Check if this segment is the closing tag we're looking for
      if (
        tagPart.includes(tag) &&
        (tagPart.includes('</') || tagPart.includes('/>'))
      ) {
        return [tag, startLine, tagOpen]
      }

      tagOpen = tagClose + 1
    }
  } else {
    // **CASE: Single item per line - scan through document**
    let nestedTagCount = 0 // Track nesting level for proper tag matching
    let endPos = triggerText.indexOf('>', startPos)

    // Special case: XML declaration tag
    if (triggerText.includes('?xml version')) {
      return [tag, 0, 0]
    }

    // If tag is already closed on this line, return it
    if (
      (triggerText.includes('</') || triggerText.includes('/>')) &&
      triggerText.includes(tag) &&
      endPos > -1 &&
      itemsOnLine < 2
    ) {
      return [tag, startLine, startPos]
    }

    // **MAIN LOOP**: Scan forward through document to find closing tag
    while (lineNum > -1 && lineNum < document.lineCount) {
      let currentText = document.lineAt(lineNum).text
      let isMultiLineTag = false

      // Skip comment blocks to avoid parsing tag-like content in comments
      if (currentText.includes('<!--')) {
        while (!currentText.includes('-->')) {
          currentText = document.lineAt(++lineNum).text
        }
        currentText = document.lineAt(++lineNum).text
      }

      startPos = currentText.indexOf('<')

      // Only process lines with single tags to avoid complexity
      if (getItemsOnLineCount(currentText) < 2) {
        // Skip lines until we find the close tag for this item
        if (
          currentText.includes('<' + nsPrefix + tag) &&
          currentText.endsWith('>')
        ) {
          // Scan forward to find the matching closing tag
          while (!currentText.includes('</' + nsPrefix + tag)) {
            currentText = document.lineAt(++lineNum).text

            // Skip multi-tag lines to maintain context
            if (getItemsOnLineCount(currentText) > 1) {
              currentText = document.lineAt(++lineNum).text
            }

            // Handle nested tags of the same type
            if (currentText.includes('<' + nsPrefix + tag)) {
              ++nestedTagCount
              while (!currentText.includes('>')) {
                currentText = document.lineAt(++lineNum).text
              }
              if (currentText.includes('/>')) {
                --nestedTagCount // Self-closing tags don't affect nesting
              }
            }

            // If we find a closing tag but it's for a nested instance, skip it
            if (
              currentText.includes('</' + nsPrefix + tag) &&
              nestedTagCount > 0
            ) {
              --nestedTagCount
              currentText = ''
            }
          }
        }

        // **MULTI-LINE TAG HANDLING**: Tag spans multiple lines
        if (
          currentText.includes('<' + nsPrefix + tag) &&
          !currentText.includes('>')
        ) {
          isMultiLineTag = true

          // Skip to the end of the opening tag
          while (!currentText.includes('>')) {
            currentText = document.lineAt(++lineNum).text
          }

          // If not self-closing, skip to the closing tag
          if (!currentText.includes('/>')) {
            while (!currentText.includes('</' + nsPrefix + tag)) {
              currentText = document.lineAt(++lineNum).text
            }
          }
        }

        // **FOUND CLOSING TAG**: Return its location
        if (
          (currentText.includes('</' + nsPrefix + tag) &&
            nestedTagCount === 0) ||
          (currentText.includes('/>') && isMultiLineTag)
        ) {
          if (isMultiLineTag) {
            startPos = triggerPos
          }

          // If cursor is after the closing tag, return 'none'
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

/**
 * Handles the complex case of multiple items/tags on a single line.
 * Uses array tracking to determine which tags are opened vs. closed.
 *
 * @param triggerText - The full text of the current line
 * @param triggerPos - The cursor position within the line
 * @param nsPrefix - The namespace prefix
 * @param items - Array of all possible tag names
 * @param i - Index of the current item being checked
 * @returns string - The unclosed tag name, or 'none'
 */
export function getItemsForLineGT1(
  triggerText: string,
  triggerPos: number,
  nsPrefix: string,
  items: string[],
  i: number
) {
  // Track positions of opening and closing tags
  let openTagArray: number[] = []
  let closeTagArray: number[] = []
  let [nextCloseCharPos, nextOpenTagPos] = [0, 0]

  // **FIND ALL OPENING TAGS**: Build array of all opening tag positions
  while (
    (nextOpenTagPos = triggerText.indexOf(
      '<' + nsPrefix + items[i],
      nextOpenTagPos
    )) > -1
  ) {
    openTagArray.push(nextOpenTagPos)

    // Check if self-closing and remove from tracking if so
    if ((nextCloseCharPos = triggerText.indexOf('>', nextOpenTagPos)) > -1) {
      if (
        triggerText.substring(nextCloseCharPos - 1, nextCloseCharPos + 1) ===
        '/>'
      ) {
        openTagArray.splice(-1, 1)
      }

      nextOpenTagPos = nextOpenTagPos + 1
    }
  }

  // **FIND ALL CLOSING TAGS**: Build array of closing tag positions
  while (
    (nextCloseCharPos = triggerText.indexOf(
      '</' + nsPrefix + items[i],
      nextCloseCharPos
    )) > -1
  ) {
    closeTagArray.push(nextCloseCharPos)
    nextCloseCharPos = nextCloseCharPos + 1
  }

  // **DETERMINE STATE**: If more opens than closes, this tag is unclosed
  if (openTagArray.length > closeTagArray.length) {
    return items[i]
  }

  return 'none'
}

/**
 * Handles the simpler case of single items per line or scanning across lines.
 * Looks both backwards and forwards through the document to find matching tags.
 *
 * @param document - The active text document
 * @param triggerText - Text of the current line
 * @param triggerLine - Current line number
 * @param nsPrefix - Namespace prefix
 * @param items - Array of all possible tag names
 * @param i - Current item index
 * @returns string - The unclosed tag name, or 'none'
 */
export function getItemsForLineLT2(
  document: vscode.TextDocument,
  triggerText: string,
  triggerLine: number,
  nsPrefix: string,
  items: string[],
  i: number
) {
  // Initialize tracking variables
  let [currentText, currentLine] = [triggerText, triggerLine]
  let [lineBefore, lineAfter, testLine] = [
    triggerLine,
    triggerLine,
    triggerLine,
  ]
  let openTagArray: number[] = []
  let closeTagArray: number[] = []

  // Adjust prefix based on tag type
  nsPrefix = getItemPrefix(items[i], nsPrefix)

  // **FIND OPENING TAG**: Scan backwards until we find the opening tag
  while (
    currentText.indexOf('<' + nsPrefix + items[i]) === -1 &&
    currentLine > -1
  ) {
    --currentLine

    if (currentLine > -1) {
      currentText = document.lineAt(currentLine).text
    }

    // Skip multi-item lines to avoid confusion
    if (getItemsOnLineCount(currentText) > 1) {
      --currentLine
    }
  }

  // If we found an opening tag, scan the document to check if it's closed
  if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
    // **SCAN BACKWARDS**: Collect all opening/closing tags before current position
    while (lineBefore > -1) {
      currentText = document.lineAt(lineBefore).text

      if (getItemsOnLineCount(currentText) < 2) {
        // Found opening tag
        if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
          openTagArray.push(lineBefore)

          // Handle multi-line tags
          let testText = currentText
          if (!testText.includes('>')) {
            testLine = lineBefore
            while (!testText.includes('>')) {
              testText = document.lineAt(++testLine).text
              if (testText.indexOf('<' + nsPrefix + items[i]) > -1)
                openTagArray.push(testLine)
            }
          }

          // Remove from tracking if self-closing or already closed
          if (
            testText.indexOf('/>') > -1 ||
            testText.includes('xml version') ||
            currentText.indexOf('</' + nsPrefix + items[i]) > -1
          ) {
            openTagArray.splice(openTagArray.length - 1, 1)
          }
        }

        // Found closing tag
        if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
          closeTagArray.push(lineBefore)
        }
      }

      --lineBefore
    }

    // **SCAN FORWARDS**: Collect tags after current position
    ++lineAfter

    while (lineAfter < document.lineCount) {
      currentText = document.lineAt(lineAfter).text

      if (getItemsOnLineCount(currentText) < 2) {
        // Found opening tag
        if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
          openTagArray.push(lineAfter)

          // Handle multi-line opening tags
          while (!currentText.includes('>')) {
            currentText = document.lineAt(++lineAfter).text
          }

          // Remove if self-closing
          if (currentText.indexOf('/>') > -1) {
            openTagArray.splice(openTagArray.length - 1, 1)
          }
        }

        // Found closing tag
        if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
          closeTagArray.push(lineAfter)
        }
      }

      ++lineAfter
    }

    // **DETERMINE STATE**: More openings than closings = tag is unclosed
    if (openTagArray.length > closeTagArray.length) {
      return items[i]
    }
  }

  return 'none'
}
