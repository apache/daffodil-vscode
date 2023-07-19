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
import * as path from 'path'
import * as child_process from 'child_process'
import { LIB_VERSION } from '../version'
import { deactivate } from '../adapter/extension'
import { getDaffodilVersion } from './daffodil'
import { Artifact } from '../classes/artifact'
import { DFDLDebugger } from '../classes/dfdlDebugger'
import { osCheck, runScript } from '../utils'

export const daffodilVersion = (filePath: string): string => {
  return getDaffodilVersion(filePath)
}

export const daffodilArtifact = (version: string): Artifact => {
  return new Artifact('daffodil-debugger', version, 'daffodil-debugger')
}

export const stopDebugger = (id: number | undefined = undefined) =>
  child_process.exec(osCheck(`taskkill /F /PID ${id}`, `kill -9 ${id}`))

export const shellArgs = (port: number) => ['--listenPort', `${port}`]

export async function runDebugger(
  rootPath: string,
  daffodilDebugClasspath: string,
  filePath: string,
  serverPort: number,
  dfdlDebugger: DFDLDebugger,
  createTerminal: boolean = false
): Promise<vscode.Terminal> {
  const dfdlVersion = daffodilVersion(filePath)
  const artifact = daffodilArtifact(dfdlVersion)
  const scriptPath = path.join(
    rootPath,
    `daffodil-debugger-${dfdlVersion}-${LIB_VERSION}`
  )

  return await runScript(
    scriptPath,
    artifact.scriptName,
    createTerminal,
    shellArgs(serverPort),
    {
      DAFFODIL_DEBUG_CLASSPATH: daffodilDebugClasspath,
      DAFFODIL_DEBUG_LOG_LEVEL: dfdlDebugger.logging.level,
      DAFFODIL_DEBUG_LOG_FILE: dfdlDebugger.logging.file,
    },
    'daffodil'
  )
}

// Function for stopping debugging
export async function stopDebugging() {
  vscode.debug.stopDebugging()
  deactivate()
  vscode.window.activeTerminal?.processId.then(async (id) => {
    await stopDebugger(id)
  })
}
