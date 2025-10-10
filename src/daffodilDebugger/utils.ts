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
import _locateJavaHome from '@viperproject/locate-java-home'
import { IJavaHomeInfo } from '@viperproject/locate-java-home/js/es5/lib/interfaces'
import * as semver from 'semver'
import { LIB_VERSION } from '../version'
import { deactivate } from '../adapter/extension'
import { Artifact } from '../classes/artifact'
import { DFDLDebugger } from '../classes/dfdlDebugger'
import { displayModalError, osCheck, runScript, terminalName } from '../utils'
import { outputChannel } from '../adapter/activateDaffodilDebug'
import { checkIfDaffodilJarsNeeded } from './daffodilJars'

export const daffodilArtifact = (version: string): Artifact => {
  return new Artifact('daffodil-debugger', version, 'daffodil-debugger')
}

export const stopDebugger = async (id: number | undefined = undefined) =>
  child_process.exec(osCheck(`taskkill /F /PID ${id}`, `kill -9 ${id}`))

export const shellArgs = (
  port: number,
  timeout: string,
  daffodilPath: string,
  isAtLeastJdk17: boolean
) => {
  // Workaround: certain reflection (used by JAXB) isn't allowed by default in JDK 17:
  //   https://docs.oracle.com/en/java/javase/17/migrate/migrating-jdk-8-later-jdk-releases.html#GUID-7BB28E4D-99B3-4078-BDC4-FC24180CE82B
  const extraArgs = isAtLeastJdk17
    ? osCheck(
        ['-J"--add-opens=java.base/java.lang=ALL-UNNAMED"'],
        ['-J--add-opens', '-Jjava.base/java.lang=ALL-UNNAMED']
      )
    : []
  return [
    '--listenPort',
    `${port}`,
    '--listenTimeout',
    `${timeout}`,
    '--daffodilPath',
    `"${daffodilPath}"`,
  ].concat(extraArgs)
}

export async function getScalaVersion(
  daffodilVersion: string
): Promise<string> {
  if (semver.satisfies(daffodilVersion, '>=4.0.0')) return '3'
  else if (semver.satisfies(daffodilVersion, '>=3.11.0')) return '2.13'
  else return '2.12'
}

export async function runDebugger(
  rootPath: string,
  daffodilDebugClasspath: Array<string>,
  filePath: string,
  serverPort: number,
  dfdlDebugger: DFDLDebugger,
  createTerminal: boolean = false
): Promise<vscode.Terminal | undefined> {
  if (
    !dfdlDebugger.timeout.endsWith('s') &&
    !dfdlDebugger.timeout.endsWith('m') &&
    !dfdlDebugger.timeout.endsWith('s')
  ) {
    vscode.window.showErrorMessage(
      `DFDL Debugger Timeout ${dfdlDebugger.timeout} does not end in either s for seconds, m for minutes or h for hours.
      Appending s to end of timeout string.`
    )
    dfdlDebugger.timeout = `${dfdlDebugger.timeout}s`
  }

  // Locates the $JAVA_HOME, or if not defined, the highest version available.
  const javaHome: IJavaHomeInfo | undefined = await getJavaHome()

  const isAtLeastJdk17: boolean = parseFloat(javaHome?.version ?? '0') >= 17
  outputChannel.appendLine(
    `[DEBUG] Choosing java home at ${javaHome?.path}, version ${javaHome?.version}, is at least JDK 17: ${isAtLeastJdk17}`
  )

  let dfdlVersion = dfdlDebugger.daffodilVersion
  let scalaVersion = await getScalaVersion(dfdlDebugger.daffodilVersion)

  if (scalaVersion == '') {
    displayModalError(
      `Daffodil Version ${dfdlDebugger.daffodilVersion} does not satisfy any version requirements`
    )
    return undefined
  }

  outputChannel.appendLine(
    `[INFO] Using Scala ${scalaVersion} + Daffodil ${dfdlVersion} debugger`
  )

  /**
   * The Scala 3 with Daffodil >= 4.0.0 debugger can only be ran on JDK 17 or greater. So if the java version
   * being used is less than 17, fallback to the Scala 2.13 and Daffodil 3.11.0 debugger and notify the user.
   */
  if (semver.satisfies(dfdlVersion, '>=4.0.0') && !isAtLeastJdk17) {
    displayModalError(`Daffodil Versions 4.0.0+ requires JDK >= 17`)
    return undefined
  }

  // Download the daffodil CLI jars if needed
  const daffodilPath = await checkIfDaffodilJarsNeeded(dfdlVersion)

  const artifact = daffodilArtifact(dfdlVersion)
  const scriptPath = path.join(
    rootPath,
    `daffodil-debugger-${scalaVersion}-${LIB_VERSION}`
  )

  // The backend's launch script honors $JAVA_HOME, but if not set it assumes java is available on the path.
  const env = javaHome
    ? {
        DAFFODIL_DEBUG_CLASSPATH: daffodilDebugClasspath.join(
          osCheck(';', ':')
        ),
        DAFFODIL_DEBUG_LOG_LEVEL: dfdlDebugger.logging.level,
        DAFFODIL_DEBUG_LOG_FILE: dfdlDebugger.logging.file,
        JAVA_HOME: javaHome?.path,
      }
    : {
        DAFFODIL_DEBUG_CLASSPATH: daffodilDebugClasspath.join(
          osCheck(';', ':')
        ),
        DAFFODIL_DEBUG_LOG_LEVEL: dfdlDebugger.logging.level,
        DAFFODIL_DEBUG_LOG_FILE: dfdlDebugger.logging.file,
      }

  return await runScript(
    scriptPath,
    artifact.scriptName,
    createTerminal,
    shellArgs(serverPort, dfdlDebugger.timeout, daffodilPath, isAtLeastJdk17),
    env,
    'daffodil'
  )
}

export const getJavaHome = async (): Promise<IJavaHomeInfo | undefined> =>
  await new Promise((resolve, reject) => {
    _locateJavaHome({ version: '>=1.8' }, (error, javaHomes) => {
      outputChannel.appendLine(
        `[DEBUG] Detected java homes: ${JSON.stringify(javaHomes)}`
      )
      javaHomes
        ? resolve(
            process.env.JAVA_HOME
              ? javaHomes.find(
                  (home, idx, obj) => home.path == process.env.JAVA_HOME
                )
              : latestJdk(javaHomes)
          )
        : undefined
    })
  })

function latestJdk(jdkHomes: IJavaHomeInfo[]): IJavaHomeInfo | undefined {
  if (jdkHomes.length > 0) {
    return jdkHomes.sort((a, b) => {
      const byVersion = -semver.compare(a.version, b.version)
      if (byVersion === 0) return b.security - a.security
      else return byVersion
    })[0]
  } else {
    return undefined
  }
}

// Function for stopping debugging
export async function stopDebugging() {
  vscode.debug.stopDebugging().then(async () => {
    deactivate()
    for (const terminal of vscode.window.terminals) {
      const pid = await terminal.processId

      // Only kill known debug terminals created by the extension itself
      if (terminal.name.toLowerCase().includes(terminalName)) {
        terminal.dispose()

        // Wait briefly to allow dispose to take effect
        await new Promise((res) => setTimeout(res, 200))

        // If terminal still exists, fallback to stopDebugger
        // "stopDebugger" uses taskkill or kill which results in an exit code of 1
        const stillExists = vscode.window.terminals.some((t) => t === terminal)
        if (stillExists && pid) {
          await stopDebugger(pid)
        }
      }
    }
  })
}
