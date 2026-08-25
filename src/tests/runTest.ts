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
import * as fs from 'fs'
import * as path from 'path'
import { runTests, downloadAndUnzipVSCode } from '@vscode/test-electron'

// The earliest version supported as indicated in package.json engines/vscode,
// so that version is a reasonable default.
const DEFAULT_DAFFODIL_TEST_VSCODE_VERSION =
  require('../../package.json').engines.vscode.replace('^', '')

function resolveMacOSExecutable(executablePath: string): string {
  if (process.platform !== 'darwin' || fs.existsSync(executablePath)) {
    return executablePath
  }

  const macOSDirectory = path.dirname(executablePath)
  const infoPlistPath = path.resolve(macOSDirectory, '../Info.plist')

  try {
    const infoPlist = fs.readFileSync(infoPlistPath, 'utf8')
    const executableName = infoPlist.match(
      /<key>CFBundleExecutable<\/key>\s*<string>([^<]+)<\/string>/
    )?.[1]

    if (executableName) {
      const resolvedPath = path.resolve(macOSDirectory, executableName)
      if (
        path.dirname(resolvedPath) === macOSDirectory &&
        fs.existsSync(resolvedPath)
      ) {
        return resolvedPath
      }
    }
  } catch {
    // Preserve the original path so runTests reports the launch failure.
  }

  return executablePath
}

async function downloadAndUnzipVSCodeRetry(
  testVsCodeVersion,
  retries = 5,
  delay = 4000
): Promise<string | undefined> {
  let backoff = delay
  for (let i = 1; i <= retries; i++) {
    try {
      const vscodeExecutablePath =
        await downloadAndUnzipVSCode(testVsCodeVersion)
      return vscodeExecutablePath
    } catch (error) {
      if (i === retries) {
        throw error
      } else {
        console.warn(`Attempt ${i} failed. Retrying in ${backoff}ms...`)
        await new Promise((r) => setTimeout(r, backoff))
        backoff = backoff * 2
      }
    }
  }
}

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

    // Download VS Code and retry upon error
    const downloadedExecutablePath =
      await downloadAndUnzipVSCodeRetry(testVsCodeVersion)
    const vscodeExecutablePath = resolveMacOSExecutable(
      downloadedExecutablePath!
    )

    // Run the integration tests
    const runTestsResult = await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    })

    // Exit with the same exit code as the tests
    process.exit(runTestsResult)
  } catch (err) {
    console.error('Failed to run tests: ' + err)

    // Exit with an error code
    process.exit(1)
  }
}

main().then()
