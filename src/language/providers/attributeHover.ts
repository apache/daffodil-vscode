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
import { attributeHoverValues } from './intellisense/attributeHoverItems'
import { attributeCompletion } from './intellisense/attributeItems'

export function getAttributeHoverProvider() {
  return vscode.languages.registerHoverProvider('dfdl', {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ) {
      const range = document.getWordRangeAtPosition(position)
      const word = document.getText(range)

      let itemNames: string[] = []
      attributeCompletion('', '', 'dfdl', '', '').items.forEach((r) =>
        itemNames.push(r.item)
      )
      let testWord = ''
      if (word.length > 0) {
        if (!word.includes('dfdl:')) {
          testWord = 'dfdl:' + word
        } else {
          testWord = word
        }
        if (itemNames.includes(testWord)) {
          return new vscode.Hover({
            language: 'dfdl',
            value: attributeHoverValues(testWord),
          })
        }
      }
    },
  })
}
