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
  const triggerText = document.lineAt(lineNum).text
  while (triggerText.length === 0) {
    --lineNum
  }
  const previousLine = document.lineAt(lineNum).text
  return !(
    previousLine.includes('</') ||
    previousLine.includes('/>') ||
    ((triggerText.includes('element') ||
      triggerText.includes('sequence') ||
      triggerText.includes('choice') ||
      triggerText.includes('group') ||
      triggerText.includes('Variable')) &&
      (triggerText.includes('</') || triggerText.includes('/>')))
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
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'element') &&
      !triggerText.includes('</' + nsPrefix + 'element') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('element') && !triggerText.includes('/>')) {
      if (checkElementOpen(document, position)) {
        return 'element'
      }
    } else if (triggerText.includes('sequence') && !triggerText.includes('/>')) {
      if (checkSequenceOpen(document, position)) {
        return 'sequence'
      }
    } else if (triggerText.includes('choice') && !triggerText.includes('/>')) {
      if (checkChoiceOpen(document, position)) {
        return 'choice'
      }
    } else if (triggerText.includes('group')) {
      if (
        triggerText.includes('<' + nsPrefix + 'group') &&
        !triggerText.includes('</' + nsPrefix + 'group') &&
        !triggerText.includes('/>') &&
        !triggerText.includes('/')
      ) {
        return 'group'
      }
    } else if (triggerText.includes('simpleType') && !triggerText.includes('/>')) {
      if (checkSimpleTypeOpen(document, position)) {
        return 'simpleType'
      }
    } else if (
      triggerText.includes('defineVariable') &&
      !triggerText.includes('/>')
    ) {
      if (checkDefineVariableOpen(document, position)) {
        return 'defineVariable'
      }
    } else if (triggerText.includes('setVariable') && !triggerText.includes('/>')) {
      if (checkSetVariableOpen(document, position)) {
        return 'setVariable'
      }
    } else if (triggerText.includes('/>')) {
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
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'element') &&
      (triggerText.includes('>') ||
        triggerText.includes('</' + nsPrefix + 'element') ||
        triggerText.includes('/>'))
    ) {
      return false
    }
    if (triggerText.includes('</' + nsPrefix + 'element')) {
      return false
    }
    if (
      triggerText.includes('<' + nsPrefix + 'element') &&
      !triggerText.includes('</' + nsPrefix + 'element') &&
      !triggerText.includes('/>') &&
      !triggerText.includes('>')
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
    const triggerText = document.lineAt(lineNum).text
    if (
      (triggerText.includes('<' + nsPrefix + 'sequence') &&
        (triggerText.includes('</' + nsPrefix + 'sequence') ||
          triggerText.includes('/>'))) ||
      triggerText.includes('</' + nsPrefix + 'sequence>')
    ) {
      return false
    }
    if (
      triggerText.includes('<' + nsPrefix + 'sequence') &&
      !triggerText.includes('</' + nsPrefix + 'sequence') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    if (
      (triggerText.includes('<' + nsPrefix + 'choice') &&
        (triggerText.includes('</' + nsPrefix + 'choice') ||
          triggerText.includes('/>'))) ||
      triggerText.includes('</' + nsPrefix + 'choice>')
    ) {
      return false
    }
    if (
      triggerText.includes('<' + nsPrefix + 'choice') &&
      !triggerText.includes('</' + nsPrefix + 'choice') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'simpleType') &&
      !triggerText.includes('</' + nsPrefix + 'simpleType') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<dfdl:defineVariable') &&
      !triggerText.includes('</dfdl:defineVariable') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<dfdl:setVariable') &&
      !triggerText.includes('</dfdl:setVariable') &&
      !triggerText.includes('/>')
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
    const triggerText = document.lineAt(lineNum).text
    //.text.substring(0, document.lineAt(lineNum).range.end.character)

    if (
      triggerText.includes('"{') &&
      triggerText.includes('}"') &&
      triggerText.includes('..') &&
      !triggerText.includes('}"/') &&
      !triggerText.includes('>')
    ) {
      return true
    }
    if (
      triggerText.includes('"{') &&
      !triggerText.includes('}"') &&
      !triggerText.includes('}"/') &&
      !triggerText.includes('>')
    ) {
      return true
    }
    if (
      triggerText.includes('}"') &&
      !triggerText.includes('}"/') &&
      !triggerText.includes('>')
    ) {
      return true
    }
    if (
      triggerText.includes('}"') &&
      (triggerText.includes('}"/') ||
        triggerText.includes('>') ||
        triggerText.includes('/>'))
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
