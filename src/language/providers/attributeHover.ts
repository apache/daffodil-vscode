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
 * Attribute Hover Provider for DFDL Documents
 *
 * This module provides documentation tooltips when users hover over DFDL attribute names
 * in XML elements. It displays helpful information including:
 * - Attribute description and purpose
 * - Valid values and their meanings
 * - Usage examples
 * - Links to DFDL specification documentation
 * - Default values and behaviors
 *
 * Features:
 * - Rich formatted hover text with markdown support
 * - Context-sensitive documentation for DFDL properties
 * - Handles both prefixed (dfdl:property) and unprefixed attribute names
 * - Integration with DFDL specification data
 * - Quick reference without leaving the editor
 *
 * The hover information is displayed automatically when the user positions their cursor
 * over a DFDL attribute name in the schema.
 */

import * as vscode from 'vscode'
import { attributeCompletion } from './intellisense/attributeItems'

/**
 * Registers the hover provider for DFDL attribute documentation.
 *
 * This provider displays documentation when users hover over DFDL attribute names.
 * It works by:
 * 1. Detecting the word under the cursor
 * 2. Checking if it's a valid DFDL attribute name
 * 3. Adding the 'dfdl:' prefix if not already present
 * 4. Looking up documentation from the attribute hover items data
 * 5. Displaying the documentation in a hover tooltip
 *
 * The documentation includes descriptions, valid values, examples, and links
 * to the DFDL specification for more detailed information.
 *
 * @returns A VS Code Disposable for the registered hover provider
 */
export function getAttributeHoverProvider() {
  return vscode.languages.registerHoverProvider('dfdl', {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ) {
      // Get the word at the cursor position (the attribute name being hovered)
      const range = document.getWordRangeAtPosition(position)
      if (!range) {
        return undefined // No word found at the position
      }
      let hoverItem = document.getText(range)
      type AttributeItem = {
        item: string
        snippetString: string
        markdownString: string
      }

      const attributeItems: AttributeItem[] = []

      // Build a list of all valid DFDL attribute names
      attributeCompletion('', '', 'dfdl', '', '').items.forEach((r) =>
        attributeItems.push(r)
      )

      let foundItem = attributeItems.find(
        (attributeItem) => attributeItem.item === hoverItem
      )

      if (foundItem == undefined) {
        // Normalize the attribute name to include the 'dfdl:' prefix if needed
        hoverItem = 'dfdl:' + hoverItem
        foundItem = attributeItems.find(
          (attributeItem) => attributeItem.item === hoverItem
        )
      }

      // return hover doucumentation
      if (foundItem?.item === hoverItem) {
        return new vscode.Hover(foundItem.markdownString)
      }
    },
  })
}
