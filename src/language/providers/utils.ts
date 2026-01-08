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
 * Utility Functions for Language Service Providers
 *
 * This module provides common utility functions used across all completion and hover providers
 * for DFDL and TDML language support. Key functionality includes:
 *
 * - Position and context detection: Determining cursor context within XML documents
 * - Element and attribute parsing: Extracting names and ranges from document text
 * - XML parsing and navigation: Working with XML DOM structures
 * - Completion item creation: Building VS Code completion items with appropriate styling
 * - XPath detection: Identifying when cursor is within an XPath expression
 *
 * These utilities are shared between DFDL and TDML providers to ensure consistent behavior
 * and reduce code duplication.
 */

import * as vscode from 'vscode'
import { isXPath } from '../semantics/dfdlExt'
import { xml2js } from 'xml-js'

// Regular expression to match XML schema elements with optional namespace prefixes
// Matches patterns like: <schema>, </schema>, <xs:schema>, <xsd:schema>
const schemaPrefixRegEx = new RegExp('</?(|[^ ]+:)schema')

/**
 * List of high-level DFDL schema element names.
 * These are the primary structural elements that can appear in a DFDL schema.
 * Used for element completion suggestions and validation.
 */
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

/**
 * Represents an XML element with its name, namespace, and attributes.
 * Used to encapsulate parsed XML element information for provider logic.
 */
export class XmlItem {
  private _itemName: string = 'none'
  private _itemNS: string = 'none'
  private _itemAttributes: string[] = []

  /** Gets the XML element name (e.g., "element", "sequence") */
  public get itemName() {
    return this._itemName
  }

  /** Sets the XML element name */
  public set itemName(name: string) {
    this._itemName = name
  }

  /** Gets the namespace prefix (e.g., "xs", "dfdl") */
  public get itemNS() {
    return this._itemNS
  }

  /** Sets the namespace prefix */
  public set itemNS(nameSpace: string) {
    this._itemNS = nameSpace
  }

  /** Sets the list of attribute names for this element */
  public set itemAttributes(attributeNames: string[]) {
    this._itemAttributes = attributeNames
  }

  /** Gets the list of attribute names for this element */
  public get itemAttributes() {
    return this._itemAttributes
  }
}

/**
 * Returns the list of high-level DFDL element names.
 * @returns Array of element name strings
 */
export function getItems() {
  return items
}

/**
 * Retrieves the namespace prefix used for XML Schema elements in the document.
 * Looks at the beginning of the document to find schema declarations.
 *
 * @param document - The VS Code text document
 * @returns The namespace prefix (e.g., "xs", "xsd") or default empty string
 */
export function getSchemaNsPrefix(document: vscode.TextDocument) {
  const pos = new vscode.Position(0, 0)
  return getNsPrefix(document, pos)
}

/**
 * Default namespace prefix when no explicit prefix is found.
 * Empty string represents the default (unprefixed) namespace.
 */
export const defaultXsdNsPrefix = ''

/**
 * DFDL namespace prefix used for DFDL-specific format elements
 * in otherwise standard XML Schema elements.
 */
export const dfdlDefaultPrefix = 'dfdl:'

/**
 * Inserts a snippet into the active text editor at the specified position.
 * Used to programmatically insert text templates with tab stops and placeholders.
 *
 * @param snippetString - The snippet text with VS Code snippet syntax ($1, $2, etc.)
 * @param backpos - The position where the snippet should be inserted
 */
export function insertSnippet(snippetString: string, backpos: vscode.Position) {
  vscode.window.activeTextEditor?.insertSnippet(
    new vscode.SnippetString(snippetString),
    backpos
  )
}

/**
 * Counts the number of lines from the current position back to the opening tag of a specified element.
 * Searches backwards through the document to find the nearest opening tag that matches the given tag name.
 * Skips closing tags and self-closing tags.
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @param tag - The element tag name to search for (without namespace prefix)
 * @returns The number of lines between the position and the opening tag, or -1 if not found
 */
