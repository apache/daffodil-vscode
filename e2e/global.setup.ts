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

import { downloadAndUnzipVSCode } from '@vscode/test-electron'
import * as fs from 'fs'
import * as path from 'path'

// The oldest version the extension supports, from package.json engines/vscode
const OLDEST_SUPPORTED_VSCODE =
  require('../package.json').engines.vscode.replace('^', '')

const DOWNLOAD_ATTEMPTS = 5

// Downloads can fail on a bad connection, so retry, waiting longer each time.
// A version that's already in .vscode-test isn't downloaded again.
async function downloadVSCode(version: string): Promise<string> {
  for (let attempt = 1; attempt < DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      return await downloadAndUnzipVSCode(version)
    } catch (error) {
      console.warn(`VS Code download attempt ${attempt} failed: ${error}`)

      // Wait 4 seconds after the first failure, 8 after the second, and so on
      await new Promise((resolve) => setTimeout(resolve, attempt * 4000))
    }
  }

  // The last attempt isn't caught, so that its error fails the run
  return downloadAndUnzipVSCode(version)
}

// On macOS, the reported path can name an executable that doesn't exist. The
// real name is in the app's Info.plist.
function findExecutable(reportedPath: string): string {
  // There's nothing to fix if the path is right
  if (fs.existsSync(reportedPath)) return reportedPath

  // Otherwise, look up the name in Info.plist, one folder above the executable
  const macOSDir = path.dirname(reportedPath)
  const infoPlist = fs.readFileSync(
    path.join(macOSDir, '../Info.plist'),
    'utf8'
  )
  const executableName = infoPlist.match(
    /<key>CFBundleExecutable<\/key>\s*<string>([^<]+)<\/string>/
  )?.[1]
  return executableName ? path.join(macOSDir, executableName) : reportedPath
}

/**
 * Runs once before all tests, and passes the path of the VS Code to launch to
 * them through the environment. DAFFODIL_TEST_VSCODE_VERSION picks the version,
 * which can also be 'stable' or 'insiders'.
 *
 * Tests run in separate processes from this one, so they can't see its
 * variables, but they do inherit its environment.
 */
export default async function globalSetup() {
  // Use the version that was asked for, or else the oldest supported one
  const version =
    process.env.DAFFODIL_TEST_VSCODE_VERSION || OLDEST_SUPPORTED_VSCODE

  // Get that version, which gives back the path of its executable
  const reportedPath = await downloadVSCode(version)

  // Save the executable's real path, which launchVSCode in fixtures.ts reads
  process.env.DAFFODIL_E2E_VSCODE_EXECUTABLE = findExecutable(reportedPath)
}
