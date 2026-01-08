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
 * DFDL (Data Format Description Language) Language Support Module
 *
 * This module provides comprehensive language support for DFDL schemas including:
 * - Semantic tokenization and syntax highlighting for XML and XPath expressions
 * - Completion providers for DFDL elements, attributes, and attribute values
 * - Hover providers showing documentation for DFDL constructs
 * - Auto-closing of XML tags
 * - Diagnostic reporting for XPath expressions and DFDL schema validation
 * - Integration with the DFDL Language Server Protocol (LSP) implementation
 *
 * DFDL is used to describe the structure of binary and text data formats,
 * allowing parsers to convert between data and XML representations.
 */

import * as vscode from 'vscode'
import * as fs from 'fs'
import { getElementCompletionProvider } from './providers/elementCompletion'
import { getAttributeCompletionProvider } from './providers/attributeCompletion'
import { getCloseElementProvider } from './providers/closeElement'
import { getAttributeValueCompletionProvider } from './providers/attributeValueCompletion'
import { getCloseElementSlashProvider } from './providers/closeElementSlash'
import { getAttributeHoverProvider } from './providers/attributeHover'

/**
 * Activates DFDL language features and registers all language service providers.
 *
 * This is the main entry point that wires up the extension's language features by calling
 * VS Code registration APIs (e.g., `registerCompletionItemProvider`, `registerHoverProvider`).
 * It connects the provider implementations to VS Code specifically for the DFDL language.
 *
 * The activation process:
 * 1. Loads the DFDL General Format schema for element completion data
 * 2. Registers completion providers for elements, attributes, and attribute values
 * 3. Registers providers for auto-closing tags (both regular and self-closing)
 * 4. Registers hover provider for showing attribute documentation
 *
 * @param context - VS Code extension context for managing subscriptions and resources
 */
export function activate(context: vscode.ExtensionContext) {
  // Load the DFDL General Format schema file which contains
  // the structure definitions used for element completion suggestions
  let dfdlFormat = fs
    .readFileSync(
      context.asAbsolutePath(
        './src/language/providers/intellisense/DFDLGeneralFormat.dfdl.xsd'
      )
    )
    .toLocaleString()

  // Register all language service providers with VS Code
  // Each provider will be automatically disposed when the extension deactivates
  context.subscriptions.push(
    // Suggests child elements / element tags based on DFDL schema structure
    getElementCompletionProvider(dfdlFormat),

    // Suggests attribute names when typing inside an element tag
    getAttributeCompletionProvider(),

    // Provides completion suggestions for attribute values (e.g., enumerated values, booleans)
    getAttributeValueCompletionProvider(),

    // Automatically inserts closing tags when user types '>' after an opening tag
    getCloseElementProvider(),

    // Handles self-closing tags when user types '/' (creates '<element/>' syntax)
    getCloseElementSlashProvider(),

    // Shows documentation and available values when hovering over attributes
    getAttributeHoverProvider()
  )
}
