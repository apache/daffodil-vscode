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
import * as os from 'os'
import * as child_process from 'child_process'
import path from 'path'
import { VSCodeLaunchConfigArgs } from './classes/vscode-launch'
import { InfosetOutput } from './daffodilDebugger'
import { XMLParser } from 'fast-xml-parser'
import * as unzip from 'unzip-stream'
import { pipeline } from 'stream/promises'
import { Transform } from 'stream'
let currentConfig: vscode.DebugConfiguration

export const terminalName = 'daffodil-debugger'

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
export function runCommand(command: string, params?: any) {
  const vscodeError = (err) => {
    vscode.window.showInformationMessage(err)
  }

  if (!params)
    vscode.commands.executeCommand(command).then(undefined, vscodeError)
  else
    vscode.commands.executeCommand(command, params).then(undefined, vscodeError)
}

// Function for checking if config specifies if either the
// infoset, infoset diff or data editor needs to be opened
export async function onDebugStartDisplay(viewsToCheck: string[]) {
  let config = getCurrentConfig()

  viewsToCheck.forEach(async (viewToCheck) => {
    switch (viewToCheck) {
      case 'data-editor':
        if (config.openDataEditor) {
          runCommand('extension.data.edit', config.data)
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

function checkInfosetFileExtension(
  infosetOutput: InfosetOutput,
  infosetFormat: string
) {
  // If the infoset file path doesn't end with the infoset output format, update to end with infoset output format.
  if (!infosetOutput.path.endsWith(`.${infosetFormat}`)) {
    vscode.window.showWarningMessage(
      `The output path for the file extension doesn't end with the infoset output format type. The file extension will be updated to end with .${infosetFormat}`
    )

    let fileExtensionSearchResult = new RegExp('(\\.).*$')
      .exec(infosetOutput!.path)
      ?.filter((fileExt) => fileExt !== '.')[0]

    /**
     * If search result is not undefined replace the file extension with the correct extension.
     * Else append proper file extension to the end of the output path.
     */
    infosetOutput.path =
      fileExtensionSearchResult !== undefined
        ? infosetOutput.path.replace(
            fileExtensionSearchResult,
            `.${infosetFormat}`
          )
        : (infosetOutput.path = `${infosetOutput!.path}.${infosetFormat}`)
  }
}

function checkSettingValue<T>(target: unknown, defaults: T): T {
  if (
    typeof defaults !== 'object' ||
    defaults === null ||
    Array.isArray(defaults)
  ) {
    return target === undefined ? defaults : (target as T)
  }

  if (typeof target !== 'object' || target === null) {
    return defaults
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(defaults)) {
    result[key] = checkSettingValue(
      (target as any)[key],
      (defaults as any)[key]
    )
  }

  for (const key of Object.keys(target as any)) {
    if (!(key in result)) {
      result[key] = (target as any)[key]
    }
  }

  return result as T
}

export function getConfig(jsonArgs: object): vscode.DebugConfiguration {
  const launchConfigArgs: VSCodeLaunchConfigArgs = JSON.parse(
    JSON.stringify(jsonArgs)
  )
  // NOTE: Don't make this a static value as extension configuration may change while the extension is loaded.
  const defaultConf = vscode.workspace.getConfiguration()

  const defaultValues = {
    schema: defaultConf.get('schema', {
      path: '${command:AskForSchemaName}',
      rootName: null,
      rootNamespace: null,
    }),
    data: defaultConf.get('data', '${command:AskForDataName}'),
    debugServer: defaultConf.get('debugServer', 4711),
    infosetFormat: 'xml',
    infosetOutput: defaultConf.get('infosetOutput', {
      type: 'file',
      path: '${workspaceFolder}/target/infoset.xml',
    }),
    tdmlConfig: {
      ...{
        action: 'generate',
        name: 'Default Test Case',
        path: '${command:AskForValidatedTDMLPath}',
      },
      ...((defaultConf.get('tdmlConfig') as object) || {}),
    },
    stopOnEntry: defaultConf.get('stopOnEntry', true),
    useExistingServer: defaultConf.get('useExistingServer', false),
    trace: defaultConf.get('trace', true),
    openDataEditor: defaultConf.get('openDataEditor', false),
    openInfosetView: defaultConf.get('openInfosetView', false),
    openInfosetDiffView: defaultConf.get('openInfosetDiffView', false),
    daffodilDebugClasspath: defaultConf.get('daffodilDebugClasspath', []),
    dataEditor: defaultConf.get('dataEditor', {
      port: 9000,
      logging: {
        level: 'info',
        file: '${workspaceFolder}/dataEditor-${omegaEditPort}.log',
      },
    }),
    dfdlDebugger: defaultConf.get('dfdlDebugger', {
      daffodilVersion: '3.11.0',
      timeout: '10s',
      logging: {
        level: 'INFO',
        file: '${workspaceFolder}/daffodil-debugger.log',
      },
    }),
  }

  for (const [key, defaults] of Object.entries(defaultValues)) {
    launchConfigArgs[key] = checkSettingValue(launchConfigArgs[key], defaults)
  }

  if (launchConfigArgs.infosetOutput?.type == 'file') {
    checkInfosetFileExtension(
      launchConfigArgs.infosetOutput!,
      launchConfigArgs.infosetFormat!
    )
  }

  // VVVVVVVVVVVVVVVVVVVVVVVV COMPARTMENTALIZED FIX FOR THIRD BULLET POINT OF https://github.com/apache/daffodil-vscode/issues/1540 VVVVVVVVVVVVVVVVVVVVVVVV
  // Handle setting test case name for TDML Execute action if it's not specified.
  // This resolves the issue of always defualting to `Default Test Case` even thought a test case name isn't specified when we click on `Execute TDML` when we have opened TDML file
  const args = jsonArgs as VSCodeLaunchConfigArgs // cast needed b/c of VS Code Typescript errors
  if (
    args.tdmlConfig?.action === 'execute' &&
    args.tdmlConfig?.name === undefined
  ) {
    launchConfigArgs.tdmlConfig.name = undefined
  }
  // ^^^^^^^^^^^^^^^^^^^^^^^^ COMPARTMENTALIZED FIX FOR THIRD BULLET POINT OF https://github.com/apache/daffodil-vscode/issues/1540 ^^^^^^^^^^^^^^^^^^^^^^^^

  return JSON.parse(JSON.stringify(launchConfigArgs))
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
    // Need to specify 'cmd' for windows as by default it will use powershell which causes issues with the envionment varaibles
    shellPath: osCheck('cmd', undefined),
  })

  // Looping to manual set all env variables. Setting "env: env" inside of createTerminal won't override variables already set
  for (var key in env) {
    if (key !== null && key !== undefined) {
      let workspaceFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : ''

      /*
       * NOTE: For windows to function properly the set format needs to be:
       *         set "VARIABLE_NAME=VARIABLE_VALUE"
       * In bash doing:
       *         export "VARIABLE_NAME=VARIABLE_VALUE"
       * didn't cause any issues so this was easiest work around.
       */
      let exportVar = `${osCheck('set', 'export')} "${key}=${env[key]}"`

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
): Promise<vscode.Terminal> {
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

/**
 * Substitutes in VSCode and environmental variables into a given string.
 *
 * @param input - given string
 * @param alternativeWorkspace - alternative workspace location if vscode can't find a good workspace
 * @returns modified input, but with all ${} corresponding to VSCode or Env variables substituted with their
 */
export function substituteVSCodeEnvVariables(
  input: string,
  alternativeWorkspace?: string
): string {
  const workspaceFolder =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
    alternativeWorkspace ||
    ''
  const homeDir = os.homedir()

  // Common VS Code variables
  const variableMap: Record<string, string> = {
    '${workspaceFolder}': workspaceFolder,
    '${workspaceRoot}': workspaceFolder,
    '${userHome}': homeDir,
    '${file}': vscode.window.activeTextEditor?.document.uri.fsPath || '',
    '${relativeFile}': path.relative(
      workspaceFolder,
      vscode.window.activeTextEditor?.document.uri.fsPath || ''
    ),
    '${fileBasename}': path.basename(
      vscode.window.activeTextEditor?.document.uri.fsPath || ''
    ),
    '${fileDirname}': path.dirname(
      vscode.window.activeTextEditor?.document.uri.fsPath || ''
    ),
    '${fileExtname}': path.extname(
      vscode.window.activeTextEditor?.document.uri.fsPath || ''
    ),
    '${fileBasenameNoExtension}': path.basename(
      vscode.window.activeTextEditor?.document.uri.fsPath || '',
      path.extname(vscode.window.activeTextEditor?.document.uri.fsPath || '')
    ),
    '${cwd}': process.cwd(),
  }

  // Add all environment variables dynamically
  Object.entries(process.env).forEach(([key, value]) => {
    if (value) {
      variableMap[`$\{env:${key}\}`] = value
    }
  })

  // Substitute all variables in the input string
  return Object.entries(variableMap).reduce((result, [variable, value]) => {
    return result.replaceAll(variable, value)
  }, input)
}

/**
 * Retrieves an array of test case items from a TDML (Test Data Markup Language) file.
 *
 * @param path - The file path to the TDML file.
 * @returns An array of test case names
 */
export function getTDMLTestCaseItems(path: string): string[] {
  if (!fs.existsSync(path)) {
    return [] // TDML file not found
  }

  // Needed objects for parsing
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  })
  const fileData = fs.readFileSync(path)

  // representaiton of TDML XML file as JS object
  const xml_obj = parser.parse(fileData)

  // Read through TDML test cases and populate each TDML test case item if XML file is valid enough
  // parserTestCaseObjs can be either an array of objects, a single object, or undefined if no parserTestCase element was found
  // Convert that into an array and return a list containing the names of each parserTestCase element
  const parserTestCaseObjs = xml_obj['testSuite']?.['parserTestCase']
  const testCaseArr = Array.isArray(parserTestCaseObjs)
    ? parserTestCaseObjs
    : parserTestCaseObjs
      ? [parserTestCaseObjs]
      : []
  return testCaseArr.map((item) => item['@_name'])
}

/**
 * Displays a VSCode error message as modal. In some cases such as when running tests, using modal
 * can cause an error because the dialog service is not available. If this happens when trying
 * to display the message, this error is grabbed and then message is displayed with modal disabled.
 *
 * @param message - The message to display
 * @param items — A set of items that will be rendered as actions in the message.
 * @returns — A thenable that resolves to the selected item or undefined when being dismissed.
 */
export const displayModalError = async (
  message: string,
  ...items: string[]
): Promise<Thenable<string | undefined>> =>
  vscode.window
    .showErrorMessage(message, { modal: true }, ...items)
    .then(undefined, () =>
      vscode.window.showErrorMessage(message, { modal: false })
    )

/**
 * Download and extract a files with a progress bar
 *
 * @param title A title to use for printing to the user what is being downloaded
 * @param url The url to donwload the binary from
 * @param targetDir The directory to target for extraction
 */
export async function downloadAndExtract(
  title: string,
  url: string,
  targetDir: string
): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Downloading ${title}...`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0, message: 'Starting download...' })

      const res = await fetch(url)
      if (!res.ok || !res.body) {
        throw new Error(
          `Failed to download ${url}: ${res.status} ${res.statusText}`
        )
      }

      const totalBytes = Number(res.headers.get('content-length')) || 0
      let downloaded = 0
      let lastPercent = 0

      // Transform stream to track download progress
      const progressStream = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          downloaded += chunk.length
          if (totalBytes > 0) {
            const percent = (downloaded / totalBytes) * 100
            const increment = percent - lastPercent
            lastPercent = percent
            progress.report({
              increment,
              message: `${percent.toFixed(1)}%`,
            })
          }
          callback(null, chunk)
        },
      })

      await fs.promises.mkdir(targetDir, { recursive: true })

      await pipeline(
        res.body as any,
        progressStream,
        unzip.Extract({ path: targetDir })
      )

      progress.report({
        increment: 100 - lastPercent,
        message: 'Extracting complete!',
      })
    }
  )
}
