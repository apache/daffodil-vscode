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

import * as fs from 'fs'
import {
  createSimpleFileLogger,
  getClientVersion,
  getServerVersion,
  setAutoFixViewportDataLength,
  setLogger,
  startServer,
  stopServerUsingPID,
} from '@omega-edit/client'
import path from 'path'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import { DataEditWebView } from './dataEditWebView'
import { initOmegaEditClient } from './utils'

export let omegaEditPort: number = 0

const DEFAULT_OMEGA_EDIT_PORT: number = 9000
const OMEGA_EDIT_MIN_PORT: number = 1024
const OMEGA_EDIT_MAX_PORT: number = 65535
const MAX_LOG_FILES = 5 // Maximum number of log files to keep TODO: make this configurable
const appDataPath = XDGAppPaths({ name: 'omega_edit' }).data()

function rotateLogFiles(logFile: string) {
  interface LogFile {
    path: string
    ctime: Date
  }

  if (MAX_LOG_FILES <= 0) {
    throw new Error('Maximum number of log files must be greater than 0')
  }
  if (fs.existsSync(logFile)) {
    const logDir = path.dirname(logFile)
    const logFileName = path.basename(logFile)

    // Get list of existing log files
    const logFiles: LogFile[] = fs
      .readdirSync(logDir)
      .filter((file) => file.startsWith(logFileName) && file !== logFileName)
      .map((file) => ({
        path: path.join(logDir, file),
        ctime: fs.statSync(path.join(logDir, file)).ctime,
      }))
      .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())

    // Delete oldest log files if maximum number of log files is exceeded
    while (logFiles.length >= MAX_LOG_FILES) {
      const fileToDelete = logFiles.pop() as LogFile
      fs.unlinkSync(fileToDelete.path)
    }

    // Rename current log file with timestamp and create a new empty file
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    fs.renameSync(logFile, path.join(logDir, `${logFileName}.${timestamp}`))
  }
}

function getPidFile(serverPort: number) {
  return path.join(appDataPath, `serv-${serverPort}.pid`)
}

async function getOmegaEditPort() {
  if (omegaEditPort === 0) {
    /**
     * Loop through all available configurations inside of launch.json
     * If dataEditor.omegaEditPort is set then we update the port
     *   NOTE: Whichever configuration sets the last will be the value used
     */
    vscode.workspace
      .getConfiguration(
        'launch',
        vscode.workspace.workspaceFolders
          ? vscode.workspace.workspaceFolders[0].uri
          : vscode.Uri.parse('')
      )
      .get<Array<Object>>('configurations')
      ?.forEach((config) => {
        omegaEditPort =
          'dataEditor' in config && 'port' in (config['dataEditor'] as object)
            ? ((config['dataEditor'] as object)['port'] as number)
            : omegaEditPort
      })

    omegaEditPort =
      omegaEditPort !== 0 ? omegaEditPort : DEFAULT_OMEGA_EDIT_PORT

    if (
      omegaEditPort <= OMEGA_EDIT_MIN_PORT ||
      omegaEditPort > OMEGA_EDIT_MAX_PORT
    ) {
      omegaEditPort = 0
      throw new Error('Invalid port')
    }
  } else
    throw new Error('Data Editor currently only supports a single instance')
}

function setupLogging() {
  const config = vscode.workspace.getConfiguration('dataEditor')
  const logFile = config
    .get<string>(
      'logFile',
      '${workspaceFolder}/dataEditor-${omegaEditPort}.log'
    )
    ?.replace('${workspaceFolder}', appDataPath)
    .replace('${omegaEditPort}', omegaEditPort.toString())
  const logLevel =
    process.env.OMEGA_EDIT_CLIENT_LOG_LEVEL ||
    config.get<string>('logLevel', 'info')
  rotateLogFiles(logFile)
  setLogger(createSimpleFileLogger(logFile, logLevel))
  vscode.window.showInformationMessage(
    `Logging to '${logFile}', at level '${logLevel}'`
  )
}

