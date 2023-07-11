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
import * as fs from 'fs'
import * as unzip from 'unzip-stream'
import * as os from 'os'
import * as child_process from 'child_process'
import path from 'path'
import { VSCodeLaunchConfigArgs } from './classes/vscode-launch'

const defaultConf = vscode.workspace.getConfiguration()
let currentConfig: vscode.DebugConfiguration

const terminalName = 'daffodil-debugger'

export const regexp = {
  comma: new RegExp(',', 'g'),
  slash: new RegExp('/', 'g'),
  space: new RegExp(' ', 'g'),
  workspace: new RegExp('${workspaceFolder}', 'g'),
}

// Function to retrieve to the current debug config
export function getCurrentConfig(): vscode.DebugConfiguration {
  return currentConfig
}

// Function to set the current debug config
export function setCurrentConfig(
  config: vscode.DebugConfiguration
): vscode.DebugConfiguration {
  currentConfig = config
  return config
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
  let config = JSON.parse(JSON.stringify(getCurrentConfig()))

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

export function getConfig(jsonArgs: object): vscode.DebugConfiguration {
  const launchConfigArgs: VSCodeLaunchConfigArgs = JSON.parse(
    JSON.stringify(jsonArgs)
  )
  // Keep 'none' here as a default so that we don't always add the tdmlConfig block
  let tdmlAction = defaultConf.get('tdmlAction', 'none')
  let tdmlPropsNeeded = false
  if (
    tdmlAction === 'generate' ||
    tdmlAction === 'append' ||
    tdmlAction === 'execute'
  ) {
    tdmlPropsNeeded = true
  }

  const defaultValues = {
    program: defaultConf.get('program', '${command:AskForProgramName}'),
    data: defaultConf.get('data', '${command:AskForDataName}'),
    debugServer: defaultConf.get('debugServer', 4711),
    infosetFormat: 'xml',
    infosetOutput: {
      type: defaultConf.get('infosetOutputType', 'none'),
      path: defaultConf.get(
        'infosetOutputFilePath',
        '${workspaceFolder}/target/infoset.xml'
      ),
    },
    stopOnEntry: defaultConf.get('stopOnEntry', true),
    useExistingServer: defaultConf.get('useExistingServer', false),
    trace: defaultConf.get('trace', true),
    openHexView: defaultConf.get('openHexView', false),
    openInfosetView: defaultConf.get('openInfosetView', false),
    openInfosetDiffView: defaultConf.get('openInfosetDiffView', false),
    daffodilDebugClasspath: defaultConf.get('daffodilDebugClasspath', ''),
    dataEditorConfig: {
      port: defaultConf.get('dataEditorPort', 9000),
      logFile: defaultConf.get(
        'dataEditorLogFile',
        '${workspaceFolder}/dataEditor-${omegaEditPort}.log'
      ),
      logLevel: defaultConf.get('dataEditorLogLevel', 'info'),
    },
    dfdlDebugger: {
      logging: {
        level: defaultConf.get('dfdlDebuggerLogLevel', 'INFO'),
        file: defaultConf.get(
          'dfdlDebuggerLogFile',
          '/tmp/daffodil-debugger.log'
        ),
      },
    },
  }

  Object.entries(defaultValues).map(
    ([key, defaultValue]) =>
      (launchConfigArgs[key] = launchConfigArgs[key]
        ? launchConfigArgs[key]
        : defaultValue)
  )

  if (tdmlPropsNeeded) {
    launchConfigArgs.tdmlConfig = launchConfigArgs.tdmlConfig
      ? launchConfigArgs.tdmlConfig
      : {
          action: tdmlAction,
          name: defaultConf.get('tdmlName', '${command:AskforTDMLName}'),
          description: defaultConf.get(
            'tdmlDescription',
            '${command:AskForTDMLDescription}'
          ),
          path: defaultConf.get('tdmlPath', '${workspaceFolder}/infoset.tdml'),
        }
  }

  return JSON.parse(JSON.stringify(launchConfigArgs))
}

export async function unzipFile(zipFilePath: string, extractPath: string) {
  return await new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(zipFilePath)
      .pipe(unzip.Extract({ path: `${extractPath}` }) as NodeJS.WritableStream)

    stream.on('close', () => {
      try {
        resolve(zipFilePath)
      } catch (err) {
        reject(err)
      }
    })
  })
}

