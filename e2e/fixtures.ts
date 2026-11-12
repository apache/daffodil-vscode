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

// Fixtures are how Playwright sets up what a test needs. A test lists the ones
// it wants as arguments, such as `async ({ dataEditor, workspaceDir }) => ...`.
// Playwright creates them before the test and cleans them up after it.
//
// Each test gets its own set, so here that means its own VS Code and its own
// copy of the test data. Nothing carries over from one test to the next.
//
// The fixtures are at the bottom of this file, and the functions above them are
// their helpers. Read more: https://playwright.dev/docs/test-fixtures

import { stopProcessUsingPID } from '@omega-edit/client'
import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type TestInfo,
} from '@playwright/test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import XDGAppPaths from 'xdg-app-paths'
import { DataEditor } from './pages/dataEditor'
import { Workbench } from './pages/workbench'

// Specs import test and expect from this file, rather than from
// @playwright/test, because only the test exported here has the fixtures
export { expect } from '@playwright/test'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const TEST_DATA_DIR = path.join(PROJECT_ROOT, 'src/tests/data')

// Not the default of 9000, so that tests can't reuse or stop the server of a
// Data Editor that a developer has open.
const DATA_EDITOR_PORT = 9100

// These go in the test's own settings.json, so they don't change your VS Code
const USER_SETTINGS = {
  // Playwright can't reach native dialogs, so a test would hang on one. These
  // make VS Code draw its dialogs inside the window instead.
  'files.simpleDialog.enable': true,
  'window.dialogStyle': 'custom',

  // Newer versions of VS Code otherwise open a Chat panel, which takes focus
  'chat.disableAIFeatures': true,

  // The port that the extension starts the Data Editor's server on
  'dataEditor.port': DATA_EDITOR_PORT,

  // Stop VS Code from showing prompts and tabs that would get in a test's way
  'security.workspace.trust.enabled': false,
  'telemetry.telemetryLevel': 'off',
  'update.mode': 'none',
  'workbench.startupEditor': 'none',
}

// VS Code reads its settings from User/settings.json in its user data folder
function writeUserSettings(userDataDir: string) {
  const userDir = path.join(userDataDir, 'User')
  fs.mkdirSync(userDir, { recursive: true })
  fs.writeFileSync(
    path.join(userDir, 'settings.json'),
    JSON.stringify(USER_SETTINGS, null, 2)
  )
}

// Starts a VS Code with this repo's extension loaded and workspaceDir open
async function launchVSCode(sandbox: string, workspaceDir: string) {
  // The settings have to be in place before VS Code starts
  const userDataDir = path.join(sandbox, 'user-data')
  writeUserSettings(userDataDir)

  // The command line to start VS Code with
  const args = [
    // The folder to open
    workspaceDir,

    // Load the extension from this repo, the same way that pressing F5 does
    `--extensionDevelopmentPath=${PROJECT_ROOT}`,

    // Keep the test's settings and extensions apart from your own
    `--user-data-dir=${userDataDir}`,
    `--extensions-dir=${path.join(sandbox, 'extensions')}`,

    // Don't open tabs that would cover what the test is doing
    '--skip-welcome',
    '--skip-release-notes',
  ]

  // Chromium's sandbox needs a helper program owned by root, which a downloaded
  // copy of VS Code doesn't have
  if (process.platform === 'linux') args.push('--no-sandbox')

  // VS Code's own terminal sets this, which would start VS Code as plain node
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE

  // VS Code is an Electron app, which Playwright can start and control in much
  // the same way as a browser
  return electron.launch({
    executablePath: process.env.DAFFODIL_E2E_VSCODE_EXECUTABLE,
    args,
    env: env as Record<string, string>,
  })
}

// A trace is a recording of a test: every step, with a screenshot and a
// snapshot of the page, that you can look through after the test has run.
//
// Playwright can't trace VS Code by itself, so the fixture records its own.
// UI mode and the HTML report both show this attachment.
async function saveTrace(vscode: ElectronApplication, testInfo: TestInfo) {
  // Not "trace.zip", as Playwright writes its own file of that name in UI mode
  const tracePath = testInfo.outputPath('vscode-trace.zip')
  await vscode.context().tracing.stop({ path: tracePath })

  // The viewers find a trace by this attachment name, so it must be "trace"
  await testInfo.attach('trace', {
    path: tracePath,
    contentType: 'application/zip',
  })
}

