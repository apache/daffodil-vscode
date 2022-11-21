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
import { insertSnippet } from './utils'

export function getEndSingleBraceProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const wholeLine = document
          .lineAt(position)
          .text.substring(0, position.character)
        if (
          wholeLine.includes('dfdl:length="{') ||
          wholeLine.includes('dfdl:choiceDispatchKey="{')
        ) {
          insertSnippet('$1}$0', position)
        }
        return undefined
      },
    },
    '{'
  )
}