export async function displayTerminalExitStatus(terminal: vscode.Terminal) {
  vscode.window.onDidCloseTerminal((t) => {
    if (t.name === terminal.name && t.processId === terminal.processId) {
      t.show()
      vscode.window.showInformationMessage(
        `Terminal exited with status code: ${t.exitStatus?.code}`
      )
    }
  })
}

/*
 * Check if OS is windows, if so return windows option else return the mac and linux option.
 * This method is used to elimate a lot duplicated code we had check if the os was windows related.
 */
export function osCheck(winOption: any, macLinOption: any): any {
  return os.platform().toLowerCase().startsWith('win')
    ? winOption
    : macLinOption
}

export async function killProcess(id: number | undefined) {
  if (id) {
    child_process.exec(
      osCheck(`taskkill /F /PID ${id}`, `kill -9 ${id} 2>&1 || echo 0`)
    )
  }
}

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

// Grab active terminal if available and it can run a new command, else create new one
export const getTerminal = (
  hideTerminal: boolean,
  env:
    | {
        [key: string]: string | null | undefined
      }
    | undefined,
  createTerminal: boolean
) => {
  if (!createTerminal) {
    vscode.window.terminals.forEach((terminal) => {
      if (terminal.name.includes(terminalName)) terminal.dispose()
    })
  }

  // If no good active terminal available create new one
  const terminal = vscode.window.createTerminal({
    name: terminalName,
    hideFromUser: hideTerminal,
  })

  // Looping to manual set all env variables. Setting "env: env" inside of createTerminal won't override variables already set
  for (var key in env) {
    if (key !== null && key !== undefined) {
      let workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : ''
      let exportVar = `${osCheck('set', 'export')} ${key}=${env[key]}`

      if (exportVar.includes('${workspaceFolder}')) {
        exportVar = exportVar.replaceAll('${workspaceFolder}', workspaceFolder)
      }

      terminal.sendText(exportVar, true)
    }
  }

  return terminal
}

export async function runScript(
  scriptPath: string,
  scriptName: string,
  createTerminal: boolean,
  shellArgs: string[] = [],
  env:
    | {
        [key: string]: string | null | undefined
      }
    | undefined = undefined,
  type: string = '',
  hideTerminal: boolean = false,
  port: number | undefined = undefined
) {
  // Get the full path to the script
  const scriptFullPath = path.join(scriptPath, 'bin', scriptName)

  // Make sure the path exists
  if (!fs.existsSync(scriptFullPath)) {
    vscode.window.showErrorMessage(
      `Script path ${scriptFullPath} does not exist`
    )
  } else {
    // Make sure the script is executable
    if (!os.platform().toLowerCase().startsWith('win')) {
      fs.chmodSync(scriptFullPath, 0o755)
    }
  }

  const terminal = getTerminal(hideTerminal, env, createTerminal)

  // Create debugger run command
  const fullPathToScript = path
    .join(scriptPath, 'bin', scriptName)
    // fix pathing as emtpy space needs a \ before it to not cause errors
    .replace(' ', '\\ ')
  const debuggerRunCommand = `${fullPathToScript} ${shellArgs.join(' ')}`

  // Send debugger run command to terminal, when exists terminal will stay open
  terminal.sendText(debuggerRunCommand)

  if (!hideTerminal) {
    terminal.show()
    await displayTerminalExitStatus(terminal)
  }

  if (type.includes('daffodil')) {
    await delay(5000).then(() => {})
  } else {
    const wait_port = require('wait-port')
    await wait_port({ host: '127.0.0.1', port: port, output: 'silent' })
  }
  return terminal
}

/**
 * Search for an existing Omega Edit server and kill if desired.
 * @param killOnFind Kill any OmegaEdit server found that is running. Defaults to True.
 * @returns PID of the process found and/or killed. 0 if no server is found. -1 if a child_process error occurred.
 */
export async function findExistingOmegaEditServer(
  killOnFind: boolean = true
): Promise<number> {
  let ret: number
  const pid: string = child_process
    .execSync(
      osCheck('', "ps -a | grep omega-edit | grep -v grep | awk '{print $1}'")
    )
    .toString('ascii')

  pid === '' ? (ret = 0) : (ret = parseInt(pid))

  if (ret > 0 && killOnFind) {
    vscode.window.showWarningMessage(
      `Existing Omega Edit server found | Killing PID: ${ret} and restarting server.`
    )
    await killProcess(ret)
  }
  return ret
}

export function tmpFile(sid: string): string {
  return `${os.tmpdir()}/infoset-${sid}.${getCurrentConfig().infosetFormat}`
}

export function ensureFile(path: string): string {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '')
  }
  return path
}
