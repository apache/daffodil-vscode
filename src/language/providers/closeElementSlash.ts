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
  insertSnippet,
  checkBraceOpen,
  isInXPath,
  isNotTriggerChar,
  getNsPrefix,
  getItemPrefix,
  getItemsOnLineCount,
  cursorWithinBraces,
  cursorWithinQuotes,
  cursorAfterEquals,
} from './utils'
/**
 * Creates and returns a completion item provider for the 'dfdl' language
 * that triggers when the user types a forward slash '/' to close XML elements.
 * This handles DFDL schema files (Data Format Description Language).
 *
 * @returns vscode.CompletionItemProvider - A provider that listens for '/' triggers
 */
export function getCloseElementSlashProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      /**
       * Provides completion items when '/' is typed in a DFDL document.
       * Determines whether to insert a self-closing tag "/>" or a full closing tag.
       *
       * @param document - The active text document
       * @param position - The current cursor position where '/' was typed
       * @returns Promise<void> | undefined - Returns undefined or no result; edits are applied directly
       */
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Create position one character back from cursor to capture the trigger point
        let backpos = new vscode.Position(position.line, position.character - 1)

        // Get the namespace prefix (e.g., 'xs:', 'dfdl:', or empty string)
        let nsPrefix = getNsPrefix(document, position)

        // Get the full line text where the trigger occurred
        let triggerText = document.lineAt(position.line).text

        // Find the position of the last opening tag with namespace prefix
        let tagPos = triggerText.lastIndexOf('<' + nsPrefix + ':')

        // This line appears to be incomplete/unnecessary - likely a copy-paste error
        // It searches for comma+prefix but doesn't store or use the result
        triggerText.lastIndexOf(',' + nsPrefix + ':')

        // If no tag with the detected namespace is found, try default dfdl namespace
        if (tagPos < 0) {
          tagPos = triggerText.lastIndexOf('<dfdl:')
          if (tagPos > 0) {
            nsPrefix = 'dfdl:'
          }
        }
        // Re-extract text from cursor position start to current position
        triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)

        // Check if there's an unclosed tag in the document up to this point
        let nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )

        // Count how many XML items exist on the current line
        const itemsOnLine = getItemsOnLineCount(triggerText)

        const triggerChar = '/'

        // **GUARD CLAUSES**: Return early if any of these conditions are true
        // These prevent auto-completion in contexts where it would be inappropriate
        if (
          checkBraceOpen(document, position) || // Inside unclosed curly braces {}
          cursorWithinBraces(document, position) || // Cursor positioned within braces
          cursorWithinQuotes(document, position) || // Inside quoted attribute values
          cursorAfterEquals(document, position) || // Immediately after an equals sign
          isInXPath(document, position) || // Within an XPath expression
          isNotTriggerChar(document, position, triggerChar) // Verify '/' is actually the trigger char
        ) {
          return undefined // Don't provide completion
        }
        // If there's a tag that needs closing, remove the '/' that was just typed
        // This prevents duplicate slashes when inserting the proper closing syntax
        if (!(nearestTagNotClosed == 'none')) {
          let range = new vscode.Range(backpos, position)
          // Perform the edit to remove the trigger character
          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })
        }
        // Main logic: If the line ends with '/', handle the completion
        if (triggerText.endsWith('/')) {
          checkItemsOnLine(
            document,
            position,
            itemsOnLine,
            nearestTagNotClosed,
            backpos,
            nsPrefix,
            triggerText
          )
        }
        // Return undefined as completions are handled via snippet insertion, not suggestions
        //return undefined
      },
    },
    '/' // Trigger character for this completion provider
    // triggered whenever a '/' is typed
  )
}
/**
 * Creates and returns a completion item provider for the 'tdml' language
 * that triggers when the user types a forward slash '/' to close XML elements.
 * This handles TDML (Test Data Markup Language) files.
 *
 * @returns vscode.CompletionItemProvider - A provider that listens for '/' triggers
 */
export function getTDMLCloseElementSlashProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'tdml',
    {
      /**
       * Provides completion items when '/' is typed in a TDML document.
       * Similar to DFDL provider but with slightly different guard conditions.
       *
       * @param document - The active text document
       * @param position - The current cursor position where '/' was typed
       * @returns undefined - Edits are applied directly, no completion list shown
       */
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        // Position one character back from cursor
        let backpos = position.with(position.line, position.character - 1)

        // Get namespace prefix (TDML likely uses different namespaces than DFDL)
        const nsPrefix = getNsPrefix(document, position)

        // Get text from line start to cursor
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)

        // Check for unclosed tags
        let nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )

        // Count items on current line
        const itemsOnLine = getItemsOnLineCount(triggerText)
        // **GUARD CLAUSES**: Similar to DFDL provider but without trigger char check
        // TDML provider has slightly less restrictive conditions
        if (
          checkBraceOpen(document, position) || // Inside unclosed braces
          cursorWithinBraces(document, position) || // Within braces region
          cursorWithinQuotes(document, position) || // Inside quotes
          cursorAfterEquals(document, position) || // After equals sign
          isInXPath(document, position) // In XPath context
        ) {
          return undefined // Don't provide completion
        }
        // Handle the slash completion if line ends with '/'
        if (triggerText.endsWith('/')) {
          checkItemsOnLine(
            document,
            position,
            itemsOnLine,
            nearestTagNotClosed,
            backpos,
            nsPrefix,
            triggerText
          )
        }
        // No completion list returned - edits applied directly
        return undefined
      },
    },
    '/' // Trigger character
    // triggered whenever a '/' is typed
  )
}
/**
 * Determines the appropriate closing syntax to insert when '/' is typed.
 * Decides between self-closing "/>" and full closing tags based on context.
 *
 * @param document - The active text document
 * @param position - Current cursor position
 * @param itemsOnLine - Number of XML items/tags on the current line
 * @param nearestTagNotClosed - The nearest tag that hasn't been closed yet
 * @param backpos - Position just before the '/' character
 * @param nsPrefix - Namespace prefix (e.g., 'xs:', 'dfdl:')
 * @param triggerText - Text from line start to cursor position
 */
function checkItemsOnLine(
  document: vscode.TextDocument,
  position: vscode.Position,
  itemsOnLine: number,
  nearestTagNotClosed: string,
  backpos: vscode.Position,
  nsPrefix: string,
  triggerText: string
) {
  // Adjust namespace prefix based on the tag type (some tags always use dfdl:)
  nsPrefix = getItemPrefix(nearestTagNotClosed, nsPrefix)
  // **CASE 1**: Single tag on line (or zero) AND there's a tag that needs closing
  // This typically means we're at the end of a tag like <element| (cursor at |)
  if (
    !(nearestTagNotClosed == 'none') &&
    (itemsOnLine == 1 || itemsOnLine == 0)
  ) {
    // Special handling for variable-related tags: add newline after self-closing
    // This follows DFDL best practices for readability
    if (
      nearestTagNotClosed.includes('defineVariable') ||
      nearestTagNotClosed.includes('setVariable')
    ) {
      insertSnippet('/>\n', backpos)
    } else {
      // Standard self-closing tag with cursor positioned after
      insertSnippet('/>$0', backpos)
    }
  }
  // **CASE 2**: Multiple items on the same line
  // This is more complex - need to determine if we're inside a tag or need full close
  if (itemsOnLine > 1) {
    if (
      triggerText.endsWith('/') &&
      triggerText.includes('<' + nsPrefix + nearestTagNotClosed)
    ) {
      // Find where this specific tag starts on the line
      let tagPos = triggerText.lastIndexOf('<' + nsPrefix + nearestTagNotClosed)
      let tagEndPos = triggerText.indexOf('>', tagPos)
      // **CONDITIONS FOR FULL CLOSING TAG**:
      // 1. Tag exists on line, AND
      // 2. Tag is NOT already self-closing (no "/>"), AND
      // 3. Cursor is positioned AFTER the opening ">", AND
      // 4. No closing tag exists yet for this element
      if (
        tagPos != -1 &&
        !triggerText.substring(tagEndPos - 1, 2).includes('/>') &&
        triggerText
          .substring(backpos.character - 1, backpos.character)
          .includes('>') &&
        !triggerText
          .substring(tagEndPos)
          .includes('</' + nsPrefix + nearestTagNotClosed)
      ) {
        // Insert full closing tag (e.g., </xs:element>)
        insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      } else {
        // Default to self-closing tag
        insertSnippet('/>$0', backpos)
      }
    }
  }
}
