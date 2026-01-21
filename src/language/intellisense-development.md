<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Intellisense

This document contains an overview of how Intellisense works, as well as a general view of the architecture of the code.

## Table of Contents

- [Intellisense](#intellisense)
  - [Table of Contents](#table-of-contents)
    - [General Intellisense Concepts](#general-intellisense-concepts)
      - [Providers](#providers)
      - [Registration](#registration)
    - [DFDL](#dfdl)
      - [High-level dfdl Intellisense Overview](#high-level-dfdl-intellisense-overview)
        - [Provider Registration (Start Here)](#provider-registration-start-here)
        - [Provider Implementation Locations](#provider-implementation-locations)
        - [Helpers + Vocabulary](#helpers-vocabulary)
        - [Context Parsing](#context-parsing)
        - [Namespace / Prefix Handling](#namespace-prefix-handling)
        - [Completions Construction](#completions-construction)
        - [Hover / Documentation](#hover-documentation)
        - [Testing](#testing)
      - [Individual File Deep-Dives](#individual-file-deep-dives)
        - [Core Provider Files](#core-provider-files)
          - [attributeCompletion.ts](#attributecompletionts)
          - [attributeHover.ts](#attributehoverts)
          - [attributeValueCompletion.ts](#attributevaluecompletionts)
          - [closeElement.ts](#closeelementts)
          - [closeElementSlash.ts](#closeelementslashts)
          - [closeUtils.ts](#closeutilsts)
        - [Intellisense Data Files (intellisense subdirectory)](#intellisense-data-files-intellisense-subdirectory)
          - [attributeItems.ts](#attributeitemsts)
          - [attributeValueItems.ts](#attributevalueitemsts)
        - [src/language/dfdl.ts](#srclanguagedfdlts)
    - [TDML](#tdml)

### General Intellisense Concepts

#### Providers

Providers in the VS Code API are extension points that let you plug specific language or editor features into the editor’s pipeline (e.g., completions, hovers, formatting). Providers are implemented and then registered in the code, which then gets called depending on the situation in which the provider activates.

Many providers exist. Relevant ones that are used extensively in the code about IntelliSense functionality include `completionItemProvider`, which provides code suggestions, and `hoverProvider`, which provides hover information. For more information, visit <https://code.visualstudio.com/api/references/vscode-api>.

#### Registration

After a provider has its functionality implemented, it can then be registered into the extension so that its functionality can be utilized in the IntelliSense functionality pipeline. Relevant registration calls include `registerCompletionItemProvider` and `registerHoverProvider`.

### DFDL

This section focuses on the `dfdl` Intellisense implementation.

#### High-level dfdl Intellisense Overview

This section provides a high-level view of the architecture of all relevant code items about the `dfdl` IntelliSense functionality.

##### Provider Registration (Start Here)

`src/language/dfdl.ts` is the starting point. It wires up the extension’s language features by calling VS Code registration APIs (e.g., `registerCompletionItemProvider`, `registerHoverProvider`, and similar) that are then customized as functions that provide customized provider functionality.

In other words, `dfdl.ts` connects the provider implementations to VS Code for the DFDL language.

##### Provider Implementation Locations

Autocompletion logic is split into multiple provider modules under `src/language/providers/`, each handling different completion scenarios.

- `elementCompletion.ts` -- suggests child elements/element tags.
- `attributeCompletion.ts` -- suggests attribute names when inside an element.
- `attributeValueCompletion.ts` -- provides completion suggestions for attribute values (e.g., enumerated values).
- `closeElement.ts`, `closeElementSlash.ts` -- completions for closing tags and slash completions.
- `attributeHover.ts` -- hover provider that shows attribute documentation/available attributes.

It should be noted that there are many `registerCompletionItemProvider` calls. The implemented `completionItemProvider`s each contain logic to determine whether or not the provider is relevant to a given situation.

##### Helpers + Vocabulary

`src/language/providers/utils.ts` contains shared helpers for constructing CompletionItem objects, and context parsing utilities used by many providers. It also contains utilities used for root-level completion logic (common completion primitives).

##### Context Parsing

Providers do lightweight parsing of the current document and cursor context (often using a small tokenizer/utility functions) to determine whether the cursor is:

- inside an element start tag
- inside attribute name or value
- within namespace/prefix context
- in text content (no suggestions)

This context detection guides which provider runs and how it filters suggestions.

##### Namespace / Prefix Handling

The code can determine the current element's namespace, and the suggestions can insert the correct namespace or omit the namespace accordingly for attribute and element suggestions.

##### Completions Construction

Providers build `vscode.CompletionItem` objects populated with:

- label, kind (element/attribute/snippet)
- insertText (text inserted when the user accepts the suggestion)
- sometimes additionalTextEdits or textEdit ranges to precisely replace text
- optional documentation or detail shown in the completion UI

Some items use resolveCompletionItem logic if additional data must be computed after selection.

##### Hover / Documentation

`attributeHover.ts` forms hover messages (Markdown strings) describing attributes available on a tag, DFDL property documentation, etc. Hover resolves the current element context, then gathers attribute docs and returns a `vscode.Hover` object.

Hover tooltips can be found under `attributeHoverValues()` in `attributeHoverItems.ts`.

##### Testing

`src/tests/suite/language/items.test.ts` contains unit-style checks that assert which items should be available in certain contexts -- useful to confirm the expected behavior of completion providers.

#### Individual File Deep-Dives

##### Core Provider Files

###### attributeCompletion.ts

**Purpose:** Attribute name completion provider for XML elements in DFDL schemas and TDML test files.

**Key Functionality:**

- Provides context-aware attribute suggestions based on the current XML element type
- Suggests valid DFDL attributes for DFDL-specific elements
- Suggests XSD attributes for XML Schema elements
- Filters out already-present attributes to avoid duplicates
- Handles both space-triggered and newline-triggered completion
- Scans document for user-defined types for type attribute completion

**Key Functions:**

- `getAttributeCompletionProvider()`: DFDL document provider
- `getTDMLAttributeCompletionProvider()`: TDML document provider
- `getDefinedTypes()`: Scans for xs:simpleType and xs:complexType declarations
- `prunedDuplicateAttributes()`: Removes attributes already present on the element

**Trigger:** Space (` `) or newline (`\n`)

##### attributeHover.ts

**Purpose:** Hover provider that displays documentation tooltips when users hover over DFDL/XSD attribute names. The attribute's tooltips are obtained from `attributeItems.ts`

**Key Functionality:**

- Provides rich formatted documentation for DFDL properties and XSD attributes
- Displays attribute descriptions, valid values, usage examples, and spec references
- Handles both prefixed (dfdl:property) and unprefixed attribute names
- Quick reference without leaving the editor

**Documentation Categories:**

- XSD Core Attributes (name, ref, minOccurs, maxOccurs)
- DFDL Length Properties (dfdl:length, dfdl:lengthKind, dfdl:lengthUnits)
- DFDL Encoding (dfdl:encoding, dfdl:utf16Width)
- DFDL Binary/Text Properties (dfdl:binaryNumberRep, dfdl:textNumberPattern)
- DFDL Delimiters (dfdl:separator, dfdl:terminator, dfdl:initiator)
- DFDL Assertions (testKind, test, testPattern)

**Provider Registered:**

- `getAttributeHoverProvider()`: For DFDL documents

###### attributeValueCompletion.ts

**Purpose:** Attribute value completion provider for DFDL schemas and TDML test files.

**Key Functionality:**

- Intelligent value suggestions based on attribute name
- Enumerated value completion for DFDL properties with fixed value sets
- Type name completion (references to xs:simpleType or xs:complexType)
- Variable name completion (references to dfdl:defineVariable)
- Boolean values (true/false, yes/no) for boolean attributes
- Standard values (encoding names, byte orders, etc.)

**Key Functions:**

- `getAttributeValueCompletionProvider()`: DFDL document provider
- `getTDMLAttributeValueCompletionProvider()`: TDML document provider
- `getAttributeDetails()`: Extracts attribute name and value range for completion context

**Trigger:** Space (` `)

###### closeElement.ts

**Purpose:** Completion provider that handles auto-completion of XML element structures when the user types a `>` character. Unlike `closeElementSlash.ts` which handles closing tags with `/`, this provider completes the element opening and provides the corresponding closing tag structure.

**Key Functionality:**

- Provides intelligent element completion for both DFDL and TDML files when `>` is typed
- Determines whether to insert simple closing tags or full container structures based on context
- Prevents inappropriate completion inside XPath expressions, quoted strings, braces, or after equals signs
- **Special trigger patterns:**
  - `>`: Standard trigger for multi-line completion with indentation
  - `>>`: Inline completion without extra whitespace
  - `.=>`: Alternative trigger pattern for special cases
- **Tag-specific formatting:**
  - `schema` tag: Gets unique multi-line formatting with proper XML document structure
  - Variable tags (`defineVariable`, `setVariable`): Multi-line snippets with newlines for readability
  - Assertion tags (`assert`, `discriminator`): Inline snippets with tab stops for test expressions
  - Default: Multi-line container format with indentation for child elements
- Handles complex multi-tag lines by analyzing tag positions and existing closing tags
- **Progressive completion workflow:** Supports tab-stop navigation ($0, $1) for seamless content insertion
- Direct document manipulation using snippet insertion rather than traditional completion suggestions

**Key Functions:**

- `getCloseElementProvider()`: Main DFDL completion provider registration
- `getTDMLCloseElementProvider()`: TDML-specific completion provider registration
- `checkItemsOnLine()`: Core logic determining what to insert based on item count and context
- `checkNearestTagNotClosed()`: Handles tag-specific snippet patterns for single-item lines
- `checkTriggerText()`: Manages insertion for complex multi-tag lines

**Trigger:** Greater-than sign (`>`)

**Architecture Notes:**

- Uses **guard clauses** for early returns in inappropriate contexts (same pattern as `closeElementSlash.ts`)
- Implements **dual strategy**: DFDL provider with full validation vs. simpler TDML provider
- Follows VS Code provider pattern but uses **direct edits** (`insertSnippet`) instead of completion lists
- **Snippet complexity:** Uses multi-tab-stop patterns ($1 for content, $0 for final position) enabling progressive workflow
- Separation of concerns: Context validation in providers, insertion logic delegated to helper functions

**Dependencies:**

- `closeUtils.checkMissingCloseTag()`: Determines which tag needs closing
- `utils.insertSnippet()`: Performs the actual text insertion with tab stops
- Multiple context validators: `checkBraceOpen()`, `cursorWithinBraces()`, `cursorWithinQuotes()`, `cursorAfterEquals()`, `isInXPath()`, `isNotTriggerChar()`
- Namespace utilities: `getNsPrefix()`, `getItemPrefix()`, `getItemsOnLineCount()`

**Flow:**

1. User types `>` at cursor position
2. Provider validates context (not in XPath, quotes, braces, etc.) and verifies `>` is the trigger char
3. `checkMissingCloseTag()` scans document to find the nearest unclosed tag
4. If tag needs closing, checks trigger pattern (`>`, `>>`, or `.=>`) and items on line
5. Deletes the typed trigger character(s) to prevent duplication
6. `checkItemsOnLine()` delegates to specialized handlers:
   - `checkNearestTagNotClosed()` for single-item lines (tag-specific formatting)
   - `checkTriggerText()` for multi-tag lines (ensures no duplicate closing tags)
7. Inserts appropriate snippet with proper formatting and tab stops

**Comparison with `closeElementSlash.ts`:**

| Feature                | `closeElement.ts` (This File)                    | `closeElementSlash.ts`                        |
| ---------------------- | ------------------------------------------------ | --------------------------------------------- |
| **Trigger**            | `>` character                                    | `/` character                                 |
| **Primary Action**     | Completes element opening with closing structure | Closes element (self-closing or full closing) |
| **Snippet Complexity** | Multi-tab-stop ($0, $1) for progressive workflow | Single tab-stop ($0) only                     |
| **Special Patterns**   | `>`, `>>`, `.=>` triggers                        | `/` only                                      |
| **Schema Handling**    | Special multi-line formatting with indentation   | Standard completion                           |
| **Content Insertion**  | Yes (between opening and closing tags)           | No (cursor after closing)                     |
| **Use Case**           | Creating new elements with content               | Closing existing elements                     |

###### closeElementSlash.ts

**Purpose:** Completion provider that handles auto-closing XML/DFDL elements when the user types a forward slash '/' character, determining whether to insert self-closing tags (`/>`) or full closing tags (`</tag>`).

**Key Functionality:**

- Provides intelligent slash-based auto-completion for both DFDL and TDML files
- Determines whether to insert self-closing (`/>$0`) or full closing tags (`</ns:tag>$0`) based on context
- Prevents inappropriate completion inside XPath expressions, quoted strings, braces, or after equals signs
- Handles complex multi-tag lines by analyzing tag positions and existing closing tags
- Special case handling for variable-related tags (`defineVariable`, `setVariable`) with added newlines for readability
- Direct document manipulation using snippet insertion rather than traditional completion suggestions

**Key Functions:**

- `getCloseElementSlashProvider()`: Main DFDL completion provider registration
- `getTDMLCloseElementSlashProvider()`: TDML-specific completion provider registration
- `checkItemsOnLine()`: Core logic determining what to insert based on tag count, namespace, and context

**Trigger:** Forward slash (`/`)

**Architecture Notes:**

- Uses **guard clauses** for early returns in inappropriate contexts
- Implements **dual strategy**: simpler TDML provider vs. more robust DFDL provider
- Follows VS Code provider pattern but uses **direct edits** (`insertSnippet`) instead of completion lists
- Separation of concerns: context validation in providers, insertion logic in `checkItemsOnLine()`

**Dependencies:**

- `closeUtils.checkMissingCloseTag()`: Determines if a tag needs closing
- `utils.insertSnippet()`: Performs the actual text insertion
- Multiple context validators: `checkBraceOpen()`, `cursorWithinBraces()`, `cursorWithinQuotes()`, `cursorAfterEquals()`, `isInXPath()`, `isNotTriggerChar()`
- Namespace utilities: `getNsPrefix()`, `getItemPrefix()`, `getItemsOnLineCount()`

**Flow:**

1. User types '/' at cursor position
2. Provider validates context (not in XPath, quotes, braces, etc.)
3. `checkMissingCloseTag()` scans document to find nearest unclosed tag
4. If tag needs closing, removes the trigger '/' to prevent duplicates
5. `checkItemsOnLine()` decides: self-closing tag, full closing tag, or nothing
6. Inserts appropriate snippet at the correct position

###### closeUtils.ts

**Purpose:** Core utility module providing tag state analysis functions for the auto-completion system. Determines whether XML/DFDL tags are properly closed and identifies unclosed tags that need completion.

**Key Functionality:**

- **Tag State Analysis**: `checkMissingCloseTag()` is the primary function that scans documents to find opened-but-unclosed tags
- **Dual Strategy Implementation**: Uses different algorithms for single-tag lines vs. multi-tag lines:
  - `getItemsForLineGT1()`: Array-based position tracking for complex multi-tag scenarios
  - `getItemsForLineLT2()`: Bidirectional document scanning for simpler single-tag situations
- **Nested Tag Awareness**: Properly tracks nesting levels to handle complex XML structures with same-named nested elements
- **Multi-line Tag Support**: Extensive logic for tags spanning multiple lines (common in DFDL with many attributes)
- **Namespace Prefix Management**: Dynamically adjusts namespace prefixes based on tag types and document context
- **Closing Tag Location**: `getCloseTag()` finds exact positions of closing tags for document structure analysis
- **Cursor Context Validation**: `cursorInsideCloseTag()` prevents interference when user is manually typing closing tags

**Key Functions:**

- `checkMissingCloseTag()`: Main entry point - returns name of unclosed tag or 'none'
- `checkItemsForLineGT1()`: Multi-tag line analysis using opening/closing position arrays
- `checkItemsForLineLT2()`: Single-tag line analysis with forward/backward scanning
- `getCloseTag()`: Locates closing tag positions with nested tag tracking
- `cursorInsideCloseTag()`: Checks if cursor is positioned inside a closing tag
- `getItemsForLineGT1()`: Complex multi-tag line parser
- `getItemsForLineLT2()`: Simple single-tag line parser

**Algorithm Details:**

**`getItemsForLineGT1()` (Multi-tag lines):**

1. Builds arrays of all opening and closing tag positions on the line
2. Filters out self-closing tags from the opening array
3. Compares array lengths - more opens than closes = unclosed tag
4. Efficient for complex scenarios but requires careful position tracking

**`getItemsForLineLT2()` (Single-tag lines):**

1. Scans backwards to find the opening tag
2. Scans both directions (backwards and forwards) to collect all opening/closing tags
3. Handles multi-line tags by traversing until finding closing `>`
4. Removes self-closing tags from tracking
5. Compares open/close counts across the entire document context

**`getCloseTag()` (Closing tag locator):**

1. Tracks `nestedTagCount` for proper nested element handling
2. Skips comment blocks (`<!-- -->`) to avoid false positives
3. Handles multi-line tags by aggregating text across lines
4. Returns precise line and character position of closing tags

**Dependencies:**

- `utils.getItemsOnLineCount()`: Counts XML items on a line
- `utils.getItemPrefix()`: Determines correct namespace prefix for tags
- `utils.getItems()`: Gets list of all DFDL/XSD tag names

**Integration:**

- Called exclusively by `closeElementSlash.ts` providers
- Provides the "brains" of the auto-completion system
- Returns tag names that drive snippet insertion decisions

**Performance Considerations:**

- Early returns when tag is found
- Avoids full document parsing by scanning only relevant sections
- Skips complex multi-tag lines in single-tag mode
- Uses efficient string search methods (`indexOf`, `lastIndexOf`)

##### Intellisense Data Files (intellisense subdirectory)

###### attributeItems.ts

**Purpose:** Static completion data for XML schema attributes used in DFDL/XSD documents.

**Data Structure:**

- Array of completion items, each containing:
  - `item`: Attribute name
  - `snippetString`: VS Code snippet with placeholders and default values
  - `markdownString`: Documentation shown in completion tooltip

**Snippet Features:**

- Tab stops ($1, $2, etc.)
- Choice placeholders (${1|option1,option2|})
- Final cursor position ($0)
- Namespace prefix handling

**Attribute Categories:**

- XSD Core Attributes (name, ref, type, minOccurs, maxOccurs)
- DFDL Length Properties (dfdl: length, dfdl:lengthKind, dfdl:lengthUnits)
- DFDL Encoding Properties (dfdl: encoding, dfdl:encodingErrorPolicy)
- DFDL Text/Binary Representation
- DFDL Separators/Delimiters
- DFDL Calendar/Date
- DFDL Escape Schemes
- DFDL Assertions

**Key Export:**

- `attributeCompletion(additionalItems, nsPrefix, dfdlPrefix, spacingChar, afterChar)`: Returns object with completion items

###### attributeValueItems.ts

**Purpose:** Completion logic for attribute values (as opposed to attribute names).

**Data Structures:**

- `noChoiceAttributes`: Array of free-text attributes that should not show completion choices
- `attributeValues()`: Function that generates value snippets based on attribute name

**Snippet Patterns:**

- `${1|option1,option2|}`: Dropdown with predefined choices
- `"$1"`: Simple placeholder for user input
- `"{$1}"`: Placeholder for DFDL expressions with curly braces
- `$0`: Final cursor position

**Attribute Categories Handled:**

- Occurrence attributes (minOccurs, maxOccurs, occursCountKind)
- Length attributes (lengthKind, lengthUnits)
- Encoding attributes (encoding, encodingErrorPolicy)
- Binary/Text format attributes
- Calendar/date attributes
- Sequence/Choice properties
- Yes/No boolean properties

**Key Exports:**

- `noChoiceAttributes`: List of attributes without predefined choices
- `attributeValues(attributeName, startPos, additionalTypes)`: Inserts appropriate snippet at cursor

##### src/language/dfdl.ts

**Purpose:** The central registration file for all DFDL language features.

**Key Functionality:**

- **Starting Point:** It is executed during extension activation and registers the completion and hover providers with VS Code. This file is the “entry point” for Language features. If you want to add providers, this is the place to update.
- **Central Rgistration Point:**It imports provider modules (element, attribute, attributeValue, closeElement, attributeHover, etc.) and registers them with appropriate trigger characters (e.g., `<`, `:`, `"`, `=`, `/`, `whitespace`).
- **Wiring:**It does not perform completion logic itself — rather it wires VS Code events to the exported provider objects/functions in the provider modules.
- **DFDL Language Provider:**When VS Code triggers a provider callback for the DFDL language, the registered provider function from the corresponding module is invoked.

##### src\language\providers\utils.ts

**Purpose:** Central utility module providing common functions used across all completion and hover providers.

**Key Functionality:**

- **Position & Context Detection:** Functions to determine cursor position within XML documents, identify element types, and detect XPath contexts
- **Element & Attribute Parsing:** Extract element names, attributes, and ranges from document text
- **XML Navigation:** Working with XML DOM structures using xml2js, finding nearest open tags, parent elements
- **Completion Item Creation:** Building VS Code completion items with appropriate styling and documentation
- **Context Detection:** Functions to determine if cursor is within quotes, braces, XPath expressions, or after specific characters
- **Namespace Handling:** Detecting and managing XML namespace prefixes (xs:, dfdl:, etc.)

**Key Classes:**

- `XmlItem`: Encapsulates parsed XML element information (name, namespace, attributes)

**Key Functions:**

- `nearestOpen()`: Finds the nearest unclosed XML element at the cursor position
- `checkTagOpen()`: Determines if a tag is open at a given position with attribute discovery
- `cursorWithinQuotes()`: Detects if the cursor is inside attribute value quotes
- `getNsPrefix()`: Retrieves namespace prefix for schema elements
- `createCompletionItem()`: Creates VS Code completion items from intellisense data

**Provider Checks:**

If you look at the structure of the `dfdl.ts`, it registers multiple providers. There are checks to determine whether or not a certain provider's autocomplete suggestions apply to the situation. This file's helper functions provide a check criterion.

### TDML

This section focuses on the `tdml` Intellisense implementation. It should be noted that the functionality is currently unused.
