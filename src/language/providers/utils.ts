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

export function lineCount(
  document: vscode.TextDocument,
  position: vscode.Position,
  tag: string
) {
  let lineNum = position.line
  let lineCount = 0
  const nsPrefix = getXsdNsPrefix(document, position)
  while (lineNum !== 0) {
    --lineNum
    ++lineCount
    const triggerText = document.lineAt(lineNum).text
    if (
      triggerText.includes('<' + nsPrefix + tag) &&
      !triggerText.includes('</' + nsPrefix + tag) &&
      !triggerText.includes('/>')
    ) {
      return lineCount
    }
  }
  return lineCount
}

export function isBetweenOpenCloseTags(
  document: vscode.TextDocument,
  position: vscode.Position,
  tag: string,
  startLine: number
) {
  let lineNum = position.line
  let itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  const nsPrefix = getXsdNsPrefix(document, position)
  const triggerLine = position.line
  const triggerPos = position.character
  let triggerText = document.lineAt(lineNum).text
  const textBeforeTrigger = triggerText.substring(0, triggerPos)
  let tagPos = textBeforeTrigger.lastIndexOf('<' + nsPrefix + tag)
  let tagEndPos = triggerText.indexOf('>', tagPos)
  let selfClosingTagPos = triggerText.indexOf('/>', tagPos)
  let closingTagPos = triggerText.indexOf('</' + nsPrefix + tag, tagEndPos)
  let closingTagEndPos = triggerText.indexOf('>', closingTagPos)
  if (closingTagPos === -1) {
    closingTagEndPos = -1
  }
  if (itemsOnLine > 1 && lineNum != -1) {
    //if there are multiple tags on the line, and the trigger is
    //between the open and close tags
    if (
      (selfClosingTagPos !== -1 && triggerPos < tagEndPos) ||
      (triggerPos > tagEndPos && triggerPos <= closingTagPos) ||
      (triggerPos > tagEndPos && closingTagPos === -1)
    ) {
      return true
    }
  } else {
    let currentText = ''
    //if triggerLine equals startLine and the triggerLine
    // is selfClosing the tag is not btwn open and close tags
    if (
      triggerText.includes('/>') &&
      triggerText.includes(tag) &&
      startLine === triggerLine &&
      (triggerPos <= tagPos || triggerPos >= closingTagEndPos)
    ) {
      return true
    }
    //If the the TriggerLine is a closing tag and the closing tag
    //matches this open tag the trigger is btwn open and close tags
    if (
      triggerText.includes('</') &&
      triggerText.includes(tag) &&
      startLine < triggerLine
    ) {
      return true
    }
    //if the opening tag is before the trigger and the closing tag
    //is after the trigger, the trigger is btwn open and close tags
    //don't evaluate lines with multiple tags
    if (startLine <= triggerLine) {
      lineNum = startLine
      while (lineNum > -1 && lineNum < document.lineCount - 1) {
        ++lineNum
        currentText = document.lineAt(lineNum).text
        itemsOnLine = getItemsOnLineCount(currentText)
        if (currentText.includes('</' + nsPrefix + tag) && itemsOnLine < 2) {
          return true
        }
      }
    }
  }
  return false
}

