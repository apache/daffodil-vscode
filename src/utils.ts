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

const defaultConf = vscode.workspace.getConfiguration()
let currentConfig: vscode.ProviderResult<vscode.DebugConfiguration>

export const regexp = {
  comma: new RegExp(',', 'g'),
  slash: new RegExp('/', 'g'),
  space: new RegExp(' ', 'g'),
  workspace: new RegExp('${workspaceFolder}', 'g'),
}

// Function to retrieve to the current debug config
export function getCurrentConfg() {
  return currentConfig
}

// Function to set the current debug config
export function setCurrentConfig(config) {
  currentConfig = config
  return currentConfig
}

// Function to run vscode command and catch the error to not cause other issues
export function runCommand(command: string) {
  vscode.commands.executeCommand(command).then(undefined, (err) => {
    vscode.window.showInformationMessage(err)
  })
}

// Function for checking if config specifies if either the
// infoset, infoset diff or hex view needs to be opened
export async function onDebugStartDisplay(viewsToCheck: string[]) {
  let config = JSON.parse(JSON.stringify(getCurrentConfg()))

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

// Method for retrieving the config when launch.json does not exist
export function getConfig(
  name,
  request,
  type,
  program: string = '',
  data = false,
  debugServer = false,
  infosetOutput: object | null = null,
  stopOnEntry = false,
  useExistingServer = false,
  trace = false,
  openHexView = false,
  openInfosetView = false,
  openInfosetDiffView = false,
  daffodilDebugClasspath: string = ''
) {
  return {
    name: name,
    request: request,
    type: type,
    program: program
      ? program
      : defaultConf.get('program', '${command:AskForProgramName}'),
    data: data ? data : defaultConf.get('data', '${command:AskForDataName}'),
    debugServer: debugServer
      ? debugServer
      : defaultConf.get('debugServer', 4711),
    infosetOutput: infosetOutput
      ? infosetOutput
      : {
          type: defaultConf.get('infosetOutputType', 'none'),
          path: defaultConf.get(
            'infosetOutputFilePath',
            '${workspaceFolder}/infoset.xml'
          ),
        },
    stopOnEntry: stopOnEntry
      ? stopOnEntry
      : defaultConf.get('stopOnEntry', true),
    useExistingServer: useExistingServer
      ? useExistingServer
      : defaultConf.get('useExistingServer', false),
    trace: trace ? trace : defaultConf.get('trace', true),
    openHexView: openHexView
      ? openHexView
      : defaultConf.get('openHexView', false),
    openInfosetView: openInfosetView
      ? openInfosetView
      : defaultConf.get('openInfosetView', false),
    openInfosetDiffView: openInfosetDiffView
      ? openInfosetDiffView
      : defaultConf.get('openInfosetDiffView', false),
    daffodilDebugClasspath: daffodilDebugClasspath
      ? daffodilDebugClasspath
      : defaultConf.get('daffodilDebugClasspath', ''),
  }
}
