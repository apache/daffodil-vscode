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
  const nsPrefix = getXsdNsPrefix(document, position)
  const triggerText = document.lineAt(lineNum).text.trim()
  while (triggerText.length === 0) {
    --lineNum
  }
  if (lineNum > 0 && triggerText.lastIndexOf('<') == 0) {
    const previousLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum - 1).range.end.character)
    if (
      (previousLine.includes('</') ||
        previousLine.includes('/>') ||
        triggerText.includes('element') ||
        triggerText.includes('sequence') ||
        triggerText.includes('choice') ||
        triggerText.includes('group') ||
        triggerText.includes('Variable')) &&
      (triggerText.includes('</') || triggerText.includes('/>'))
    ) {
      return false
    }
  }
  if (
    triggerText.lastIndexOf('<') > 0 &&
    triggerText.lastIndexOf('>') < triggerText.lastIndexOf('<')
  ) {
    const lastOpenItem = triggerText.substring(
      triggerText.indexOf('<'),
      triggerText.length - triggerText.lastIndexOf('<')
    )
    if (
      (lastOpenItem.includes('<' + nsPrefix + 'group') &&
        !triggerText.includes('</' + nsPrefix + 'group')) ||
      (lastOpenItem.includes('<' + nsPrefix + 'sequence') &&
        !triggerText.includes('</' + nsPrefix + 'sequence')) ||
      (lastOpenItem.includes('<' + nsPrefix + 'choice') &&
        !triggerText.includes('</' + nsPrefix + 'choice')) ||
      (lastOpenItem.includes('<' + nsPrefix + 'element') &&
        !triggerText.includes('</' + nsPrefix + 'element')) ||
      lastOpenItem.includes('Variable')
    ) {
      return true
    }
  }
  return true
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
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  const nsPrefix = getXsdNsPrefix(document, position)
  if (itemsOnLine > 1) {
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('<' + nsPrefix + 'element')) {
      const tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'element')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
          !triggerText.includes('</' + nsPrefix + 'element')
        ) {
          return 'element'
        }
      }
    }
    if (triggerText.includes('<' + nsPrefix + 'sequence')) {
      const tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'sequence')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
          !triggerText.includes('</' + nsPrefix + 'sequence')
        ) {
          return 'sequence'
        }
      }
    }
    if (triggerText.includes('<' + nsPrefix + 'choice')) {
      const tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'choice')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
          !triggerText.includes('</' + nsPrefix + 'choice')
        ) {
          return 'choice'
        }
      }
    }
    if (triggerText.includes('<' + nsPrefix + 'group')) {
      const tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'group')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
          !triggerText.includes('</' + nsPrefix + 'group')
        ) {
          return 'group'
        }
      }
    }
    if (triggerText.includes('<' + nsPrefix + 'simpleType')) {
      const tagPos = triggerText.lastIndexOf('<' + nsPrefix + 'simpleType')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          !triggerText.substr(tagEndPos - 1, 2).includes('/>') &&
          !triggerText.includes('</' + nsPrefix + 'simpleType')
        ) {
          return 'simpleType'
        }
      }
    }
  }
  while (lineNum !== -1) {
    var triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('element')) {
      if (checkElementOpen(document, position)) {
        return 'element'
      }
    } else if (triggerText.includes('sequence')) {
      if (checkSequenceOpen(document, position)) {
        return 'sequence'
      }
    } else if (triggerText.includes('choice')) {
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
    } else if (triggerText.includes('simpleType')) {
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
    } else if (triggerText.includes('setVariable')) {
      if (checkSetVariableOpen(document, position)) {
        return 'setVariable'
      }
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
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)

  if (itemsOnLine > 1) {
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('<' + nsPrefix + 'element')) {
      const tagPos = triggerText.indexOf('<' + nsPrefix + 'element')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          triggerText.substring(tagEndPos - 1, 2).includes('/>') ||
          triggerText
            .substring(tagEndPos + 1, triggerText.length - (tagEndPos + 1))
            .includes('<' + nsPrefix + 'element') ||
          triggerText.includes('</' + nsPrefix + 'element>')
        ) {
          return false
        } else {
          return true
        }
      }
    }
  }

  while (lineNum !== -1) {
    var triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'element') &&
      triggerText.indexOf('<' + nsPrefix + 'element') ==
        triggerText.lastIndexOf('<') &&
      triggerText.lastIndexOf('>') > triggerText.lastIndexOf('<')
    ) {
      return true
    }
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
      !triggerText.includes('/element>')
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
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)

  if (itemsOnLine > 1) {
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('<' + nsPrefix + 'sequence')) {
      const tagPos = triggerText.indexOf('<' + nsPrefix + 'sequence')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          triggerText.substring(tagEndPos - 1, 2).includes('/>') ||
          triggerText
            .substring(tagEndPos + 1, triggerText.length - (tagEndPos + 1))
            .includes('<' + nsPrefix + 'sequence') ||
          triggerText.includes('</' + nsPrefix + 'sequence>')
        ) {
          return false
        } else {
          return true
        }
      }
    }
  }
  while (lineNum !== -1) {
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'sequence') &&
      triggerText.indexOf('<' + nsPrefix + 'sequence') ==
        triggerText.lastIndexOf('<') &&
      triggerText.lastIndexOf('>') < triggerText.lastIndexOf('<')
    ) {
      return true
    }
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
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)

  if (itemsOnLine > 1) {
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('<' + nsPrefix + 'choice')) {
      const tagPos = triggerText.indexOf('<' + nsPrefix + 'choice')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          triggerText.substring(tagEndPos - 1, 2).includes('/>') ||
          triggerText
            .substring(tagEndPos + 1, triggerText.length - (tagEndPos + 1))
            .includes('<' + nsPrefix + 'choice')
        ) {
          return false
        } else {
          return true
        }
      }
    }
  }
  while (lineNum !== -1) {
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'choice') &&
      triggerText.indexOf('<' + nsPrefix + 'choice') ==
        triggerText.lastIndexOf('<') &&
      triggerText.lastIndexOf('>') < triggerText.lastIndexOf('<')
    ) {
      return true
    }
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
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)

  if (itemsOnLine > 1) {
    const triggerText = document.lineAt(lineNum).text
    if (triggerText.includes('<' + nsPrefix + 'simpleType')) {
      const tagPos = triggerText.indexOf('<' + nsPrefix + 'simpleType')
      const tagEndPos = triggerText.indexOf('>', tagPos)
      if (tagPos != -1) {
        if (
          triggerText.substring(tagEndPos - 1, 2).includes('/>') ||
          triggerText
            .substring(tagEndPos + 1, triggerText.length - (tagEndPos + 1))
            .includes('<' + nsPrefix + 'simpleType')
        ) {
          return false
        } else {
          return true
        }
      }
    }
  }
  while (lineNum !== -1) {
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + 'simpletype') &&
      triggerText.indexOf('<' + nsPrefix + 'simpleType') ==
        triggerText.lastIndexOf('<') &&
      triggerText.lastIndexOf('>') < triggerText.lastIndexOf('<')
    ) {
      return true
    }
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

export function getItemsOnLineCount(triggerText: String) {
  var itemsOnLine = 0
  var nextPos = 0
  var result = 0
  while (result != -1) {
    result = triggerText.indexOf('<', nextPos)
    nextPos = result + 1
    if (result != -1) {
      ++itemsOnLine
    }
  }
  return itemsOnLine
}

export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line

  while (lineNum !== 0) {
    const triggerText = document.lineAt(lineNum).text
    //.text.substring(0, document.lineAt(lineNum).range.end.character)

    if (!triggerText.includes('{')) {
      return false
    }
    if (
      triggerText.includes('"{') &&
      triggerText.includes('}"') &&
      (triggerText.includes('..') || triggerText.includes('.')) &&
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
      triggerText
        .substr(
          triggerText.lastIndexOf('{'),
          triggerText.indexOf('}', triggerText.lastIndexOf('{'))
        )
        .includes('/')
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
