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

import * as fs from 'fs'
import * as path from 'path'
import { expect, test } from './fixtures'

// `test` comes from ./fixtures, which provides the arguments that each test
// asks for. Every test gets its own VS Code and its own copy of the test data,
// so tests can't affect each other.
//
// VS Code is already running when a test's first line runs, and the fixtures
// close it again after the last line.

test('shows the bytes of the opened file', async ({
  dataEditor,
  workspaceDir,
}) => {
  // Open the test's copy of test.txt in the Data Editor
  await dataEditor.open(path.join(workspaceDir, 'test.txt'))

  // test.txt starts with "T", which is 54 in hex. expect() on a locator keeps
  // checking until it passes or times out, so there's no need to wait for the
  // file to load first.
  await expect(dataEditor.byte(0)).toHaveText('54')
})

test('saves an overwritten byte to disk', async ({
  dataEditor,
  workspaceDir,
}) => {
  const file = path.join(workspaceDir, 'test.txt')

  // The saved file should be the same, except that it starts with an "A" (0x41)
  const expectedBytes = fs.readFileSync(file)
  expectedBytes[0] = 0x41

  // Open the file and change its first byte
  await dataEditor.open(file)
  await dataEditor.overwriteByte(0, '41')

  // The new value should show on screen
  await expect(dataEditor.byte(0)).toHaveText('41')

  // Write the change to the file on disk
  await dataEditor.save()

  // Saving finishes some time after the click, so expect.poll keeps re-reading
  // the file until it matches or times out
  await expect.poll(() => fs.readFileSync(file)).toEqual(expectedBytes)
})
