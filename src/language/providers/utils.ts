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

//Checks if the line at the current position is the last opened tag
export function checkLastItemOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line
  const wholeLine = document
    .lineAt(lineNum)
    .text.substr(0, document.lineAt(lineNum).range.end.character)
  while (wholeLine.length === 0) {
    --lineNum
  }
  const previousLine = document
    .lineAt(lineNum)
    .text.substr(0, document.lineAt(lineNum - 1).range.end.character)
  if (
    previousLine.includes('</') ||
    previousLine.includes('/>') ||
    ((wholeLine.includes('element') ||
      wholeLine.includes('sequence') ||
      wholeLine.includes('choice') ||
      wholeLine.includes('group') ||
      wholeLine.includes('Variable')) &&
      (wholeLine.includes('</') || wholeLine.includes('/>')))
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
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      wholeLine.includes('<xs:element') &&
      !wholeLine.includes('</xs:element') &&
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
  while (lineNum !== -1) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)
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
        wholeLine.includes('<xs:group') &&
        !wholeLine.includes('</xs:group') &&
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
  var lineNum = position.line
  while (lineNum !== -1) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      wholeLine.includes('<xs:element') &&
      (wholeLine.includes('>') ||
        wholeLine.includes('</xs:element') ||
        wholeLine.includes('/>'))
    ) {
      return false
    }
    if (wholeLine.includes('</xs:element>')) {
      return false
    }
    if (
      wholeLine.includes('<xs:element') &&
      !wholeLine.includes('</xs:element') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      (wholeLine.includes('<xs:sequence') &&
        (wholeLine.includes('</xs:sequence') || wholeLine.includes('/>'))) ||
      wholeLine.includes('</xs:sequence>')
    ) {
      return false
    }
    if (
      wholeLine.includes('<xs:sequence') &&
      !wholeLine.includes('</xs:sequence') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    if (
      (wholeLine.includes('<xs:choice') &&
        (wholeLine.includes('</xs:choice') || wholeLine.includes('/>'))) ||
      wholeLine.includes('</xs:choice>')
    ) {
      return false
    }
    if (
      wholeLine.includes('<xs:choice') &&
      !wholeLine.includes('</xs:choice') &&
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
  var lineNum = position.line
  while (lineNum !== 0) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)

    if (
      wholeLine.includes('<xs:simpleType') &&
      !wholeLine.includes('</xs:simpleType') &&
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
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
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

export function checkBraceOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  var lineNum = position.line

  while (lineNum !== 0) {
    const wholeLine = document
      .lineAt(lineNum)
      .text.substring(0, document.lineAt(lineNum).range.end.character)

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
