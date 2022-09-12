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

// Function to insert snippet to active editor
export function insertSnippet(snippetString: string, backpos: vscode.Position) {
  vscode.window.activeTextEditor?.insertSnippet(
    new vscode.SnippetString(snippetString),
    backpos
  )
}

//Checks if the text at the current position is the last opened tag
export function checkLastItemOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  const triggerText = document
    .lineAt(lineNum)
    .text.substr(0, document.lineAt(lineNum).range.end.character)
  while (triggerText.length === 0) {
    --lineNum
  }
  if (lineNum > 0) {
    const previousLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum - 1).range.end.character)
    if (
      previousLine.includes('</') ||
      previousLine.includes('/>') ||
      ((triggerText.includes('element') ||
        triggerText.includes('sequence') ||
        triggerText.includes('choice') ||
        triggerText.includes('group') ||
        triggerText.includes('Variable')) &&
        (triggerText.includes('</') || triggerText.includes('/>')))
    ) {
      return false
    }
  }
  if (triggerText.lastIndexOf('<') > 0) {
    const multiComponent = triggerText.substring(0, triggerText.indexOf('<'))
    if (
      multiComponent.includes('/') &&
      (multiComponent.includes('element') ||
        multiComponent.includes('sequence') ||
        multiComponent.includes('choice') ||
        multiComponent.includes('group') ||
        multiComponent.includes('Variable'))
    ) {
      return false
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
  while (lineNum !== 0) {
    --lineNum
    ++lineCount
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      triggerText.match(new RegExp('<.*element')) &&
      !triggerText.match(new RegExp('</.*element')) &&
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
  const nsPrefix = getNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== -1) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
    if (triggerText.includes('element') && !triggerText.includes('/>')) {
      if (checkElementOpen(document, position)) {
        return 'element'
      }
    } else if (
      triggerText.includes('sequence') &&
      !triggerText.includes('/>')
    ) {
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
    } else if (
      triggerText.includes('simpleType') &&
      !triggerText.includes('/>')
    ) {
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
    } else if (
      triggerText.includes('setVariable') &&
      !triggerText.includes('/>')
    ) {
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
  const nsPrefix = getNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== -1) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    const testText = '<' + nsPrefix + 'element'
    console.log(testText)
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
  const nsPrefix = getNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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
  const nsPrefix = getNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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
  const nsPrefix = getNsPrefix(document, position)
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)

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
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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

export function getNsPrefix(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var nsPrefix = ''
  var initialLineNum = position.line
  var lineNum = 0
  while (initialLineNum !== 0) {
    const lineText = document
      .lineAt(0)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (lineText.includes('<schema')) {
      return nsPrefix
    }
    if (lineText.match(new RegExp('<.*:schema'))) {
      nsPrefix = lineText.substring(
        lineText.indexOf('<') + 1,
        lineText.indexOf(':') + 1
      )
      return nsPrefix
    }
    ++lineNum
  }
  return nsPrefix
}

export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line

  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)

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
