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
import { getSimpleCompletionItem, getPossibleItems } from './utils'

export function checkForRootNameItems(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.CompletionItem[] {
  if (
    !document.fileName.includes('launch.json') ||
    !document.lineAt(position).text.includes('"rootName"')
  )
    return []

  const possibleRootNames: string[] = getPossibleItems(
    document,
    position,
    'xs:element',
    'name'
  )

  return possibleRootNames.map((prn) => getSimpleCompletionItem(prn, position))
}

export function getRootNameCompletionProviders() {
  return [
    vscode.languages.registerCompletionItemProvider(
      { language: 'jsonc' },
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          return checkForRootNameItems(document, position)
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
          return checkForRootNameItems(document, position)
        },
      },
      '"' // trigger
    ),
  ]
}
