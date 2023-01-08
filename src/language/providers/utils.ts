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
import { commonCompletion } from './intellisense/commonItems'

const schemaPrefixRegEx = new RegExp('</?(|[^ ]+:)schema')

// default namespace in the event that a namespace was not found
const defaultXsdNsPrefix = 'xs'

// Function to insert snippet to active editor
export function insertSnippet(snippetString: string, backpos: vscode.Position) {
  vscode.window.activeTextEditor?.insertSnippet(
    new vscode.SnippetString(snippetString),
    backpos
  )
}

//Checks if the line at the current position is the last opened tag
export function checkLastItemOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  const wholeLine = document.lineAt(lineNum).text
  while (wholeLine.length === 0) {
    --lineNum
  }
  const previousLine = document.lineAt(lineNum).text
  return !(
    previousLine.includes('</') ||
    previousLine.includes('/>') ||
    ((wholeLine.includes('element') ||
      wholeLine.includes('sequence') ||
      wholeLine.includes('choice') ||
      wholeLine.includes('group') ||
      wholeLine.includes('Variable')) &&
      (wholeLine.includes('</') || wholeLine.includes('/>')))
  )
}

export function lineCount(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  var lineCount = 0
  const nsPrefix = getXsdNsPrefix(document, position)
  while (lineNum !== 0) {
    --lineNum
    ++lineCount
    const wholeLine = document.lineAt(lineNum).text
    if (
      wholeLine.includes('<' + nsPrefix + 'element') &&
      !wholeLine.includes('</' + nsPrefix + 'element') &&
      !wholeLine.includes('/>')
    ) {
      return lineCount
    }
  }
  return lineCount
}

export function nearestOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  const nsPrefix = getXsdNsPrefix(document, position)
  while (lineNum !== -1) {
    const wholeLine = document.lineAt(lineNum).text
    if (wholeLine.includes('element') && !wholeLine.includes('/>')) {
      if (checkElementOpen(document, position)) {
        return 'element'
      }
    } else if (wholeLine.includes('sequence') && !wholeLine.includes('/>')) {
      if (checkSequenceOpen(document, position)) {
        return 'sequence'
      }
    } else if (wholeLine.includes('choice') && !wholeLine.includes('/>')) {
      if (checkChoiceOpen(document, position)) {
        return 'choice'
      }
    } else if (wholeLine.includes('group')) {
      if (
        wholeLine.includes('<' + nsPrefix + 'group') &&
        !wholeLine.includes('</' + nsPrefix + 'group') &&
        !wholeLine.includes('/>') &&
        !wholeLine.includes('/')
      ) {
        return 'group'
      }
    } else if (wholeLine.includes('simpleType') && !wholeLine.includes('/>')) {
      if (checkSimpleTypeOpen(document, position)) {
        return 'simpleType'
      }
    } else if (
      wholeLine.includes('defineVariable') &&
      !wholeLine.includes('/>')
    ) {
      if (checkDefineVariableOpen(document, position)) {
        return 'defineVariable'
      }
    } else if (wholeLine.includes('setVariable') && !wholeLine.includes('/>')) {
      if (checkSetVariableOpen(document, position)) {
        return 'setVariable'
      }
    } else if (wholeLine.includes('/>')) {
      return 'none'
    }
    --lineNum
  }
  return 'none'
}