// A dialog left open by a failed test can stop VS Code from quitting, so only
// wait 10 seconds for it before killing it. Killing it does nothing if it has
// already quit.
async function closeVSCode(vscode: ElectronApplication) {
  const vscodeProcess = vscode.process() // Not available after closing
  const timeout = new Promise((resolve) => setTimeout(resolve, 10_000))

  // Carry on when VS Code has closed or the timeout ends, whichever comes first
  await Promise.race([vscode.close(), timeout])
  vscodeProcess.kill()
}

// The server keeps running for a while after VS Code closes. Stopping it gives
// each test its own server, and releases the files it holds in the sandbox.
async function stopDataEditorServer() {
  // The server's process ID is kept in this file
  const pidFile = path.join(
    XDGAppPaths({ name: 'omega_edit' }).data(),
    `serv-${DATA_EDITOR_PORT}.pid`
  )

  // No file means that this test never started a server
  if (!fs.existsSync(pidFile)) return

  // Stop the server, then remove its file so that the next test starts clean
  await stopProcessUsingPID(parseInt(fs.readFileSync(pidFile).toString()))
  fs.rmSync(pidFile, { force: true })
}

type E2EFixtures = {
  /** Temporary directory for everything that a single test writes */
  sandbox: string
  /** Folder open in VS Code: a copy of src/tests/data, safe to modify */
  workspaceDir: string
  /** The running VS Code, as Playwright sees it */
  vscode: ElectronApplication
  /** Controls VS Code's own UI: see pages/workbench.ts */
  workbench: Workbench
  /** Controls the Data Editor: see pages/dataEditor.ts */
  dataEditor: DataEditor
}

// For a test that asks for dataEditor, setup runs in this order:
//
//   sandbox > workspaceDir > vscode > workbench > dataEditor
//
// Cleanup then runs in the opposite order. A fixture only runs if a test needs
// it, so debugger.spec.ts, which doesn't ask for dataEditor, skips that one.
//
// Every fixture below has the same shape:
//  - Its first argument lists the other fixtures that it needs. Playwright sets
//    those up first, so asking for dataEditor also starts VS Code.
//  - The code before `await use(value)` is the setup.
//  - `use` hands the value to the test, and waits for the test to finish.
//  - The code after it is the cleanup, which runs even if the test failed.
export const test = base.extend<E2EFixtures>({
  // {} means that this fixture needs no others. Playwright requires the braces.
  sandbox: async ({}, use) => {
    // Make a new, empty folder inside the system's temporary folder
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dfdl-e2e-'))

    // The other fixtures and the test all run here
    await use(sandbox)

    // Delete the folder. This retries, as Windows can take a moment to release
    // a closed program's files.
    fs.rmSync(sandbox, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 500,
    })
  },

  workspaceDir: async ({ sandbox }, use) => {
    // Copy the test data, so that a test can't change the originals
    const workspaceDir = path.join(sandbox, 'workspace')
    fs.cpSync(TEST_DATA_DIR, workspaceDir, { recursive: true })
    await use(workspaceDir)
  },

  vscode: async ({ sandbox, workspaceDir }, use, testInfo) => {
    const vscode = await launchVSCode(sandbox, workspaceDir)

    // Recording starts here, and saveTrace stops it and saves the result
    await vscode.context().tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })

    // The test runs here
    await use(vscode)

    // The test has finished, so save its recording and shut everything down
    await saveTrace(vscode, testInfo)
    await closeVSCode(vscode)
    await stopDataEditorServer()
  },

  workbench: async ({ vscode }, use) => {
    // firstWindow() gives a Page, Playwright's name for a window or tab
    const workbench = new Workbench(await vscode.firstWindow())

    // Don't start the test until VS Code's UI has appeared
    await workbench.waitUntilReady()
    await use(workbench)
  },

  dataEditor: async ({ workbench }, use) => {
    // This only creates the helper. The test opens the Data Editor itself.
    await use(new DataEditor(workbench))
  },
})
