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
import { queryXML } from 'xmlUtils'

// Method to create simple completion item given provided value and position
export function getSimpleCompletionItem(
  value: string,
  position: vscode.Position
): vscode.CompletionItem {
  let item = new vscode.CompletionItem(
    `${value}`,
    vscode.CompletionItemKind.Value
  )
  item.range = new vscode.Range(position, position)
  return item
}

// Method to get previous lines based on i.
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

// Method to get the schema path from the configuration file being edited
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
      schemaPath = currLine.text
        .replaceAll(' ', '')
        .replaceAll('"', '')
        .replaceAll(',', '')
        .replace('path:', '')
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
  tagName: string,
  attributeName: string
): string[] {
  const schemaPath = getSchemaPathFromLaunchJSON(document, position)

  return schemaPath == ''
    ? []
    : queryXML(
        fs.readFileSync(schemaPath).toString(),
        tagName,
        attributeName,
        false
      )
}
