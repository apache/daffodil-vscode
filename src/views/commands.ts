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
import { outputChannel } from '../adapter/activateDaffodilDebug'
import jsep from 'jsep'

const viewName = 'commandsView'
const packageCommands = require('../../package.json').contributes.commands

// Custom class to hold attributes of the commands
class CommandItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly commandName: string,
    public readonly category: string,
    public readonly enablement: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState)
    this.tooltip = `${this.category}: ${this.label}`
    this.description = this.commandName
  }

  iconPath = new vscode.ThemeIcon('bracket')
}

// Class that will create the tree of commands in our view container
export class CommandsProvider implements vscode.TreeDataProvider<CommandItem> {
  private commands: Array<CommandItem>
  constructor() {
    this.commands = this.getCommands()
    this.refresh()
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    CommandItem | undefined | null | void
  > = new vscode.EventEmitter<CommandItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    CommandItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  getTreeItem = (element: CommandItem): vscode.TreeItem => element

  getChildren = (): vscode.ProviderResult<CommandItem[]> => this.commands

  refresh = (): void => this._onDidChangeTreeData.fire()

  public register(context: vscode.ExtensionContext): any {
    vscode.window.registerTreeDataProvider(viewName, this)

    const tree = vscode.window.createTreeView(viewName, {
      treeDataProvider: this,
      showCollapseAll: true,
    })

    // Create command that allows for the execution of our other commands
    // when the command items play icon is clicked
    vscode.commands.registerCommand(
      `${viewName}.runCommand`,
      async (commandItem: CommandItem) =>
        vscode.commands.executeCommand(commandItem.commandName)
    )

    // Create command that will refresh the list of commands
    vscode.commands.registerCommand(`${viewName}.refresh`, () => {
      this.refresh()
    })

    // Create listeners to update the commands based on if a debug session is happening
    vscode.debug.onDidStartDebugSession(() => {
      this.commands = this.getCommands()
      this.refresh()
    })
    vscode.debug.onDidTerminateDebugSession(() => {
      this.commands = this.getCommands()
      this.refresh()
    })
    context.subscriptions.push(
      vscode.window.tabGroups.onDidChangeTabs(() => {
        this.commands = this.getCommands()
        this.refresh()
      }),

      vscode.window.onDidChangeActiveTextEditor(() => {
        this.commands = this.getCommands()
        this.refresh()
      })
    )

    context.subscriptions.push(tree)
  }

  // Get the type of the currently active custom editor. If we're not using a custom editor, return an empty string
  private getActiveCustomEditor(): string {
    // TabGroups are able to represent many different types of editors, including Text Editors, Notebook Editors, and WebView Editors
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input
    if (tabInput && tabInput instanceof vscode.TabInputCustom)
      return tabInput.viewType
    return ''
  }

  // This context will be passed into the AST parser. It should contain information on the different keywords expected
  // in our boolean expressions mapped to their resolved values.
  private getEnablementContext(): Record<string, any> {
    return {
      inDebugMode: () => vscode.debug.activeDebugSession,
      editorLangId: () => this.getActiveLangId(),
      activeEditor: () => this.getActiveCustomEditor(),
      editorTextFocus: () => !(vscode.window.activeTextEditor === undefined),
    }
  }

  private getActiveLangId(): string {
    return vscode.window.activeTextEditor?.document.languageId || ''
  }

  // Evaluate an Abstract Syntax Tree - useful for evaluating boolean expressions that are contained within a string
  // Be sure to wrap the string in a jsep constructor (eg. jsep(str))
  private evaluateAst(
    node:
      | jsep.Expression
      | jsep.baseTypes
      | (jsep.Expression | jsep.baseTypes)[],
    context: Record<string, any>
  ): any {
    if (Array.isArray(node)) {
      outputChannel.appendLine('Unexpected array node')
      return
    }

    if (!node) {
      outputChannel.appendLine('Unexpected undefined node')
      return
    }

    if (
      typeof node === 'string' ||
      typeof node === 'number' ||
      typeof node === 'boolean'
    ) {
      return node
    }

    if (typeof node !== 'object' || !('type' in node)) {
      outputChannel.appendLine(`Invalid AST node: ${JSON.stringify(node)}`)
      return
    }

    switch (node.type) {
      case 'Literal':
        return node.value
      case 'Identifier': {
        if (!node.name || typeof node.name !== 'string') {
          outputChannel.appendLine(
            `Invalid Identifier: ${node.name}, type of ${typeof node.name}`
          )
          return
        }

        if (!(node.name in context)) {
          outputChannel.appendLine(`Unknown identifier: ${node.name}`)
        }

        const val = context[node.name]
        return typeof val === 'function' ? val() : val
      }
      case 'CallExpression': {
        const callee = node.callee as jsep.Identifier

        if (callee.type !== 'Identifier') {
          outputChannel.appendLine(
            `Unsupported function call: ${node.name}. Only top-level identifiers are allowed`
          )
          return
        }

        const fn = context[callee.name]
        if (typeof fn !== 'function') {
          outputChannel.appendLine(
            `Indentifier ${callee.name} is not a function`
          )
          return
        }

        // None of the functions currently need arguments
        // To support arguments, start with the following lines:
        // const args = node.arguments.map(arg => evaluateEnablement2(arg, context))
        // fn(...args)
        return fn()
      }
      case 'UnaryExpression': {
        const arg = this.evaluateAst(node.argument, context)
        switch (node.operator) {
          case '!':
            return !arg
          default:
            outputChannel.appendLine(
              `Unsupported unary operator: ${node.operator}`
            )
            return
        }
      }
      case 'LogicalExpression': {
        const left = this.evaluateAst(node.left, context)
        const right = this.evaluateAst(node.right, context)
        switch (node.operator) {
          case '&&':
            return left && right
          case '||':
            return left || right
          default:
            outputChannel.appendLine(
              `Unsupported logical operator: ${node.operator}`
            )
            return
        }
      }
      case 'BinaryExpression': {
        const left = this.evaluateAst(node.left, context)
        const right = this.evaluateAst(node.right, context)
        switch (node.operator) {
          case '==':
            return left == right
          case '!=':
            return left != right
          case '&&':
            return left && right
          case '||':
            return left || right
          default:
            outputChannel.appendLine(
              `Unsupported binary operator: ${node.operator}`
            )
            return
        }
      }
      default:
        outputChannel.appendLine(`Unsupported node type: ${(node as any).type}`)
        return
    }
  }

  // Function to parse all the commands from the package.json, that currently enabled,
  // to an array of CommandItems
  private getCommands(): Array<CommandItem> {
    const commands = Array<CommandItem>()

    packageCommands
      .filter(
        (c) =>
          !c.command.startsWith(viewName) &&
          c.enablement &&
          this.evaluateAst(jsep(c.enablement), this.getEnablementContext())
      )
      .forEach((command) => {
        commands.push(
          new CommandItem(
            command.title,
            command.command,
            command.category ?? '',
            command.enablement ?? '',
            vscode.TreeItemCollapsibleState.None
          )
        )
      })

    return commands
  }
}