async function serverStop(serverPort: number) {
  const serverPidFile = getPidFile(serverPort)
  if (fs.existsSync(serverPidFile)) {
    const pid = parseInt(fs.readFileSync(serverPidFile).toString())
    if (await stopServerUsingPID(pid)) {
      vscode.window.setStatusBarMessage(
        `Ωedit server stopped on port ${omegaEditPort} with PID ${pid}`,
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 2000)
        })
      )
    } else {
      vscode.window.showErrorMessage(
        `Ωedit server on port ${omegaEditPort} with PID ${pid} failed to stop`
      )
    }
  }
}

function generateLogbackConfigFile(
  logFile: string,
  logLevel: string = 'INFO'
): string {
  const logbackConfig = `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${logFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${logLevel}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
  const logbackConfigFile = path.join(
    appDataPath,
    `serv-${omegaEditPort}.logconf.xml`
  )
  rotateLogFiles(logFile)
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}

async function serverStart(serverPort: number) {
  await serverStop(serverPort)
  const serverStartingText = `Ωedit server starting on port ${omegaEditPort}`
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  )
  statusBarItem.text = serverStartingText
  statusBarItem.show()

  let animationFrame = 0
  const animationInterval = 400 // ms per frame
  const animationFrames = ['', '.', '..', '...']
  const animationIntervalId = setInterval(() => {
    const frame = animationFrames[animationFrame % animationFrames.length]
    statusBarItem.text = `${serverStartingText} ${frame}`
    ++animationFrame
  }, animationInterval)

  const logConfigFile = generateLogbackConfigFile(
    path.join(appDataPath, `serv-${omegaEditPort}.log`),
    'INFO' // TODO: Make this configurable
  )
  if (!fs.existsSync(logConfigFile)) {
    throw new Error(`Log config file '${logConfigFile}' not found`)
  }

  // Start the server and wait up to 10 seconds for it to start
  const serverPid = (await Promise.race([
    startServer(
      omegaEditPort,
      '127.0.0.1',
      getPidFile(serverPort),
      logConfigFile
    ),
    new Promise((resolve, reject) => {
      setTimeout(
        () => reject(new Error('Server timed out after 10 seconds')),
        10000
      )
    }),
  ])) as number | undefined
  if (serverPid === undefined || serverPid <= 0) {
    throw new Error('Server failed to start or PID is invalid')
  }
  const clientVersion = getClientVersion()
  const serverVersion = await getServerVersion()
  if (serverVersion !== clientVersion) {
    throw new Error(
      `Server version ${serverVersion} and client version ${clientVersion} must match`
    )
  }
  clearInterval(animationIntervalId)
  statusBarItem.text = `Ωedit server v${serverVersion} started on port ${omegaEditPort} with PID ${serverPid}`
  setTimeout(() => {
    statusBarItem.dispose()
  }, 5000)
}

export function activate(ctx: vscode.ExtensionContext) {
  fs.mkdirSync(appDataPath, { recursive: true })

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.data.edit',
      async (fileToEdit: string = '') => {
        await getOmegaEditPort()
        setupLogging()
        setAutoFixViewportDataLength(true)
        await serverStart(omegaEditPort)
        await initOmegaEditClient(omegaEditPort)
        return await createOmegaEditWebviewPanel(ctx, fileToEdit)
      }
    )
  )
}

async function createOmegaEditWebviewPanel(
  ctx: vscode.ExtensionContext,
  fileToEdit: string
) {
  const dataEditorView = new DataEditWebView(
    ctx,
    'dataEditor',
    'Data Editor',
    fileToEdit
  )

  await dataEditorView.initialize()

  dataEditorView.panel.onDidDispose(
    async () => {
      await dataEditorView.dispose()
      if (omegaEditPort !== 0) {
        await serverStop(omegaEditPort)
        omegaEditPort = 0
      }
    },
    undefined,
    ctx.subscriptions
  )

  dataEditorView.show()
  return dataEditorView
}
