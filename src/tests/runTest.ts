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

// All tests ran here are ones that require the vscode API
import * as path from 'path'
import * as cp from 'child_process'
import {
  runTests,
  resolveCliArgsFromVSCodeExecutablePath,
  downloadAndUnzipVSCode,
} from '@vscode/test-electron'

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../')

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode('1.68.0')
    const [cli, ...args] =
      resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath)

    // Install required extensions
    cp.spawnSync(
      cli,
      [...args, '--install-extension', 'vincaslt.highlight-matching-tag'],
      {
        encoding: 'utf-8',
        stdio: 'inherit',
      }
    )

    // Download VS Code, unzip it and run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    })
  } catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
