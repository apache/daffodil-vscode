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

// The earliest version supported as indicated in package.json engines/vscode,
// so that version is a reasonable default.
const DEFAULT_DAFFODIL_TEST_VSCODE_VERSION =
  require('../../package.json').engines.vscode.replace('^', '')

async function main() {
  const disable_cert_verification =
    process.argv.includes('-k') ||
    process.argv.includes('--disable_cert_verification')

  if (disable_cert_verification) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  // The version of VS Code to use for running the test suite in.  Aside from
  // actual version strings, 'stable' can be used for using the latest stable
  // release and 'insiders' for using the latest insiders release.
  const testVsCodeVersion = process.env.DAFFODIL_TEST_VSCODE_VERSION
    ? process.env.DAFFODIL_TEST_VSCODE_VERSION
    : DEFAULT_DAFFODIL_TEST_VSCODE_VERSION

  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../')

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    const vscodeExecutablePath = await downloadAndUnzipVSCode(testVsCodeVersion)
    const [cli, ...args] =
      resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath)

    // Install required extensions
    cp.spawnSync(
      cli,
      [
        ...args,
        '--install-extension',
        'vincaslt.highlight-matching-tag',
        '--install-extension',
        'wmanth.jar-viewer',
      ],
      {
        encoding: 'utf-8',
        stdio: 'inherit',
      }
    )

    // Download VS Code, unzip it and run the integration tests
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    })
  } catch (err) {
    console.error('Failed to run tests: ' + err)
    process.exit(1)
  }
}

main().then()