export function checkMissingCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string
) {
  const triggerLine = position.line
  const triggerPos = position.character
  const triggerText = document.lineAt(triggerLine).text
  const itemsOnLine = getItemsOnLineCount(triggerText)
  const items = [
    'schema',
    'element',
    'sequence',
    'choice',
    'group',
    'simpleType',
    'complexType',
    'annotation',
    'assert',
    'discriminator',
    'defineVariable',
    'setVariable',
  ]
  //let test = ''
  let currentLine = triggerLine
  let currentText = triggerText
  let lineBefore = triggerLine
  let lineAfter = triggerLine
  let openTagArray: number[] = []
  let closeTagArray: number[] = []
  let nextCloseTagPos = 0
  let ic = 0
  let io = 0
  for (let i = 0; i < items.length; ++i) {
    const textBeforeTrigger = triggerText.substring(0, triggerPos)
    if (itemsOnLine > 1) {
      if (textBeforeTrigger.lastIndexOf('<' + nsPrefix + items[i]) > -1) {
        let nextCloseCharPos = 0
        let nextOpenTagPos = 0
        while (
          (nextOpenTagPos = triggerText.indexOf(
            '<' + nsPrefix + items[i],
            nextOpenTagPos
          )) > -1
        ) {
          openTagArray.push(nextOpenTagPos)
          if (
            (nextCloseCharPos = triggerText.indexOf('>', nextOpenTagPos)) > -1
          ) {
            //if tag is self closing remove it from the openTagArray
            if (triggerText.substring(nextCloseCharPos - 1, 2) === '/>') {
              openTagArray.splice(-1, 1)
            }
            nextOpenTagPos = nextOpenTagPos + 1
          }
        }
        while (
          (nextCloseTagPos = triggerText.indexOf(
            '</' + nsPrefix + items[i],
            nextCloseTagPos
          )) > -1
        ) {
          closeTagArray.push(nextCloseTagPos)
          nextCloseTagPos = nextCloseTagPos + 1
        }
        if (openTagArray.length > closeTagArray.length) {
          if (triggerPos > closeTagArray[closeTagArray.length]) {
            return items[i]
          }
          while (closeTagArray.length > 0 && openTagArray.length > 0) {
            //if the closing tag is before the trigger position
            //and there is an opening tag before that closing tag
            //remove the last opening tag before that first closing tag
            //from the array otherwise remove the closing tag from
            //the array
            ic = 0
            io = openTagArray.length
            while (ic < closeTagArray.length) {
              if (closeTagArray[ic] <= triggerPos) {
                while (io < 0) {
                  if (openTagArray[io] < closeTagArray[ic]) {
                    closeTagArray.splice(ic, 1)
                    openTagArray.splice(io, 1)
                    io = openTagArray.length
                    break
                  }
                  --io
                }
              }
              ++ic
            }
            //if the opening tag is after the trigger and the
            //closing tag is after the opening tag remove them
            //both from the array otherwise remove the opening tag
            io = 0
            ic = 0
            while (io < openTagArray.length) {
              if (openTagArray[0] >= triggerPos) {
                while (ic < closeTagArray.length) {
                  if (closeTagArray[ic] > openTagArray[io]) {
                    closeTagArray.splice(io, 1)
                    openTagArray.splice(io, 1)
                    ic = 0
                    break
                  }
                  ++ic
                }
              }
              ++io
            }
            //if the last closing tag is after the trigger position
            //and the first opening tag is before the trigger position
            //remove them both
            ic = closeTagArray.length
            io = 0
            while (ic >= 0) {
              if (closeTagArray[ic] >= triggerPos) {
                while (io < openTagArray.length) {
                  if (openTagArray[io] < triggerPos) {
                    openTagArray.splice(io, 1)
                    closeTagArray.splice(ic, 1)
                    io = 0
                    break
                  }
                  ++io
                }
              }
              --ic
            }
          }
          //if there are any open tags left return the tag item
          if (openTagArray.length > 0) {
            return items[i]
          }
        }
      }
    }
    currentText = triggerText
    currentLine = triggerLine
    lineBefore = triggerLine
    lineAfter = triggerLine
    openTagArray = []
    closeTagArray = []
    if (itemsOnLine < 2) {
      while (
        currentText.indexOf('<' + nsPrefix + items[i]) === -1 &&
        currentLine > -1
      ) {
        --currentLine
        if (currentLine > -1) {
          currentText = document.lineAt(currentLine).text
        }
        if (getItemsOnLineCount(currentText) > 1) {
          --currentLine
        }
      }
      if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
        while (lineBefore > -1) {
          currentText = document.lineAt(lineBefore).text
          if (getItemsOnLineCount(currentText) < 2) {
            if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
              openTagArray.push(lineBefore)
              //if selfclosing remove from the array
              if (currentText.indexOf('/>') > -1) {
                openTagArray.splice(openTagArray.length - 1, 1)
              }
            }
            if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
              closeTagArray.push(lineBefore)
            }
          }
          --lineBefore
        }
        ++lineAfter
        while (lineAfter < document.lineCount) {
          currentText = document.lineAt(lineAfter).text
          if (getItemsOnLineCount(currentText) < 2) {
            if (currentText.indexOf('<' + nsPrefix + items[i]) > -1) {
              openTagArray.push(lineAfter)
              //if selfclosing remove from the array
              if (currentText.indexOf('/>') > -1) {
                openTagArray.splice(openTagArray.length - 1, 1)
              }
            }
            if (currentText.indexOf('</' + nsPrefix + items[i]) > -1) {
              closeTagArray.push(lineAfter)
            }
          }
          ++lineAfter
        }
        if (openTagArray.length > closeTagArray.length) {
          while (openTagArray.length > 0 && closeTagArray.length > 0) {
            //if the opening tag is after the trigger line and the
            //closing tag line is after the opening tag line remove them
            //both from the array otherwise remove the opening tag line
            let io = 0
            let ic = 0
            while (io < openTagArray.length) {
              if (openTagArray[io] >= triggerLine) {
                while (ic < closeTagArray.length) {
                  if (closeTagArray[ic] > openTagArray[io]) {
                    closeTagArray.splice(ic, 1)
                    openTagArray.splice(io, 1)
                    ic = 0
                    break
                  }
                  ++ic
                }
              }
              ++io
            }
            //if the closing tag line is before the trigger line line
            //and there is an opening tag line before that closing tag line
            //remove the last opening tag line before that closing tag line
            //from the array otherwise remove the closing tag line from
            //the array
            ic = 0
            io = openTagArray.length
            while (ic < closeTagArray.length) {
              if (closeTagArray[ic] <= triggerLine) {
                while (io > 0) {
                  if (openTagArray[io] < closeTagArray[ic]) {
                    openTagArray.splice(io, 1)
                    closeTagArray.splice(ic, 1)
                    io = openTagArray.length
                    break
                  }
                  --io
                }
              }
              ++ic
            }
            //if the last closing tag line is after the trigger line
            //and the first opening tag line is before the trigger position
            //remove them both
            ic = closeTagArray.length
            io = 0
            while (ic > 0) {
              if (closeTagArray[ic] >= triggerLine) {
                while (io < openTagArray.length) {
                  if (openTagArray[io] < triggerLine) {
                    openTagArray.splice(io, 1)
                    closeTagArray.splice(ic, 1)
                    io = 0
                    break
                  }
                  ++io
                }
              }
              --ic
            }
          }
          //if there are any open tags left return the tag item
          if (openTagArray.length > 0) {
            return items[i]
          }
        }
      }
    }
  }
  return 'none'
}

