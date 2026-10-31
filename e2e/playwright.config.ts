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

import { defineConfig } from '@playwright/test'

// What happens when you run `yarn test:e2e`:
//
//  1. pretest:e2e in package.json type-checks these tests and rebuilds the
//     extension, because the tests use the built copy in dist/.
//  2. Playwright reads this file.
//  3. Playwright runs global.setup.ts, which gets a copy of VS Code.
//  4. Playwright finds the *.spec.ts files in this folder. For each test:
//     a. fixtures.ts sets up what the test asks for, which starts VS Code.
//     b. The test runs. It controls VS Code through pages/workbench.ts and
//        pages/dataEditor.ts.
//     c. fixtures.ts saves a trace, closes VS Code and deletes temporary files.
//  5. Playwright writes the report to playwright-report/.

// Playwright's settings for these tests. The test:e2e script in package.json
// points Playwright at this file.
// All the options: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Runs once before all the tests, to download VS Code
  globalSetup: './global.setup.ts',

  // Where each test's files go. Without this, Playwright puts them beside
  // package.json instead of in this folder.
  outputDir: './test-results',

  // "list" prints each test's result as it finishes. "html" writes the report
  // that yarn test:e2e:report opens. Without open: 'never', a failed run would
  // open the report itself and hold up the terminal.
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }],
  ],

  // Run one test at a time, as VS Code windows running in parallel would share
  // a Data Editor server.
  workers: 1,

  // Starting VS Code and the Data Editor's server is slow, so these are longer
  // than the defaults of 30 seconds for a test and 5 seconds for an expect().
  timeout: 180_000,
  expect: { timeout: 30_000 },

  // CI machines are slower, so a failed test gets two more tries there
  retries: process.env.CI ? 2 : 0,

  // A test.only() left in by accident would skip every other test, so CI fails
  // if it finds one
  forbidOnly: !!process.env.CI,
})