export function lineCount(
  document: vscode.TextDocument,
  position: vscode.Position,
  tag: string
) {
  let lineNum = position.line
  let lineCount = 0
  let nsPrefix = getNsPrefix(document, position)

  // Search backwards through the document
  while (lineNum !== 0) {
    --lineNum
    ++lineCount

    const triggerText = document.lineAt(lineNum).text

    // Check if this line contains the opening tag (not a closing tag or self-closing tag)
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

/**
 * Finds the nearest open (unclosed) XML element at the cursor position.
 * Searches through the list of known DFDL elements to determine which element
 * the cursor is currently inside of. This is used to provide context-aware completions.
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @returns XmlItem containing the element name, namespace, and attributes, or empty XmlItem if none found
 */
export function nearestOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let xmlItem = new XmlItem()
  // Early return for empty document
  if (document.lineCount === 1 && position.character === 0) {
    return xmlItem
  }
  const nsPrefix = getNsPrefix(document, position)

  // Check each known DFDL element to see if the cursor is inside it
  for (let i = 0; i < items.length; ++i) {
    let [isTagOpen, isDfdlNs, attributeNames] = checkTagOpen(
      document,
      position,
      nsPrefix,
      items[i]
    )
    if (isTagOpen) {
      // Set the appropriate namespace (DFDL-specific or schema default)
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

/**
 * Finds the nearest matching opening tag for a set of known "items" relative to a given document position.
 *
 * The function searches backwards from a provided starting line/column to locate an opening tag that matches
 * one of the known items (the `items` array referenced in the implementation) with the requested namespace prefix.
 * It returns a tuple describing the found tag name (without namespace prefix), the line index where it was found,
 * and the character index of the tag's opening '<' on that line.
 *
 * Search behavior:
 * - If the trigger line contains multiple items and the start position lies inside the same line's tag range,
 *   the function searches backward within the trigger line for the previous '<' and attempts to match a tag there.
 * - Otherwise, the function walks upward line-by-line from `startLine` (adjusting if `startLine` equals the
 *   trigger line and the cursor is exactly at a '<' or the trigger line is blank), skipping self-closing tags (`/>`),
 *   and checking each line for an opening tag that matches one of the known items.
 * - Before checking a line it ignores lines containing closing-tag syntax (`</`) unless the cursor is within
 *   the tag's inner content and both opening and closing tags appear on the same line; in that case the
 *   function may return that tag if the cursor lies between the `>` and `</`.
 * - The namespace prefix is recalculated from the document/position during the upward search (via `getNsPrefix`).
 *
 * Edge cases & return value:
 * - If a match is found, returns `[itemName, lineIndex, charIndex]` where:
 *     - itemName is the matched item string (without the namespace prefix),
 *     - lineIndex is a 0-based line number where the opening '<' appears,
 *     - charIndex is the 0-based character index of that opening '<' on the line.
 * - If no matching opening tag is found, returns `['none', 0, 0]`.
 *
 * Notes:
 * - The function depends on external helpers and data: `items` (array of valid tag names),
 *   `getItemsOnLineCount(text)`, and `getNsPrefix(document, position)`.
 * - Indices and positions are zero-based (compatible with `vscode.TextDocument` / `vscode.Position`).
 *
 * @param document - The TextDocument in which to search.
 * @param position - The trigger Position (usually the cursor position) used for namespace inference and context.
 * @param nsPrefix - The current namespace prefix to use when matching tags (may be recalculated during search).
 * @param startLine - The 0-based line index from which to begin the backward search.
 * @param startPos - The 0-based character index on `startLine` from which to begin searching (used for same-line logic).
 * @returns A tuple of `[matchedItemName, lineIndex, charIndex]`, or `['none', 0, 0]` if nothing is found.
 */
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

/**
 * Determines whether the XML/DFDL start tag for a given namespace prefix and tag name
 * is currently "open" at the provided document position, and returns any attribute
 * names found on that open tag.
 *
 * The function inspects the current and preceding lines to locate the nearest opening
 * tag that matches "<{nsPrefix}{tag}" (falls back to "dfdl:" prefix if necessary).
 * It handles both single-line tags and multi-line start tags:
 * - For single-line tags it verifies the cursor position falls within the tag's
 *   attribute region (between the start '<...' and the closing '>' if present).
 * - For multi-line tags (start tag is present but its '>' is not on the same line),
 *   it defers to checkMultiLineTag to determine openness across multiple lines.
 *
 * Behavior summary:
 * - Scans backward when the current line contains few XML items to find the line
 *   that actually contains the tag start.
 * - Detects and normalizes a DFDL-specific 'dfdl:' prefix when the provided prefix
 *   does not match but a 'dfdl:' occurrence is found.
 * - If the tag is considered open at the given position, collects attribute names
 *   by calling getAttributeNames(document, position, nsPrefix, tag).
 *
 * Notes and side effects:
 * - The nsPrefix parameter is reassigned locally if a 'dfdl:' fallback is detected;
 *   this does not mutate any caller-owned object but affects subsequent internal checks.
 * - Relies on helper functions getItemsOnLineCount, getAttributeNames and
 *   checkMultiLineTag as well as vscode.TextDocument.lineAt for text access.
 * - Returns quickly if the tag cannot be located or the position is outside the tag.
 *
 * @param document - The vscode.TextDocument to inspect.
 * @param position - The vscode.Position (cursor) used to determine whether the tag is open.
 * @param nsPrefix - Expected namespace prefix (e.g. "dfdl:" or custom prefix) to match before the tag name.
 * @param tag - The tag name to search for (without angle brackets or prefix).
 * @returns A tuple containing:
 *   - [0] boolean: true if the specified start tag is open at the given position, false otherwise.
 *   - [1] boolean: true if a 'dfdl:' prefix was detected/used instead of the provided nsPrefix.
 *   - [2] string[]: array of attribute names found on the open tag (empty if tag not open).
 */
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
    !document
      .lineAt(triggerLine + 1)
      .text.trim()
      .startsWith('<') &&
    triggerText.trim().startsWith('<' + nsPrefix + tag) &&
    triggerText.indexOf('>', tagPos) < 0 //if tag ending character is missing will return -1
  ) {
    isMultiLineTag = true
  }

  if (!isMultiLineTag) {
    const nextTagPos = triggerText.indexOf('<', tagPos + 1)
    let tagEndPos = triggerText.indexOf('>', tagPos)

    if (tagPos > -1 && itemsOnLine >= 1) {
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

/**
 * Determine the namespace prefix to use for a given item name.
 *
 * Uses a set of string-matching rules (checked in order) to compute the
 * prefix. If no rule matches, the provided `nsPrefix` is returned unchanged.
 *
 * @param item - The item name to evaluate. Matching is case-sensitive.
 * @param nsPrefix - The default namespace prefix to return when no rule applies.
 *
 * @returns The computed prefix. Possible values include:
 * - the original `nsPrefix` (default)
 * - `'dfdl:'` for certain DFDL-related items
 * - `'?'` specifically for `"xml version"`
 * - `''` (empty string) for fully-qualified DFDL element names
 *
 * @remarks
 * Rules (applied in order; later rules override earlier ones):
 * 1. Default: return `nsPrefix`.
 * 2. If `item` is one of `'assert'`, `'discriminator'`, `'defineFormat'`, `'format'`,
 *    or if `item` contains `'Variable'` or `'scape'`, set prefix to `'dfdl:'`.
 * 3. If `item === 'xml version'`, set prefix to `'?'`.
 * 4. If `item` is one of `'dfdl:element'`, `'dfdl:sequence'`, `'dfdl:simpleType'`,
 *    or `'dfdl:format'`, set prefix to the empty string `''`.
 *
 * Note that because rules are evaluated sequentially, a later rule can override
 * an earlier one. For example, `'dfdl:format'` will result in `''` even though
 * it contains `'format'` and would match the earlier `'format'` rule.
 *
 * @example
 * getItemPrefix('assert', 'ns:') // returns 'dfdl:'
 * @example
 * getItemPrefix('xml version', 'ns:') // returns '?'
 * @example
 * getItemPrefix('dfdl:element', 'ns:') // returns ''
 * @example
 * getItemPrefix('otherItem', 'ns:') // returns 'ns:'
 */
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

/**
 * Determine whether the cursor is located within a multi-line opening tag for a given namespaced tag,
 * and collect attribute names if the opening tag spans multiple lines.
 *
 * The function:
 * - Treats the tag as a DFDL tag if nsPrefix === 'dfdl:' (the returned isDfdlTag will be true).
 * - Immediately returns [false, isDfdlTag, []] when more than one item exists on the current line (itemsOnLine > 1).
 * - If the current line is blank, searches upward until a non-blank line is found.
 * - If the cursor appears after a closing tag ("</...") or on a self-closing tag ("/>") on that line, returns false.
 * - Searches upward from the non-blank line to find an opening tag that matches "<" + nsPrefix + tag.
 * - When an opening tag line is found, concatenates following lines until a '>' is encountered (or document end).
 * - If both the opening tag and the '>' are present in the concatenated text, calls getAttributeNames(...) to
 *   collect attribute names and returns [true, isDfdlTag, attributeNames].
 * - Otherwise returns [false, isDfdlTag, []].
 *
 * Notes and edge cases:
 * - tagPos and tagLine are accepted by the signature but are not used by the function logic.
 * - The search upward stops at the top of the document (openTagLine > 0) and the forward search for '>' stops
 *   at document.lineCount.
 * - The function never mutates the provided TextDocument or Position; it only reads lines.
 * - getAttributeNames is invoked only when an opening tag and a closing '>' for the start tag are found;
 *   attributeNames is an empty array otherwise.
 *
 * @param document - The vscode.TextDocument to inspect.
 * @param position - The current cursor position within the document.
 * @param itemsOnLine - Number of syntactic items on the current line; if > 1 the function exits early.
 * @param nsPrefix - Namespace prefix string (e.g. "dfdl:" or ""), used when matching the tag name.
 * @param tagPos - (Unused) numeric position of the tag in the original call site; preserved for compatibility.
 * @param tagLine - (Unused) original line index of the tag; preserved for compatibility.
 * @param tag - The tag name (without prefix) to search for (e.g. "sequence", "element").
 * @param isDfdlTag - Optional input flag; when nsPrefix === "dfdl:" this will be set to true and returned.
 *
 * @returns A tuple:
 *   - [0] boolean: true when a multi-line opening tag for the given namespaced tag was found and closed with '>',
 *   - [1] boolean: isDfdlTag flag indicating whether the tag is a DFDL tag,
 *   - [2] string[]: an array of attribute names extracted from the multi-line tag (empty if none or not multi-line).
 */
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
  let triggerLine = position.line
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
      currentText.includes('>') &&
      closeTagLine >= triggerLine
    ) {
      attributeNames = getAttributeNames(document, position, nsPrefix, tag)
      return [true, isDfdlTag, attributeNames]
    }
  }
  return [false, isDfdlTag, attributeNames]
}

//returns an empty value or a prefix plus a colon
/**
 * Get the XML namespace prefix used for the XSD/schema in the given document at or above the supplied position.
 *
 * Scans lines starting from the top of the document down to the line of `position` (inclusive) and returns the
 * first capture group produced by `schemaPrefixRegEx`. The captured value may be an empty string or a prefix
 * including a trailing colon (e.g. "xsd:"). If no matching schema declaration is found (or if `position.line`
 * is 0), the function returns `defaultXsdNsPrefix`.
 *
 * @param document - The VS Code text document to search for a schema namespace prefix.
 * @param position - The position whose line number is used as the inclusive upper bound for the search.
 * @returns The namespace prefix string (possibly empty or including a colon) if found; otherwise `defaultXsdNsPrefix`.
 *
 * @remarks
 * - This function relies on the module-level `schemaPrefixRegEx` to identify schema prefix declarations
 *   and on `defaultXsdNsPrefix` as the fallback value.
 * - The search proceeds from the start of the document to the given line and returns the first match encountered.
 *
 * @example
 * // If a line near the top contains 'xmlns:xsd="http://www.w3.org/2001/XMLSchema"', this may return 'xsd:'.
 */
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

/**
 * Collects the attribute names of an XML/HTML tag located at the given position in a VS Code text document.
 *
 * The function handles both single-line tags and tags that span multiple lines. If the tag at the
 * supplied position is not a complete single-line tag, the function searches upward to find the
 * opening tag line and then reads forward until it encounters a line containing `>` to assemble the
 * full tag text. The assembled text is parsed and the attribute names are returned as a unique list.
 *
 * @param document - The vscode.TextDocument to read lines from.
 * @param position - The vscode.Position indicating the starting line to inspect.
 * @param nsPrefix - Namespace prefix expected before the tag name (e.g. `"ns:"` or `""`).
 * @param tag - The tag name to locate (without angle brackets).
 * @returns An array of unique attribute names found on the tag. Returns an empty array if no attributes are found or the tag cannot be parsed.
 *
 * @remarks
 * - The search for the opening tag moves upward from the provided position until a line containing the
 *   prefixed tag is found or the start of the document is reached.
 * - Once the opening tag line is found, subsequent lines are appended until a closing `>` is encountered,
 *   producing a single string that is parsed to extract attributes.
 * - The function uses a parser to extract attributes and returns the attribute keys; duplicate names are
 *   de-duplicated.
 *
 * @example
 * // Single-line tag
 * // <ns:tag attr1="a" attr2="b">
 * // getAttributeNames(document, position, "ns:", "tag") -> ["attr1", "attr2"]
 *
 * @example
 * // Multi-line tag
 * // <ns:tag
 * //   attr1="a"
 * //   attr2="b"
 * // >
 * // getAttributeNames(document, position, "ns:", "tag") -> ["attr1", "attr2"]
 */
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

  //if multi-line tag
  if (
    currentText.trim().startsWith('<' + nsPrefix + tag) &&
    !currentText.endsWith('>') &&
    !document
      .lineAt(currentLine + 1)
      .text.trim()
      .startsWith('<')
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
  if (currentText.includes('>')) {
    const xmljs = xml2js(currentText, {})
    const attributes = xmljs.elements?.[0].attributes
    if (attributes) {
      const attributeSet: Set<string> = new Set(Object.keys(attributes))
      attributeNames = [...attributeSet]
      return attributeNames
    }
  }
  return attributeNames
}

/**
 * Count opening tag-like items on a single line of text.
 *
 * Scans the provided line for '<' ... '>' pairs and counts occurrences that
 * look like opening tags. The function ignores known non-opening constructs
 * such as explicit closing tags, HTML/XML comments, and certain bracketed
 * constructs. If an unmatched '<' (without a corresponding '>') is found,
 * it is counted as one item and scanning stops.
 *
 * Special-case:
 * - If the input contains the substring "schema" but does not contain
 *   "schemaLocation", the function immediately returns 1.
 *
 * Excluded from counting (examples):
 * - Constructs containing "</" (closing tags)
 * - Comment markers "<!--" or "-->"
 * - Constructs beginning with "<[" or "<!["
 *
 * @param triggerText - The line of text to analyze (expected to be a string).
 * @returns The number of opening tag-like items found on the line (non-negative integer).
 *
 * @remarks
 * - The function performs a simple, single-line scan and does not validate
 *   tag names or nesting structure.
 * - Time complexity is linear in the length of the input string.
 *
 * @example
 * // returns 2
 * getItemsOnLineCount("<a><b>");
 *
 * @example
 * // returns 1
 * getItemsOnLineCount("<a></a>");
 *
 * @example
 * // returns 1 (special-case for "schema")
 * getItemsOnLineCount("schema");
 */
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

/**
 * Determines if the cursor is currently positioned within an XPath expression.
 * When the cursor is in XPath, DFDL element/attribute intellisense should be disabled
 * and XPath-specific completion should be active instead.
 *
 * This is used to prevent DFDL completions from showing when the user is typing
 * XPath expressions in attributes like dfdl:inputValueCalc, dfdl:outputValueCalc,
 * dfdl:test, etc.
 *
 * @param document - The VS Code text document
 * @param position - The cursor position to check
 * @returns true if the cursor is within an XPath expression, false otherwise
 */
export function isInXPath(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  return isXPath(position)
}

/**
 * Verifies whether the character immediately before the cursor position is NOT
 * the expected trigger character for a completion provider.
 *
 * This is used by completion providers to ensure they were actually triggered
 * by the correct character and not by some other mechanism (like manual invocation).
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @param triggerChar - The expected trigger character (e.g., '<', '>', '/', ' ', '=')
 * @returns true if the character before the cursor is NOT the trigger character, false otherwise
 */
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

/**
 * Checks if the given trigger character indicates the end of an XML tag.
 * Tag end characters are '/' (for self-closing tags) and '>' (for closing tags).
 *
 * This is used to determine when NOT to provide element name completions,
 * since element names only make sense at the beginning of tags, not at the end.
 *
 * @param trigChar - The trigger character to check (typically from CompletionContext)
 * @returns true if the character is '/' or '>', false otherwise
 */
export function isTagEndTrigger(trigChar: string | undefined) {
  if (trigChar == '/' || trigChar == '>') {
    return true
  } else {
    return false
  }
}

/**
 * Determines if the cursor is positioned immediately after an equals sign (=).
 * This typically indicates the user is about to enter an attribute value.
 *
 * Used to suppress certain completion providers (like element completion) when
 * the user is in an attribute value context and should see attribute value
 * completions instead.
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @returns true if the cursor is directly after an '=' character, false otherwise
 */
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

/**
 * Determines if the cursor is currently positioned within quoted attribute value text.
 * Handles both single quotes (') and double quotes ("), and works across multiple lines
 * for attribute values that span multiple lines.
 *
 * The function searches backwards to find the opening quote (preceded by '=') and forwards
 * to find the closing quote, then checks if the cursor position falls within that range.
 *
 * This is crucial for:
 * - Enabling attribute value completion providers
 * - Disabling element/attribute name completion when inside values
 * - Detecting XPath expressions within attribute values
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @returns true if the cursor is inside a quoted attribute value (between opening and closing quotes),
 *          false otherwise
 */
export function cursorWithinQuotes(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const quoteChar: string[] = ["'", '"']
  let startLine = position.line

  // Check both single and double quotes
  for (let i = 0; i < quoteChar.length; ++i) {
    let currentText = document.lineAt(startLine).text

    // If line contains '<' but no quotes, we're not in an attribute value
    if (
      currentText.includes('<') &&
      !currentText.includes("'") &&
      !currentText.includes('"')
    ) {
      return false
    }

    if (currentText.includes(quoteChar[i])) {
      let textBeforeTrigger = currentText.substring(0, position.character)

      // Check if cursor is before an attribute assignment
      if (
        currentText.indexOf('=' + quoteChar[i]) > position.character &&
        textBeforeTrigger.trim() == ''
      ) {
        return false
      }

      let quoteStartLine = startLine
      let quoteStartPos = -1
      let equalStartPos = -1

      // Search backwards for the opening quote (preceded by '=')
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

      // Search forwards for the closing quote
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

        // Verify the opening quote is preceded by '=' and check if cursor is within the quoted range
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

/**
 * Determines if the cursor is currently positioned within curly braces { }.
 * Curly braces in DFDL are used for expression language contexts, where
 * different completion rules apply.
 *
 * The function searches backwards to find the opening brace '{' and forwards
 * to find the closing brace '}', handling multi-line expressions. If the cursor
 * falls within this range, the function returns true.
 *
 * This is used to:
 * - Disable XML element/attribute completion inside DFDL expressions
 * - Enable expression-specific completion (variables, functions, operators)
 * - Properly scope completion providers
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @returns true if the cursor is inside a pair of curly braces, false otherwise
 */
export function cursorWithinBraces(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let startLine = position.line
  let currentText = document.lineAt(startLine).text
  let braceStartLine = startLine
  let braceStartPos = -1

  // Search backwards for opening brace '{'
  while (
    braceStartLine > 0 &&
    (braceStartPos = currentText.indexOf('{')) === -1
  ) {
    currentText = document.lineAt(--braceStartLine).text
  }
  let braceEndLine = braceStartLine
  let braceEndPos = -1

  if (braceStartPos > -1) {
    // Search forwards for closing brace '}'
    while (
      braceEndLine < document.lineCount &&
      (braceEndPos = currentText.indexOf('}')) === -1
    ) {
      currentText = document.lineAt(++braceEndLine).text
    }

    // Check if cursor position falls within the brace range
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

/**
 * Checks if there is an unclosed (open) curly brace in the current context.
 * This detects when a curly brace expression is incomplete and missing its
 * matching closing/opening brace.
 *
 * The function checks two scenarios:
 * 1. If current line has '{', search forward for matching '}' - if not found, brace is open
 * 2. If current line has '}', search backward for matching '{' - if not found, brace is open
 *
 * This is used to disable certain completion providers when braces are unbalanced,
 * as the expression context is ambiguous or malformed.
 *
 * @param document - The VS Code text document
 * @param position - The current cursor position
 * @returns true if there is an unclosed brace, false if braces are balanced
 */
export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let lineNum = position.line
  let triggerText = document.lineAt(lineNum).text

  // If line contains opening brace, check if it has a closing brace
  if (triggerText.includes('{')) {
    while (!triggerText.includes('}') && lineNum < document.lineCount) {
      triggerText = document.lineAt(++lineNum).text
    }

    if (!triggerText.includes('}')) {
      return true // Opening brace without closing brace
    }
  }

  // If line contains closing brace, check if it has an opening brace
  if (triggerText.includes('}')) {
    while (!triggerText.includes('{') && lineNum > 0) {
      triggerText = document.lineAt(--lineNum).text
    }

    if (!triggerText.includes('{')) {
      return true // Closing brace without opening brace
    }
  }
  return false
}

/**
 * Creates a VS Code completion item from intellisense data.
 * Constructs a completion item with appropriate snippet text, documentation,
 * and optional prefix values.
 *
 * The function:
 * - Creates a CompletionItem with the item name as the label
 * - Sets the insert text as a snippet (supporting tab stops like $1, $2, etc.)
 * - Optionally prepends a prefix value (e.g., namespace prefix)
 * - Attaches markdown documentation if provided
 *
 * Some items (like dfdl:choiceBranchKey, dfdl:simpleType) are excluded from
 * receiving the prefix value as they have special formatting requirements.
 *
 * @param e - The intellisense item data containing:
 *            - item: The display name/label
 *            - snippetString: The VS Code snippet syntax to insert
 *            - markdownString: Optional documentation in markdown format
 * @param preVal - Prefix value to prepend to the snippet (e.g., attribute spacing)
 * @param nsPrefix - The namespace prefix (e.g., 'xs:', 'dfdl:')
 * @returns A configured VS Code CompletionItem ready to be shown to the user
 */
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

  // Items that should not receive the prefix value
  const noPreVals = [
    'dfdl:choiceBranchKey=',
    'dfdl:representation',
    'dfdl:choiceDispatchKey=',
    'dfdl:simpleType',
    'dfdl:element',
    'restriction',
  ]

  // Apply prefix value unless item is in the exclusion list
  if (preVal !== '' && !noPreVals.includes(e.item)) {
    completionItem.insertText = new vscode.SnippetString(
      preVal + e.snippetString
    )
  } else {
    completionItem.insertText = new vscode.SnippetString(e.snippetString)
  }

  // Attach documentation if provided
  if (e.markdownString) {
    completionItem.documentation = new vscode.MarkdownString(e.markdownString)
  }

  return completionItem
}