export function checkElementOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const nsPrefix = getXsdNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== -1) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      wholeLine.includes('<' + nsPrefix + 'element') &&
      (wholeLine.includes('>') ||
        wholeLine.includes('</' + nsPrefix + 'element') ||
        wholeLine.includes('/>'))
    ) {
      return false
    }
    if (wholeLine.includes('</' + nsPrefix + 'element')) {
      return false
    }
    if (
      wholeLine.includes('<' + nsPrefix + 'element') &&
      !wholeLine.includes('</' + nsPrefix + 'element') &&
      !wholeLine.includes('/>') &&
      !wholeLine.includes('>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}

export function checkSequenceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const nsPrefix = getXsdNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      (wholeLine.includes('<' + nsPrefix + 'sequence') &&
        (wholeLine.includes('</' + nsPrefix + 'sequence') ||
          wholeLine.includes('/>'))) ||
      wholeLine.includes('</' + nsPrefix + 'sequence>')
    ) {
      return false
    }
    if (
      wholeLine.includes('<' + nsPrefix + 'sequence') &&
      !wholeLine.includes('</' + nsPrefix + 'sequence') &&
      !wholeLine.includes('/>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}

export function checkChoiceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const nsPrefix = getXsdNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      (wholeLine.includes('<' + nsPrefix + 'choice') &&
        (wholeLine.includes('</' + nsPrefix + 'choice') ||
          wholeLine.includes('/>'))) ||
      wholeLine.includes('</' + nsPrefix + 'choice>')
    ) {
      return false
    }
    if (
      wholeLine.includes('<' + nsPrefix + 'choice') &&
      !wholeLine.includes('</' + nsPrefix + 'choice') &&
      !wholeLine.includes('/>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}
export function checkSimpleTypeOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const nsPrefix = getXsdNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      wholeLine.includes('<' + nsPrefix + 'simpleType') &&
      !wholeLine.includes('</' + nsPrefix + 'simpleType') &&
      !wholeLine.includes('/>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}

export function checkDefineVariableOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      wholeLine.includes('<dfdl:defineVariable') &&
      !wholeLine.includes('</dfdl:defineVariable') &&
      !wholeLine.includes('/>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}

export function checkSetVariableOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    if (
      wholeLine.includes('<dfdl:setVariable') &&
      !wholeLine.includes('</dfdl:setVariable') &&
      !wholeLine.includes('/>')
    ) {
      return true
    }
    --lineNum
  }
  return false
}

//returns an empty value or a prefix plus a colon
export function getXsdNsPrefix(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var initialLineNum = position.line
  var lineNum = 0
  while (initialLineNum !== 0 && lineNum <= initialLineNum) {
    const lineText = document.lineAt(lineNum).text
    // returns either empty prefix value or a prefix plus a colon
    let text = lineText.match(schemaPrefixRegEx)
    if (text != null) {
      return text[1]
    }
    ++lineNum
  }
  //returns the standard prefix plus a colon in the case of missing schema tag
  return defaultXsdNsPrefix + ':'
}

export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line

  while (lineNum !== 0) {
    const wholeLine = document.lineAt(lineNum).text
    //.text.substring(0, document.lineAt(lineNum).range.end.character)

    if (
      wholeLine.includes('"{') &&
      wholeLine.includes('}"') &&
      wholeLine.includes('..') &&
      !wholeLine.includes('}"/') &&
      !wholeLine.includes('>')
    ) {
      return true
    }
    if (
      wholeLine.includes('"{') &&
      !wholeLine.includes('}"') &&
      !wholeLine.includes('}"/') &&
      !wholeLine.includes('>')
    ) {
      return true
    }
    if (
      wholeLine.includes('}"') &&
      !wholeLine.includes('}"/') &&
      !wholeLine.includes('>')
    ) {
      return true
    }
    if (
      wholeLine.includes('}"') &&
      (wholeLine.includes('}"/') ||
        wholeLine.includes('>') ||
        wholeLine.includes('/>'))
    ) {
      return false
    }
    --lineNum
  }
  return false
}

export function createCompletionItem(
  e:
    | {
        item: string
        snippetString: string
        markdownString: string
      }
    | {
        item: string
        snippetString: string
        markdownString: undefined
      },
  preVal: string,
  nsPrefix: string
) {
  const completionItem = new vscode.CompletionItem(e.item)

  const noPreVals = [
    'dfdl:choiceBranchKey=',
    'dfdl:representation',
    'dfdl:choiceDispatchKey=',
    'dfdl:simpleType',
    nsPrefix + 'restriction',
  ]

  if (preVal !== '' && !noPreVals.includes(e.item)) {
    completionItem.insertText = new vscode.SnippetString(
      preVal + e.snippetString
    )
  } else {
    completionItem.insertText = new vscode.SnippetString(e.snippetString)
  }

  if (e.markdownString) {
    completionItem.documentation = new vscode.MarkdownString(e.markdownString)
  }

  return completionItem
}

export function getCommonItems(
  itemsToUse: string[],
  preVal: string = '',
  additionalItems: string = '',
  nsPrefix: string
) {
  let compItems: vscode.CompletionItem[] = []

  commonCompletion(additionalItems, nsPrefix).items.forEach((e) => {
    if (itemsToUse.includes(e.item)) {
      const completionItem = createCompletionItem(e, preVal, nsPrefix)
      compItems.push(completionItem)
    }
  })

  return compItems
}
