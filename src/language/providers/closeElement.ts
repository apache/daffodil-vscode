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
import { checkMissingCloseTag } from './closeUtils'
import {
  checkBraceOpen,
  cursorAfterEquals,
  cursorWithinBraces,
  cursorWithinQuotes,
} from './utils'
import {
  getNsPrefix,
  insertSnippet,
  isInXPath,
  isNotTriggerChar,
  getItemsOnLineCount,
  getItemPrefix,
} from './utils'

/**
 * Registers a completion provider for the 'dfdl' language that triggers when the user types a '>' character.
 * This provider auto-completes element closing tags and structures, differentiating from closeElementSlash.ts which triggers on '/'.
 *
 * **Trigger Behavior:** When '>' is typed, it replaces it with:
 * - `></tag>` for simple elements
 * - `>\n\t$0\n</tag>` for container elements with proper indentation
 * - Special handling for multi-tag lines and schema elements
 *
 */
export function getCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      /**
       * Provides completion items when '>' is typed in a DFDL document.
       * Implements context-aware snippet insertion with support for progressive completion.
       *
       * **Guard Clauses:** Returns early if cursor is in XPath, quotes, braces, after equals, or '>' isn't the trigger char.
       * This prevents unwanted completions in inappropriate contexts.
       *
       * **Snippet Strategy:** Uses tab-stop patterns:
       * - `$0` = Final cursor position
       * - `$1` = First tab stop (between opening/closing tags for content)
       * - `\n\t$0\n` = Newline with indentation for container elements
       *
       * **Special Patterns:**
       * - `>>` trigger: User wants inline completion without extra whitespace
       * - `.=>` trigger: Alternative pattern for special cases
       * - `schema` tag: Gets unique multi-line formatting with proper indentation
       *
       * **Back Position Logic:**
       * - `backpos`: Position of the '>' character itself (character - 1)
       * - `backpos3`: Position 3 characters back (character - 3) for detecting '>>' or '.=>'
       * These positions are used to determine range deletion before snippet insertion.
       */
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Define the expected trigger character for validation
        let triggerChar = '>'

        // **GUARD CLAUSES**: Prevent completion in inappropriate contexts
        // Similar to closeElementSlash.ts - ensures we don't interfere with XPath, quoted values, etc.
        if (
          checkBraceOpen(document, position) || // Inside unclosed braces {}
          cursorWithinBraces(document, position) || // Cursor positioned within braces
          cursorWithinQuotes(document, position) || // Inside quoted attribute values
          cursorAfterEquals(document, position) || // Immediately after an equals sign
          isInXPath(document, position) || // Within an XPath expression
          isNotTriggerChar(document, position, triggerChar) // Verify '>' is the trigger char
        ) {
          return undefined // Don't provide completion
        }

        // Initialize back positions for potential character removal
        // backpos: position of the '>' character (will be adjusted to char - 1)
        // backpos3: position 3 characters back (for detecting '>>' or '.=>' patterns)
        let backpos = position.with(position.line, position.character)
        let backpos3 = position.with(position.line, position.character)

        // Adjust backpos to point to the character just before '>'
        if (position.character > 0) {
          backpos = position.with(position.line, position.character - 1)
        }

        // Allow checking 3 characters back to detect special patterns
        if (position.character > 2) {
          backpos3 = position.with(position.line, position.character - 3)
        }

        // Get and preserve the namespace prefix (e.g., 'xs:', 'dfdl:', or empty)
        let nsPrefix = getNsPrefix(document, position)
        const origPrefix = nsPrefix

        // **CORE LOGIC**: Find the nearest unclosed tag that needs completion
        // Returns 'none' if all tags are properly closed or self-closing
        const nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )

        // Adjust namespace prefix based on the specific tag type found
        // Some tags always use 'dfdl:' prefix regardless of context
        nsPrefix = getItemPrefix(nearestTagNotClosed, origPrefix)

        // Get text from line start to cursor position for analysis
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)

        // Count how many XML items exist on the current line (important for multi-tag scenarios)
        let itemsOnLine = getItemsOnLineCount(triggerText)

        // If no tags need closing, don't provide completion
        if (nearestTagNotClosed.includes('none')) {
          return undefined
        }

        // Initialize range for potential character deletion (to be updated based on trigger)
        let range = new vscode.Range(position, position)

        // **MAIN TRIGGER CONDITIONS**: Determine what action to take based on trigger pattern
        // Three scenarios activate completion:
        // 1. Single '>' on lines with < 2 items --> standard multi-line completion
        // 2. '>>' on lines with > 1 items --> inline completion without whitespace
        // 3. '.=>' on empty lines --> special case completion
        if (
          (triggerText.endsWith('>') && itemsOnLine < 2) ||
          (triggerText.endsWith('>>') && itemsOnLine > 1) ||
          (triggerText.endsWith('.=>') && itemsOnLine === 0)
        ) {
          // Set range to delete the trigger character(s) before inserting snippet
          // This prevents duplication (e.g., inserting ">" when user already typed it)
          range = new vscode.Range(backpos, position)

          // Perform the deletion of trigger character(s)
          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })

          // **DELEGATE**: Complex insertion logic handled by checkItemsOnLine
          // This function decides the exact snippet based on context
          checkItemsOnLine(
            document,
            position,
            range,
            itemsOnLine,
            triggerText,
            nsPrefix,
            nearestTagNotClosed,
            backpos,
            backpos3
          )
        }

        // Return undefined since completions are handled via direct snippet insertion, not suggestions list
        return undefined
      },
    },
    '>' // Register provider to trigger whenever a '>' is typed
  )
}

