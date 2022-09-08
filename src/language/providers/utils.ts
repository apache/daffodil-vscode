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
      triggerText.includes('<xs:element') &&
      !triggerText.includes('</xs:element') &&
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
        triggerText.includes('<xs:group') &&
        !triggerText.includes('</xs:group') &&
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
  var lineNum = position.line
  while (lineNum !== -1) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      triggerText.includes('<xs:element') &&
      (triggerText.includes('>') ||
        triggerText.includes('</xs:element') ||
        triggerText.includes('/>'))
    ) {
      return false
    }
    if (triggerText.includes('</xs:element>')) {
      return false
    }
    if (
      triggerText.includes('<xs:element') &&
      !triggerText.includes('</xs:element') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      (triggerText.includes('<xs:sequence') &&
        (triggerText.includes('</xs:sequence') ||
          triggerText.includes('/>'))) ||
      triggerText.includes('</xs:sequence>')
    ) {
      return false
    }
    if (
      triggerText.includes('<xs:sequence') &&
      !triggerText.includes('</xs:sequence') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      (triggerText.includes('<xs:choice') &&
        (triggerText.includes('</xs:choice') || triggerText.includes('/>'))) ||
      triggerText.includes('</xs:choice>')
    ) {
      return false
    }
    if (
      triggerText.includes('<xs:choice') &&
      !triggerText.includes('</xs:choice') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const triggerText = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)

    if (
      triggerText.includes('<xs:simpleType') &&
      !triggerText.includes('</xs:simpleType') &&
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
