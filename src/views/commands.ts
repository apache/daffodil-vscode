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
    this.commands = getCommands('!inDebugMode')
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
      this.commands = getCommands('inDebugMode')
      this.refresh()
    })
    vscode.debug.onDidTerminateDebugSession(() => {
      this.commands = getCommands('!inDebugMode')
      this.refresh()
    })

    context.subscriptions.push(tree)
  }
}

// Function to parse all the commands from the package.json, that currently enabled,
// to an array of CommandItems
function getCommands(enablement: String): Array<CommandItem> {
  const commands = Array<CommandItem>()

  packageCommands
    .filter(
      (c) =>
        !c.command.startsWith(viewName) &&
        (enablement === c.enablement || c.enablement === undefined)
    )
    .forEach((command) => {
      commands.push(
        new CommandItem(
          command.title,
          command.command,
          command.category,
          command.enablement ?? '',
          vscode.TreeItemCollapsibleState.None
        )
      )
    })

  return commands
}