/**
 * Registers a completion provider for TDML files
 * Nearly identical to DFDL provider but without the `isNotTriggerChar` validation
 * TDML has simpler requirements and doesn't need as strict trigger validation
 */
export function getTDMLCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'tdml',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // **GUARD CLAUSES**: Same as DFDL but without trigger char validation
        // TDML completion is slightly more permissive
        if (
          checkBraceOpen(document, position) ||
          cursorWithinBraces(document, position) ||
          cursorWithinQuotes(document, position) ||
          cursorAfterEquals(document, position) ||
          isInXPath(document, position)
        ) {
          return undefined
        }

        // Same back position logic as DFDL provider
        let backpos = position.with(position.line, position.character)
        let backpos3 = position.with(position.line, position.character)

        if (position.character > 0) {
          backpos = position.with(position.line, position.character - 1)
        }

        if (position.character > 2) {
          backpos3 = position.with(position.line, position.character - 3)
        }

        // Namespace and tag detection (same logic as DFDL provider)
        let nsPrefix = getNsPrefix(document, position)
        const origPrefix = nsPrefix

        const nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )
        nsPrefix = getItemPrefix(nearestTagNotClosed, origPrefix)
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)

        let itemsOnLine = getItemsOnLineCount(triggerText)

        // If no unclosed tags found, return early
        if (nearestTagNotClosed.includes('none')) {
          return undefined
        }

        let range = new vscode.Range(position, position)

        // **SAME TRIGGER LOGIC**: Multi-tag lines use '>>', single-tag lines use '>'
        // '.=>' pattern also supported for empty lines
        if (
          (triggerText.endsWith('>') && itemsOnLine < 2) ||
          (triggerText.endsWith('>>') && itemsOnLine > 1) ||
          (triggerText.endsWith('.=>') && itemsOnLine === 0)
        ) {
          // Set range to delete the trigger character(s)
          range = new vscode.Range(backpos, position)

          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })

          // Delegate to shared insertion logic
          checkItemsOnLine(
            document,
            position,
            range,
            itemsOnLine,
            triggerText,
            nsPrefix,
            nearestTagNotClosed,
            backpos,
            backpos3
          )
        }
        //return undefined  // Commented out but left in original code
      },
    },
    '>' // Register provider to trigger on '>'
  )
}

/**
 * Core logic determining what snippet to insert when '>' is typed
 * Handles three distinct scenarios based on items on the current line:
 * - 0 items: Likely at document root level (e.g., closing schema tag)
 * - 1 item: Standard element completion with proper formatting
 * - >1 items: Complex multi-tag line requiring careful parsing
 *
 * **Snippet Strategy Variations:**
 * - Container elements (schema, variables) get multi-line snippets with indentation
 * - Special tags (assert, discriminator) get inline snippets with tab stops for expressions
 * - Multi-tag lines get compact closing tags without extra whitespace
 * - '>>' trigger means user wants inline completion without formatting
 * - Standard '>' trigger means user wants properly formatted multi-line completion
 */