export function nearestOpen(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const nsPrefix = getXsdNsPrefix(document, position)
  const items = [
    'schema',
    'element',
    'sequence',
    'choice',
    'group',
    'simpleType',
    'complexType',
    'defineVariable',
    'setVariable',
  ]
  for (let i = 0; i < items.length; ++i) {
    if (checkTagOpen(document, position, nsPrefix, items[i])) {
      return items[i]
    }
  }
  return 'none'
}

export function getCloseTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  tag: string,
  startLine: number
): [string, number] {
  const triggerPos = position.character
  const triggerLine = position.line
  let lineNum = startLine
  const triggerText = document.lineAt(triggerPos).text
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  if (itemsOnLine > 1) {
    const textAfterTrigger = triggerText.substring(triggerPos)
    let tag = textAfterTrigger.substring(textAfterTrigger.indexOf('>'))
    if (tag.includes(tag) && tag.includes('/')) {
      return [tag, startLine]
    }
  } else {
    if (
      (triggerText.includes('</') || triggerText.includes('/>')) &&
      triggerText.includes(tag)
    ) {
      return [tag, triggerLine]
    }
    while (lineNum > -1 && lineNum < document.lineCount - 1) {
      let currentText = document.lineAt(lineNum).text
      if (getItemsOnLineCount(currentText) < 2) {
        if (currentText.includes('</' + nsPrefix + tag)) {
          return [tag, lineNum]
        }
      }
      ++lineNum
    }
  }
  return ['none', 0]
}

export function nearestTag(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  startLine: number
): [string, number] {
  const triggerPos = position.character
  const TriggerLine = position.line
  let lineNum = startLine
  const triggerText = document.lineAt(TriggerLine).text
  const itemsOnLine = getItemsOnLineCount(document.lineAt(lineNum).text)
  const items = [
    'element',
    'sequence',
    'choice',
    'group',
    'simpleType',
    'complexType',
    'schema',
  ]
  if (itemsOnLine > 1) {
    const textBeforeTrigger = triggerText.substring(0, triggerPos)
    for (let i = 0; i < items.length; ++i) {
      let tag = textBeforeTrigger.substring(textBeforeTrigger.lastIndexOf('<'))
      if (tag.includes(items[i]) && !tag.includes('/')) {
        return [items[i], startLine]
      }
    }
  } else {
    while (lineNum > -1 && lineNum < document.lineCount - 1) {
      let currentText = document.lineAt(lineNum).text
      if (getItemsOnLineCount(currentText) < 2) {
        if (!currentText.includes('</') || !currentText.includes('/>')) {
          for (let i = 0; i < items.length; ++i) {
            if (currentText.includes('<' + nsPrefix + items[i])) {
              return [items[i], lineNum]
            }
          }
        }
      }
      --lineNum
    }
  }
  return ['none', 0]
}

export function checkTagOpen(
  document: vscode.TextDocument,
  position: vscode.Position,
  nsPrefix: string,
  tag: string
) {
  const triggerLine = position.line
  const triggerPos = position.character
  const triggerText = document.lineAt(triggerLine).text
  const itemsOnLine = getItemsOnLineCount(triggerText)
  const textBeforeTrigger = triggerText.substring(0, triggerPos)
  const tagPos = textBeforeTrigger.lastIndexOf('<' + nsPrefix + tag)
  const tagEndPos = triggerText.indexOf('>', tagPos)
  const nextTagPos = triggerText.indexOf('<', tagPos + 1)
  if (tagPos > -1 && itemsOnLine > 1) {
    if (
      triggerPos > tagPos &&
      ((triggerPos <= tagEndPos &&
        (nextTagPos > tagEndPos || nextTagPos === -1)) ||
        tagEndPos === -1)
    ) {
      return true
    }
  }
  if (tagPos > -1 && itemsOnLine < 2) {
    if (triggerPos > tagPos && (triggerPos <= tagEndPos || tagEndPos === -1)) {
      return true
    }
  }
  return false
}

//returns an empty value or a prefix plus a colon
export function getXsdNsPrefix(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  let initialLineNum = position.line
  let lineNum = 0
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
  let itemsOnLine = 0
  let nextPos = 0
  let result = 0
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
  let lineNum = position.line

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
