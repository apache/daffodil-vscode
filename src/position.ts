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

'use strict'

import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  var controller = new PositionController()
  context.subscriptions.push(controller)
  context.subscriptions.push(
    vscode.commands.registerCommand('position.goto', () =>
      controller.goToPositionCommand()
    )
  )
}

export function deactivate() {
  /* nothing to do */
}

function getOptionalNumber(
  numberAsString?: string
): [number | undefined, boolean] {
  let optionalNumber: number | undefined = undefined
  let isRelative: boolean = false

  let num: number = Number(numberAsString)
  if (!isNaN(num) && numberAsString && numberAsString.length) {
    optionalNumber = num
    isRelative = ['+', '-'].includes(numberAsString!.charAt(0))
  }
  return [optionalNumber, isRelative]
}

class PositionController {
  private disposable: vscode.Disposable
  private statusBarItem: vscode.StatusBarItem

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    )
    this.statusBarItem.command = 'position.goto'
    this.statusBarItem.tooltip = 'Go to position'

    // subscribe to selection change and editor activation events
    let subscriptions: vscode.Disposable[] = []
    vscode.window.onDidChangeTextEditorSelection(
      this.onEvent,
      this,
      subscriptions
    )
    vscode.window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions)

    // create a combined disposable from both event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions)
    this.updatePosition()
  }

  public goToPositionCommand(): void {
    // declaring manager? as optional makes .then/async blocks 'forget' the
    // definite assignment/null check inference done after create() in tslint.
    let manager: CursorManager
    manager = CursorManager.create()!
    if (!manager) {
      return
    }

    vscode.window
      .showInputBox({
        prompt: `Type an offset number from 0 to ${manager.maxPosition}.`,
        value: String(manager.cursorOffset),
        validateInput: (input: string) => {
          manager.previewCursorOffset(input)
          return undefined
        },
      })
      .then((input?: string) => {
        input !== undefined ? manager.commit() : manager.abort()
      })
  }

  private updatePosition(): void {
    let manager = CursorManager.create()
    if (!manager) {
      this.statusBarItem.hide()
      return
    }

    let offset = manager.cursorOffset

    if (offset !== undefined) {
      // Update the status bar
      this.statusBarItem.text = `Pos ${offset}`
      this.statusBarItem.show()
    }
  }

  private onEvent(): void {
    this.updatePosition()
  }

  public dispose() {
    this.disposable.dispose()
    this.statusBarItem.dispose()
  }
}

class CursorManager {
  private static cursorPositionDecoration =
    vscode.window.createTextEditorDecorationType({
      borderColor: new vscode.ThemeColor('editor.foreground'),
      borderStyle: 'solid',
      borderWidth: '1px',
      outlineColor: new vscode.ThemeColor('editor.foreground'),
      outlineStyle: 'solid',
      outlineWidth: '1px',
    })

  public static create() {
    let editor = vscode.window.activeTextEditor
    let doc = editor ? editor.document : undefined
    if (!doc) {
      return undefined
    }

    return new CursorManager(editor!, doc)
  }

  private readonly originalCursorOffset: number
  private readonly cachedSelections: vscode.Selection[]

  constructor(
    readonly editor: vscode.TextEditor,
    readonly document: vscode.TextDocument
  ) {
    this.originalCursorOffset = document.offsetAt(editor.selection.active)
    this.cachedSelections = [editor.selection] // dup active selection for our working copy
    this.cachedSelections.push(...editor.selections)
  }

  public get cursor(): vscode.Position {
    return this.editor.selection.active
  }

  public get cursorOffset(): number {
    return this.document.offsetAt(this.cursor)
  }

  // public get selections() : vscode.Selection[] {
  //     return this.editor.selections;
  // }

  public set selections(selections: vscode.Selection[]) {
    this.editor.selections = selections
  }

  public get maxPosition(): number {
    return this.document.offsetAt(
      new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
    )
  }

  public previewCursorOffset(offset?: string): boolean {
    let [newOffset, isRelative] = getOptionalNumber(offset)
    let success = false

    if (newOffset !== undefined) {
      // Show an outline of where the cursor would be placed, and make it visible.
      if (isRelative) {
        newOffset! += this.originalCursorOffset
      }
      if (newOffset !== this.cursorOffset) {
        let newPosition = this.document.positionAt(newOffset)
        this.cachedSelections[0] = new vscode.Selection(
          newPosition,
          newPosition
        )
        this.editor.selections = this.cachedSelections
      }
      success = true
    }
    const range = new vscode.Range(this.cursor, this.cursor.translate(0, 1))
    this.editor.setDecorations(CursorManager.cursorPositionDecoration, [range])
    this.reveal()
    return success
  }

  public commit() {
    this.clearDecorations()
    this.editor.selection = this.cachedSelections[0]
    vscode.window.showTextDocument(this.document, {
      selection: this.cachedSelections[0],
    })
  }

  public abort() {
    this.clearDecorations()
    this.cachedSelections.splice(0, 1)
    this.editor.selections = this.cachedSelections
    this.reveal()
  }

  private clearDecorations(): void {
    this.editor.setDecorations(CursorManager.cursorPositionDecoration, [])
  }

  private reveal(revealType?: vscode.TextEditorRevealType): void {
    revealType =
      revealType || vscode.TextEditorRevealType.InCenterIfOutsideViewport
    this.editor.revealRange(this.editor.selection, revealType)
  }
}
