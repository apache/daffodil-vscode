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
import * as unzip from 'unzip-stream'
import * as os from 'os'
import { pipeline } from 'stream/promises'

import { outputChannel } from '../adapter/activateDaffodilDebug'

async function downloadAndExtractDaffodilCLIJars(
  url: string,
  targetDir: string
): Promise<void> {
  outputChannel.appendLine(
    `[INFO] Daffodil CLI JARs don't exist. Downloading and extracting...`
  )

  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(
      `Failed to download ${url}: ${res.status} ${res.statusText}`
    )
  }

  // Pipe the response body stream into unzip-stream and wait for completion
  await pipeline(res.body as any, unzip.Extract({ path: targetDir }))

  console.log(`Extracted to: ${targetDir}`)
}

export async function checkIfDaffodilJarsNeeded(daffodilVersion: string) {
  const destFolder = path.join(os.homedir(), '.cache', 'daffodil-debugger')

  if (
    !fs.existsSync(
      path.join(destFolder, `apache-daffodil-${daffodilVersion}-bin`)
    )
  ) {
    const url = `https://www.apache.org/dyn/closer.lua/download/daffodil/${daffodilVersion}/bin/apache-daffodil-${daffodilVersion}-bin.zip`
    try {
      await downloadAndExtractDaffodilCLIJars(url, destFolder)
    } catch (err) {
      console.error(err)
    }
  } else {
    outputChannel.appendLine(
      `[INFO] Daffodil CLI JARs already exists. Skipping download.`
    )
  }
}
