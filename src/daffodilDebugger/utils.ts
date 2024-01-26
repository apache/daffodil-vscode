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

export const stopDebugger = async (id: number | undefined = undefined) =>
  child_process.exec(osCheck(`taskkill /F /PID ${id}`, `kill -9 ${id}`))

export const shellArgs = (port: number, isAtLeastJdk17: boolean) => {
  // Workaround: certain reflection (used by JAXB) isn't allowed by default in JDK 17:
  //   https://docs.oracle.com/en/java/javase/17/migrate/migrating-jdk-8-later-jdk-releases.html#GUID-7BB28E4D-99B3-4078-BDC4-FC24180CE82B
  const extraArgs = isAtLeastJdk17
    ? osCheck(
        ['-J"--add-opens=java.base/java.lang=ALL-UNNAMED"'],
        ['-J--add-opens', '-Jjava.base/java.lang=ALL-UNNAMED']
      )
    : []
  return ['--listenPort', `${port}`].concat(extraArgs)
}

export async function runDebugger(
  rootPath: string,
  daffodilDebugClasspath: Array<string>,
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
  // Locates the $JAVA_HOME, or if not defined, the highest version available.
  const javaHome: IJavaHomeInfo | undefined = await new Promise(
    (resolve, reject) => {
      _locateJavaHome({ version: '>=1.8' }, (error, javaHomes) => {
        console.log(`detected java homes: ${JSON.stringify(javaHomes)}`)
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
    }
  )
  const isAtLeastJdk17: boolean = parseFloat(javaHome?.version ?? '0') >= 17
  console.log(
    `choosing java home at ${javaHome?.path}, version ${javaHome?.version}, is at least JDK 17: ${isAtLeastJdk17}`
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
    shellArgs(serverPort, isAtLeastJdk17),
    env,
    'daffodil'
  )
}

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
    for (const t of vscode.window.terminals) {
      await t.processId?.then(async (id) => {
        await stopDebugger(id)
      })
    }
  })
}
