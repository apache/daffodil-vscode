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
import { TDMLProvider } from './TDMLProvider'
import { AppConstants } from './utilities/constants'

let outputChannel: vscode.OutputChannel

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('TDML Editor')

  printChannelOutput('TDML Editor extension activated.', true)

  let openPreviewCommand = vscode.commands.registerCommand(
    AppConstants.openPreviewCommand,
    () => {
      const editor = vscode.window.activeTextEditor

      vscode.commands.executeCommand(
        'vscode.openWith',
        editor?.document?.uri,
        AppConstants.viewTypeId,
        {
          preview: true,
          viewColumn: vscode.ViewColumn.Beside,
        }
      )
    }
  )

  let openInTdmlEditor = vscode.commands.registerCommand(
    AppConstants.openInTdmlEditorCommand,
    () => {
      const editor = vscode.window.activeTextEditor

      vscode.commands.executeCommand(
        'vscode.openWith',
        editor?.document?.uri,
        AppConstants.viewTypeId,
        {
          preview: false,
          viewColumn: vscode.ViewColumn.Active,
        }
      )
    }
  )

  context.subscriptions.push(openPreviewCommand)
  context.subscriptions.push(openInTdmlEditor)
  context.subscriptions.push(TDMLProvider.register(context))
}

/**
 * Prints the given content on the output channel.
 *
 * @param content The content to be printed.
 * @param reveal Whether the output channel should be revealed.
 */
export const printChannelOutput = (
  content: string,
  verbose: boolean,
  reveal = false
): void => {
  // do not throw on logging, just log to console in the event of an error
  try {
    if (!outputChannel) {
      return
    }
    // if it is verbose logging and verbose is not enabled, return
    if (
      verbose &&
      !vscode.workspace.getConfiguration('tdml-editor').get('verboseLogging')
    ) {
      return
    }

    const timestamp = new Date().toISOString()

    outputChannel.appendLine(`[${timestamp}] ${content}`)

    if (reveal) {
      outputChannel.show(true)
    }
  } catch (e) {
    console.log(e)
  }
}

export function deactivate() {}
