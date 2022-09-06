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
import { Data } from './xpLexer'

export class XPathDocumentChangeHandler {
  public async onDocumentChange(e: vscode.TextDocumentChangeEvent) {
    let activeChange = e.contentChanges[0]
    if (!activeChange) {
      return
    }
    let doTrigger = false
    const docText = e.document.getText()

    let precededByWS = false
    let followsSeparator = false
    const pos = activeChange.rangeOffset - 1
    let wsEndPos = -1
    let keywordPos = -1
    let keyword: string | undefined
    let separatorChar: string | undefined

    const char = activeChange.text
    let charIsWs = char === ' ' || char === '\t' || char === '\n'

    for (let x = pos; x > -1; x--) {
      const char = docText.charAt(x)
      if (char === ' ' || char === '\t' || char === '\n') {
        precededByWS = true
        if (keywordPos !== -1) {
          break
        }
      } else if (Data.anySeps.indexOf(char) !== -1) {
        followsSeparator = true
        separatorChar = char
        break
      } else if (charIsWs) {
        if (wsEndPos === -1) {
          wsEndPos = x + 1
        }
        keywordPos = x
      } else {
        break
      }
    }
    keyword =
      keywordPos !== -1 ? docText.substring(keywordPos, wsEndPos) : undefined

    if (charIsWs) {
      doTrigger =
        followsSeparator ||
        (keyword !== undefined && Data.triggerWords.indexOf(keyword) !== -1)
    } else if (
      char === '$' ||
      char === '/' ||
      char === '[' ||
      char === '?' ||
      char === '@'
    ) {
      doTrigger = true
    } else if (followsSeparator && char === ':' && separatorChar === ':') {
      doTrigger = true
    } else {
      doTrigger = precededByWS && followsSeparator
    }

    console.log('doTrigger', doTrigger)

    if (doTrigger) {
      setTimeout(() => {
        vscode.commands.executeCommand('editor.action.triggerSuggest')
      }, 10)
      return
    }
  }
}
