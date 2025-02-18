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

import * as fs from 'fs'
import * as vscode from 'vscode'
import { XMLParser } from 'fast-xml-parser'

// Method to create simple completion item given provided value and position
export function getSimpleCompletionItem(
  document: vscode.TextDocument,
  position: vscode.Position,
  value: string
): vscode.CompletionItem {
  let item = new vscode.CompletionItem(
    `${value}`,
    vscode.CompletionItemKind.Value
  )
  const text = item.label.toString()

  const before =
    position.character > 0
      ? document.getText(new vscode.Range(position.translate(0, -1), position))
      : ''
  const after = document.getText(
    new vscode.Range(position, position.translate(0, 1))
  )

  // Check if already wrapped in quotes
  const alreadyWrapped = before === '"' && after === '"'

  // If not wrapped in quotes add double quotes to before and after text
  item.insertText = !alreadyWrapped ? `"${text}"` : text

  item.range = new vscode.Range(position, position)
  return item
}

/* Method to get previous lines based on i.
 *
 * The reason for going 4 lines back is because the schema object only has
 * 3 sub properties. So, this mean the schema object should technically
 * not be anymore than 3 or 4 lines back from where the path attribute is set.
 */
function getPrevLines(
  document: vscode.TextDocument,
  i: number
): vscode.TextLine[] {
  let prevLines: vscode.TextLine[] = []

  for (var j = 0; j < 4; j++) {
    if (i > j) {
      prevLines.push(document.lineAt(i - (j + 1)))
    }
  }

  return prevLines
}

/* Method to get the schema path from the configuration file being edited.
 *
 * The reason for going 4 lines back is because the schema object only has
 * 3 sub properties. So, this mean the schema object should technically
 * not be anymore than 3 or 4 lines back from where the path attribute is set.
 */
export function getSchemaPathFromLaunchJSON(
  document: vscode.TextDocument,
  position: vscode.Position
): string {
  let schemaPath = ''

  for (var i = position.line - 4; i < position.line; i++) {
    if (i <= 0) continue

    let currLine = document.lineAt(i)
    if (!currLine.text.includes('path')) continue

    const prevLines = getPrevLines(document, i)

    let isUnderSchema =
      prevLines
        .map((prevLines) => prevLines.text.includes('schema'))
        .filter((b) => b == true).length > 0

    if (isUnderSchema) {
      const regex = /(["'])path\1\s*:\s*(["'])(.*?)\2/
      const match = currLine.text.match(regex)

      schemaPath = match ? JSON.parse(`{${match[0]}}`).path : ''
    }
  }

  return schemaPath.includes('${workspaceFolder}') &&
    vscode.workspace.workspaceFolders
    ? schemaPath.replace(
        '${workspaceFolder}',
        vscode.workspace.workspaceFolders[0].uri.fsPath
      )
    : schemaPath
}

// Method to get the possible items
export function getPossibleItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  findRootNamespace: boolean
): string[] {
  const schemaPath = getSchemaPathFromLaunchJSON(document, position)

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (name) => name == 'element',
  })

  const fileData = schemaPath === '' ? '' : fs.readFileSync(schemaPath)
  if (fileData === '') return []

  const obj = parser.parse(fileData)

  if (obj && typeof obj === 'object') {
    return findRootNamespace
      ? [obj['schema']['@_targetNamespace']]
      : obj['schema']['element'].map((e) => e['@_name'])
  }

  return []
}

export function checkForItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  includeText: string
): vscode.CompletionItem[] {
  if (
    !document.fileName.includes('launch.json') ||
    !document.lineAt(position).text.includes(`"${includeText}"`)
  )
    return []

  const possibleItems: string[] = getPossibleItems(
    document,
    position,
    includeText.includes('rootNamespace')
  )

  return possibleItems.map((prn) =>
    getSimpleCompletionItem(document, position, prn)
  )
}

export function getCompletionProviders(includeText: string) {
  return [
    vscode.languages.registerCompletionItemProvider(
      { language: 'jsonc' },
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          return checkForItems(document, position, includeText)
        },
      },
      '"' // trigger
    ),
    vscode.languages.registerCompletionItemProvider(
      { language: 'json' },
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          return checkForItems(document, position, includeText)
        },
      },
      '"' // trigger
    ),
  ]
}
