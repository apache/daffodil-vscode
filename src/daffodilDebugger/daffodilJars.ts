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

import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { outputChannel } from '../adapter/activateDaffodilDebug'
import { downloadAndExtract } from '../utils'

/**
 * The daffodil debugger doesn't bundle any of daffodil jars because we want to support
 * many versions of daffodil and do not want to bundle them all. The CLI zip is an official
 * daffodil release that contains all the daffodil jars (and their transitive dependencies)
 * that the debugger needs for a particular Daffodil version. The debugger doesn't need all
 * the jars that it bundles (e.g. daffodil-cli.jar) but those will just be ignored.
 */
export async function checkIfDaffodilJarsNeeded(
  daffodilVersion: string
): Promise<string> {
  const context = (await vscode.commands.executeCommand(
    'getContext'
  )) as vscode.ExtensionContext

  /**
   * Global storage paths:
   *  Mac: /Users/<username>/Library/Application Support/Code/User/globalStorage/asf.apache-daffodil-vscode
   *  Windows: %APPDATA%\Code\User\globalStorage\asf.apache-daffodil-vscode
   *  Linux: /home/<username>/.config/Code/User/globalStorage/asf.apache-daffodil-vscode
   */

  const destFolder = path.join(context.globalStorageUri.fsPath, 'daffodil')
  const binFolder = path.join(
    destFolder,
    `apache-daffodil-${daffodilVersion}-bin`
  )

  if (!fs.existsSync(binFolder)) {
    const url = `https://www.apache.org/dyn/closer.lua/download/daffodil/${daffodilVersion}/bin/apache-daffodil-${daffodilVersion}-bin.zip`
    try {
      await downloadAndExtract('Daffodil CLI JARs', url, destFolder)
    } catch (err) {
      console.error(err)
    }
  } else {
    outputChannel.appendLine(
      `[INFO] Daffodil CLI JARs already exists. Skipping download.`
    )
  }

  return binFolder
}
