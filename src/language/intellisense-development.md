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

This document contains an overview of how intellisense works as well as a general view of the architecture of the code.

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
        - [src/language/dfdl.ts](#srclanguagedfdlts)
    - [TDML](#tdml)

### General Intellisense Concepts

#### Providers

Providers in the VS Code API are extension points that let you plug specific language or editor features into the editor’s pipeline (e.g., completions, hovers, formatting). Proviers are implemented and then registered in the code which gets then gets called depending on the situation the provider activates.

Many providers exist. Relevant ones that are used extensively in the code pertaining to IntelliSense functionality include `completionItemProvider` which provide code suggestions and `hoverProvider` which provider hover information. More information can be found at <https://code.visualstudio.com/api/references/vscode-api>.

#### Registration

After a provider has its functionality implemented, it can then be registered into the extension so that its functionality can be utilized in the IntelliSense functionality pipeline. Relevant registration calls include `registerCompletionItemProvider` and `registerHoverProvider`.

### DFDL

This section focuses on the `dfdl` Intellisense implementation.

#### High-level dfdl Intellisense Overview

This section providers a high-level view of the architecture of all relevant code items pertaining to the `dfdl` IntelliSense functionality.

##### Provider Registration (Start Here)

`src/language/dfdl.ts` is the starting point. It wires up the extension’s language features by calling VS Code registration APIs (e.g., `registerCompletionItemProvider`, `registerHoverProvider`, and similar) that are then customized as functions that provide customized provider functinoality.

In other words, `dfdl.ts` connects the provider implementations to VS Code for the DFDL language.

##### Provider Implementation Locations

Autocompletion logic is split into multiple provider modules under `src/language/providers/`, each handling different completion scenarios.

- `elementCompletion.ts` -- suggests child elements / element tags.
- `attributeCompletion.ts` -- suggests attribute names when inside an element.
- `attributeValueCompletion.ts` -- provides completion suggestions for attribute values (e.g., enumerated values).
- `closeElement.ts`, `closeElementSlash.ts` -- completions for closing tags and slash completions.
- `attributeHover.ts` -- hover provider that shows attribute documentation/available attributes.

It should be noted that there are many `registerCompletionItemProvider` calls. The implemented `completionItemProvider`s each contain logic to determine whether or not it the provider is relevant to a given situation or not.

##### Helpers + Vocabulary

`src/language/providers/utils.ts` and `src/language/providers/intellisense/commonItems.ts` contain shared helpers for constructing CompletionItem objects, and context parsing utilities used by many providers. For `src/language/providers/intellisense/commonItems.ts` and tracing through usage, it's used by `attributeCompletion.ts` and `elementCompletion.ts`.

`src/rootCompletion/utils.ts` contains utilities used for root-level completion logic (common completion primitives).

The code relies on project classes like schemaData (found under src/classes/schemaData.ts) and other "model" classes to know DFDL vocabulary (elements, attributes, properties). Those model classes hold the authoritative lists that the providers consult when building suggestions.

##### Context Parsing

Providers do lightweight parsing of the current document and cursor context (often using a small tokenizer / utility functions) to determine whether the cursor is:

- inside an element start tag
- inside attribute name or value
- within namespace/prefix context
- in text content (no suggestions)

This context detection guides which provider runs and how it filters suggestions.

##### Namespace / Prefix Handling

The code is able to determine the current element's namespace and the suggestions are able to insert the correct namespace or omit the namespace accordinly for attribute and element suggestions

##### Completions Construction

Providers build `vscode.CompletionItem` objects populated with:

- label, kind (element/attribute/snippet)
- insertText (text inserted when the user accepts the suggestion)
- sometimes additionalTextEdits or textEdit ranges to precisely replace text
- optional documentation or detail shown in the completion UI

Some items use resolveCompletionItem logic if additional data must be computed after selection.

##### Hover / Documentation

`attributeHover.ts` forms hover messages (Markdown strings) describing attributes available on a tag, DFDL property documentation, etc. Hover resolves current element context then gathers attribute docs and returns a `vscode.Hover` object.

Hover tooltips can be found under `attributeHoverValues()` in `attributeHoverItems.ts`.

##### Testing

`src/tests/suite/language/items.test.ts` contains unit-style checks that assert which items should be available in certain contexts -- useful to confirm the expected behavior of completion providers.

#### Individual File Deep-Dives

##### src/language/dfdl.ts

**Purpose:** The central registration file for all DFDL language features.

**Key Functionality:**

- **Starting Point:** It is executed during extension activation and registers the completion and hover providers with VS Code. This file is the “entry point” for Language features. If you want to change triggers or add another provider, this is the place to update.
- **Central Rgistration Point:**It imports provider modules (element, attribute, attributeValue, closeElement, attributeHover, etc.) and registers them with appropriate trigger characters (e.g., `<`, `:`, `"`, `=`, `/`, `whitespace`).
- **Wiring:**It does not perform completion logic itself — rather it wires VS Code events to the exported provider objects / functions in the provider modules.
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

- `nearestOpen()`: Finds the nearest unclosed XML element at cursor position
- `checkTagOpen()`: Determines if a tag is open at a given position with attribute discovery
- `cursorWithinQuotes()`: Detects if cursor is inside attribute value quotes
- `getNsPrefix()`: Retrieves namespace prefix for schema elements
- `createCompletionItem()`: Creates VS Code completion items from intellisense data

**Provider Checks:**

If you look at the structure of the `dfdl.ts`, it registers multiple providers. There checks to determine whether or not a certain provider's autocomplete suggestions are applicable to the siutaiton or not. This file's hlper functions provide check criterion.

### TDML

This section focuses on the `tdml` Intellisense implementation. It should be noted that the functionality is currently unused.
