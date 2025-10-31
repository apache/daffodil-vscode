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
 * Only the default version of Daffodil is bundled with the extension, all other versions are
 * downloaded. The CLI zip is an official daffodil release that contains all the daffodil jars
 * (and their transitive dependencies) that the debugger needs for a particular Daffodil version.
 * The debugger doesn't need all the jars that it bundles (e.g. daffodil-cli.jar) but those will
 * just be ignored.
 *
 * If - The bundled version of the Daffodil CLI matches the Daffodil version wanting to be used
 * then default to use that path.
 * If - The global storage path for the Daffodil version already exists, use that path.
 * Else - Download and extract the Daffodil CLI that matches the version desired to the global
 * storage path.
 */
export async function checkIfDaffodilJarsNeeded(
  daffodilVersion: string
): Promise<string> {
  const context = (await vscode.commands.executeCommand(
    'getContext'
  )) as vscode.ExtensionContext

  // If the Daffodil Version desired is bundled in the extension, use that path
  const extensionPath = path.join(
    context.asAbsolutePath('./dist'),
    `daffodil/apache-daffodil-${daffodilVersion}-bin`
  )
  if (fs.existsSync(extensionPath)) {
    outputChannel.appendLine(`[INFO] Using bundled Daffodil CLI JARs.`)
    return extensionPath
  }

  // downloadAndExtractToGlobalStorage only tries to download the Daffodil CLI release file if
  // the desired version's bin folder doesn't already exists.
  return await downloadAndExtractToGlobalStorage(context, daffodilVersion)
}

export async function downloadAndExtractToGlobalStorage(
  context: vscode.ExtensionContext,
  daffodilVersion: string
): Promise<string> {
  /**
   * Global storage paths:
   *  Mac: /Users/<username>/Library/Application Support/Code/User/globalStorage/asf.apache-daffodil-vscode
   *  Windows: %APPDATA%\Code\User\globalStorage\asf.apache-daffodil-vscode
   *  Linux: /home/<username>/.config/Code/User/globalStorage/asf.apache-daffodil-vscode
   */
  const destFolder = path.join(context.globalStorageUri.fsPath, 'daffodil')
  const binName = `apache-daffodil-${daffodilVersion}-bin`
  const binFolder = path.join(destFolder, binName)

  if (!fs.existsSync(binFolder)) {
    const url = `https://www.apache.org/dyn/closer.lua/download/daffodil/${daffodilVersion}/bin/${binName}.zip`
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
