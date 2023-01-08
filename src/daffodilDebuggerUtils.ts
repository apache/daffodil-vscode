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
import * as path from 'path'
import * as child_process from 'child_process'
import { LIB_VERSION } from './version'
import { deactivate } from './adapter/extension'
import { getDaffodilVersion } from './daffodil'
import { Artifact } from './classes/artifact'
import { osCheck, runScript } from './utils'

export const daffodilVersion = (filePath: string): string => {
  return getDaffodilVersion(filePath)
}

export const daffodilArtifact = (version: string): Artifact => {
  return new Artifact('daffodil-debugger', version, 'daffodil-debugger')
}

export async function buildDebugger(baseFolder: string, filePath: string) {
  if (!filePath.includes('.vscode/extension')) {
    if (!fs.existsSync(filePath)) {
      let command = osCheck(
        'sbt universal:packageBin',
        '/bin/bash --login -c "sbt universal:packageBin"'
      ) // Needed --login so it could resolve sbt command

      child_process.execSync(command, { cwd: baseFolder })
    }
  }
}

export const stopDebugger = (id: number | undefined = undefined) =>
  child_process.exec(osCheck(`taskkill /F /PID ${id}`, `kill -9 ${id}`))

export const shellPath = (scriptName: string) =>
  osCheck(scriptName, '/bin/bash')

export const shellArgs = (scriptName: string, port: number) =>
  osCheck(
    ['--listenPort', `${port}`],
    ['--login', '-c', `${scriptName} --listenPort ${port}`]
  )

export async function runDebugger(
  rootPath: string,
  daffodilDebugClasspath: string,
  filePath: string,
  serverPort: number = 4711
): Promise<vscode.Terminal> {
  const dfdlVersion = daffodilVersion(filePath)
  const artifact = daffodilArtifact(dfdlVersion)
  const scriptPath = path.join(
    rootPath,
    `daffodil-debugger-${dfdlVersion}-${LIB_VERSION}`
  )

  /*
   * For Mac if /bin/bash --login -c not used errors about compiled version versus
   * currently being used java version. Not sure if its needed for linux but it
   * being there will cause no issues.
   */

  return await runScript(
    scriptPath,
    artifact.scriptName,
    shellPath(artifact.scriptName),
    shellArgs(artifact.scriptName, serverPort),
    {
      DAFFODIL_DEBUG_CLASSPATH: daffodilDebugClasspath,
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
