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

// Function to run vscode command and catch the error to not cause other issues
export function runCommand(command: string) {
  vscode.commands.executeCommand(command).then(undefined, (err) => {
    vscode.window.showInformationMessage(err)
  })
}

// Function for checking if config specifies if either the
// infoset, infoset diff or hex view needs to be opened
export async function onDebugStartDisplay(viewsToCheck: string[]) {
  let config = JSON.parse(
    JSON.stringify(
      vscode.workspace
        .getConfiguration(
          'launch',
          vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0].uri
            : vscode.Uri.parse('')
        )
        .get('configurations')
    )
  )[0]

  viewsToCheck.forEach(async (viewToCheck) => {
    switch (viewToCheck) {
      case 'hex-view':
        if (config.openHexView) {
          runCommand('hexview.display')
        }
        break
      case 'infoset-view':
        if (config.openInfosetView) {
          runCommand('infoset.display')
        }
        break
      case 'infoset-diff-view':
        if (config.openInfosetDiffView) {
          runCommand('infoset.diff')
        }
        break
    }
  })
}