function checkItemsOnLine(
  document: vscode.TextDocument,
  position: vscode.Position,
  range: vscode.Range,
  itemsOnLine: number,
  triggerText: string,
  nsPrefix: string,
  nearestTagNotClosed: string,
  backpos: vscode.Position,
  backpos3: vscode.Position
) {
  // **CASE 0: No items on line** - Likely at root level (e.g., schema element)
  // Only proceed if no closing tags already present
  if (
    itemsOnLine == 0 &&
    !triggerText.includes('</') &&
    !triggerText.includes('/>')
  ) {
    // Check if it's just a lone '>' character without any tag context
    if (triggerText.trim() === '>') {
      // Simple case: just insert the closing tag
      insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>', backpos)
    } else {
      // **SPECIAL: Schema tag gets unique multi-line treatment with proper XML formatting**
      switch (nearestTagNotClosed) {
        case 'schema':
          // '>>' triggers schema with extra indentation level for child elements
          if (triggerText.endsWith('>>')) {
            insertSnippet(
              '\n\t$0\n</' + nsPrefix + nearestTagNotClosed + '>',
              backpos
            )
          } else {
            // Standard schema completion with proper XML document structure
            insertSnippet(
              '>\n\t$0\n</' + nsPrefix + nearestTagNotClosed + '>',
              backpos
            )
          }
          break
        default:
          // **PATTERN RECOGNITION: '>>' means user wants inline completion**
          // Single '>' means user wants multi-line completion with proper indentation
          if (triggerText.endsWith('>>')) {
            insertSnippet(
              '</' + nsPrefix + nearestTagNotClosed + '>$0',
              backpos
            )
          } else {
            insertSnippet(
              '>$1</' + nsPrefix + nearestTagNotClosed + '>',
              backpos
            )
          }
          break
      }
    }
  }

  // **CASE 1: Single item on line** - Standard element completion with proper formatting
  if (
    itemsOnLine === 1 &&
    !triggerText.includes('</') &&
    !triggerText.includes('/>')
  ) {
    // Delegate to specialized function for single-item scenarios
    checkNearestTagNotClosed(
      document,
      position,
      range,
      nearestTagNotClosed,
      backpos,
      nsPrefix
    )
  }

  // **CASE 2: Multiple items on line** - Complex parsing required to avoid breaking existing structure
  if (itemsOnLine > 1) {
    checkTriggerText(triggerText, nsPrefix, backpos, nearestTagNotClosed)
  }
}

/**
 * Handles element completion for single-item lines
 * Provides tag-specific snippet patterns based on DFDL conventions:
 * - Variable tags (defineVariable, setVariable): Multi-line with newlines for readability
 * - Assertion tags (assert, discriminator): Inline snippets with tab stops for test expressions
 * - Default case: Multi-line container format with indentation for child elements
 */
function checkNearestTagNotClosed(
  document: vscode.TextDocument,
  position: vscode.Position,
  range: vscode.Range,
  nearestTagNotClosed: string,
  backpos: vscode.Position,
  nsPrefix: string
) {
  const triggerText = document.lineAt(position.line).text

  // **TAG-SPECIFIC LOGIC**: Different tags have different formatting conventions in DFDL
  switch (nearestTagNotClosed) {
    // Variable-related tags typically span multiple lines with attributes
    case 'defineVariable':
    case 'setVariable':
      insertSnippet('>\n</' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      break

    // Assertion tags are usually inline with test expressions between tags
    case 'assert':
    case 'discriminator':
      if (triggerText.endsWith('>')) {
        // If '>' already exists from user typing, just add closing tag with tab stop
        insertSnippet('$1</' + nsPrefix + nearestTagNotClosed + '>', backpos)
      } else {
        // Otherwise add both opening and closing tags with tab stops
        insertSnippet('>$1</' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      }
      break

    // **DEFAULT CASE**: Most container tags get multi-line format with proper indentation
    default:
      if (triggerText.trim() === '') {
        // Empty line: just insert the closing tag
        insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>', backpos)
      } else {
        // Has opening tag: create container with newline and indentation for children
        insertSnippet(
          '>\n\t$0\n</' + nsPrefix + nearestTagNotClosed + '>',
          backpos
        )
      }
      break
  }
}

/**
 * Handles element completion for multi-tag lines (itemsOnLine > 1)
 * Carefully inspects the line to determine if a closing tag already exists
 * Only inserts closing tag if one doesn't already exist to avoid duplication
 * Supports both standard (></tag) and inline (>>) completion patterns
 */
function checkTriggerText(
  triggerText: string,
  nsPrefix: string,
  backpos: vscode.Position,
  nearestTagNotClosed: string
) {
  // Verify the specific tag we're trying to close actually exists on this line
  if (triggerText.includes('<' + nsPrefix + nearestTagNotClosed)) {
    let tagPos = triggerText.lastIndexOf('<' + nsPrefix + nearestTagNotClosed)
    let tagEndPos = triggerText.indexOf('>', tagPos)

    // **CONDITIONS FOR INSERTION**:
    // 1. Tag exists on line, AND
    // 2. It's not self-closing (no '/>'), AND
    // 3. No closing tag already exists for it
    // This prevents duplicate closing tags on multi-tag lines
    if (
      tagPos != -1 &&
      !triggerText.substring(tagEndPos - 1, 2).includes('/>') &&
      !triggerText
        .substring(tagEndPos)
        .includes('</' + nsPrefix + nearestTagNotClosed)
    ) {
      // '>>' trigger: User already typed ">" so just add closing tag inline
      if (triggerText.endsWith('>>')) {
        insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      } else {
        // Standard: Add ">" + closing tag
        insertSnippet('></' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      }
    }
  }
}
