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
import { createSimpleFileLogger, setLogger } from 'omega-edit/logger'
import { startServer, stopServerUsingPID } from 'omega-edit/server'
import { setAutoFixViewportDataLength } from 'omega-edit/viewport'
import path from 'path'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import { DataEditWebView } from './dataEditWebView'
import { initOmegaEditClient } from './utils'

const defaultServerPort: number = 9000
export let serverPort: number = 0

const appDataPath = XDGAppPaths({ name: 'omega_edit' }).data()

// Method to get omega-edit version from a JSON file
export function getOmegaEditPackageVersion(filePath: fs.PathLike) {
  return JSON.parse(fs.readFileSync(filePath).toString())['dependencies'][
    'omega-edit'
  ]
}

function getServerPidFile(port?: number) {
  return path.join(appDataPath, `serv-${serverPort}.pid`)
}

async function getOmegaEditPort() {
  if (serverPort === 0) {
    serverPort = vscode.workspace
      .getConfiguration('dataEditor')
      .get<number>('serverPort', defaultServerPort)

    if (serverPort <= 1024 || serverPort > 65535) {
      serverPort = 0
      throw 'Invalid port'
    }
  } else throw 'Data Editor currently only supports a single instance.'
}

function setupLogging() {
  const config = vscode.workspace.getConfiguration('dataEditor')
  const logFile = config
    .get<string>('logFile', '${workspaceFolder}/dataEditor-${serverPort}.log')
    ?.replace('${workspaceFolder}', appDataPath)
    .replace('${serverPort}', serverPort.toString())
  const logLevel =
    process.env.OMEGA_EDIT_CLIENT_LOG_LEVEL ||
    config.get<string>('logLevel', 'info')
  setLogger(createSimpleFileLogger(logFile, logLevel))
  vscode.window.showInformationMessage(
    `Logging to '${logFile}', at level '${logLevel}'`
  )
}

async function serverStop() {
  const pidFile = getServerPidFile()

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile).toString())
    if (await stopServerUsingPID(pid)) {
      fs.unlinkSync(pidFile)
      vscode.window.setStatusBarMessage(
        `Ωedit server stopped on port ${serverPort} with PID ${pid}`,
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 1000)
        })
      )
      serverPort = 0
    } else {
      vscode.window.showErrorMessage(
        `Ωedit server on port ${serverPort} with PID ${pid} failed to stop`
      )
    }
  }
}

async function serverStart(ctx, version) {
  const pidFile = getServerPidFile()
  await serverStop()

  const serverStartingText = `Ωedit server v${version} starting on port ${serverPort}`
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

  const serverPid = await startServer(
    ctx.asAbsolutePath('node_modules/omega-edit'),
    version,
    serverPort
  )
  if (serverPid) {
    fs.writeFileSync(pidFile, serverPid.toString())
  }

  clearInterval(animationIntervalId)
  statusBarItem.text = `Ωedit server v${version} started on port ${serverPort} with PID ${serverPid}`
  setTimeout(() => {
    statusBarItem.dispose()
  }, 1000)
}

export function activate(ctx: vscode.ExtensionContext) {
  const omegaEditPackageVersion = getOmegaEditPackageVersion(
    ctx.asAbsolutePath('./package.json')
  )
  fs.mkdirSync(appDataPath, { recursive: true })

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.data.edit',
      async (startServ: boolean = true, fileToEdit: string = '') => {
        await getOmegaEditPort()
        setupLogging()
        setAutoFixViewportDataLength(true)
        if (startServ) {
          await serverStart(ctx, omegaEditPackageVersion)
        }
        await initOmegaEditClient(serverPort)
        return await createOmegaEditWebviewPanel(ctx, startServ, fileToEdit)
      }
    )
  )
}

async function createOmegaEditWebviewPanel(
  ctx: vscode.ExtensionContext,
  startServ: boolean,
  fileToEdit: string
) {
  const dataEditorView = new DataEditWebView(
    ctx,
    'dataEditor',
    'Data Editor',
    fileToEdit
  )

  await dataEditorView.initialize()
  dataEditorView.show()

  dataEditorView.panel.onDidDispose(
    async () => {
      if (startServ) {
        await serverStop()
      }
      await dataEditorView.dispose()
    },
    undefined,
    ctx.subscriptions
  )

  return dataEditorView
}
