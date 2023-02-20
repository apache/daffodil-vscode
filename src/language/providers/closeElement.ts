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
import { checkMissingCloseTag } from './closeUtils'
import {
  getXsdNsPrefix,
  insertSnippet,
  getItemsOnLineCount,
  getItemPrefix,
} from './utils'

export function getCloseElementProvider() {
  return vscode.languages.registerCompletionItemProvider(
    'dfdl',
    {
      async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        let backpos = position.with(position.line, position.character)
        let backpos3 = position.with(position.line, position.character)

        if (position.character > 0) {
          backpos = position.with(position.line, position.character - 1)
        }
        if (position.character > 2) {
          backpos3 = position.with(position.line, position.character - 3)
        }
        let nsPrefix = getXsdNsPrefix(document, position)
        const origPrefix = nsPrefix

        const nearestTagNotClosed = checkMissingCloseTag(
          document,
          position,
          nsPrefix
        )
        nsPrefix = getItemPrefix(nearestTagNotClosed, origPrefix)
        const triggerText = document
          .lineAt(position)
          .text.substring(0, position.character)

        let itemsOnLine = getItemsOnLineCount(triggerText)

        if (nearestTagNotClosed.includes('none')) {
          return undefined
        }

        if (
          (triggerText.endsWith('>') && itemsOnLine < 2) ||
          (triggerText.endsWith('>>') && itemsOnLine > 1) ||
          (triggerText.endsWith('.=>') && itemsOnLine === 0)
        ) {
          let range = new vscode.Range(backpos, position)

          await vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.replace(range, '')
          })

          checkItemsOnLine(
            document,
            position,
            range,
            itemsOnLine,
            triggerText,
            nsPrefix,
            nearestTagNotClosed,
            backpos,
            backpos3
          )
        }

        return undefined
      },
    },
    '>' // triggered whenever a '>' is typed
  )
}

function checkItemsOnLine(
  document: vscode.TextDocument,
  position: vscode.Position,
  range: vscode.Range,
  itemsOnLine: number,
  triggerText: string,
  nsPrefix: string,
  nearestTagNotClosed: string,
  backpos: vscode.Position,
  backpos3: vscode.Position
) {
  if (itemsOnLine == 0 && !triggerText.includes('</')) {
    insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>$0', backpos3)
  }

  if (itemsOnLine === 1 && !triggerText.includes('</')) {
    checkNearestTagNotClosed(
      document,
      position,
      range,
      nearestTagNotClosed,
      backpos,
      nsPrefix
    )
  }

  if (itemsOnLine > 1) {
    checkTriggerText(triggerText, nsPrefix, backpos, nearestTagNotClosed)
  }
}

function checkNearestTagNotClosed(
  document: vscode.TextDocument,
  position: vscode.Position,
  range: vscode.Range,
  nearestTagNotClosed: string,
  backpos: vscode.Position,
  nsPrefix: string
) {
  if (
    nearestTagNotClosed.includes('defineVariable') ||
    nearestTagNotClosed.includes('setVariable')
  ) {
    let startPos = document.lineAt(position).text.indexOf('<', 0)

    insertSnippet('>\n</dfdl:' + nearestTagNotClosed + '>', backpos)

    let backpos2 = position.with(position.line + 2, startPos - 2)
    insertSnippet('</' + nsPrefix + 'appinfo>\n', backpos2)

    let backpos3 = position.with(position.line + 3, startPos - 4)
    insertSnippet('</' + nsPrefix + 'annotation>$0', backpos3)
  }

  if (!nearestTagNotClosed.includes('Variable')) {
    insertSnippet('>\n</' + nsPrefix + nearestTagNotClosed + '>', backpos)
  }
}

function checkTriggerText(
  triggerText: string,
  nsPrefix: string,
  backpos: vscode.Position,
  nearestTagNotClosed: string
) {
  if (triggerText.includes('<' + nsPrefix + nearestTagNotClosed)) {
    let tagPos = triggerText.lastIndexOf('<' + nsPrefix + nearestTagNotClosed)
    let tagEndPos = triggerText.indexOf('>', tagPos)
    if (
      tagPos != -1 &&
      !triggerText.substring(tagEndPos - 1, 2).includes('/>') &&
      !triggerText
        .substring(tagEndPos)
        .includes('</' + nsPrefix + nearestTagNotClosed)
    ) {
      if (triggerText.endsWith('>>')) {
        insertSnippet('</' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      } else {
        insertSnippet('></' + nsPrefix + nearestTagNotClosed + '>$0', backpos)
      }
    }
  }
}
