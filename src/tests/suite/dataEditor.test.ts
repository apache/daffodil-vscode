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

import * as assert from 'assert'
import * as os from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import fs from 'fs'
import {
  buildDaffodilDataHighlight,
  DAFFODIL_CURRENT_DATA_HIGHLIGHT_ID,
  DATA_EDITOR_COMMAND,
  OMEGA_EDIT_EXTENSION_ID,
  resolveDataFileUri,
} from '../../dataEditor'
import { PACKAGE_PATH, TEST_SCHEMA } from './common'

suite('Data Editor Test Suite', () => {
  test('data edit command is contributed', () => {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'))
    assert.strictEqual(
      packageJson.contributes.commands.some(
        (command) => command.command === DATA_EDITOR_COMMAND
      ),
      true
    )
  })

  test('declares OmegaEdit data editor extension dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'))
    assert.ok(
      Array.isArray(packageJson.extensionDependencies),
      'extensionDependencies must be declared'
    )
    assert.ok(
      packageJson.extensionDependencies.includes(OMEGA_EDIT_EXTENSION_ID),
      `extensionDependencies must include ${OMEGA_EDIT_EXTENSION_ID}`
    )
  })

  test('resolves provided data file paths', async () => {
    const dataUri = await resolveDataFileUri(TEST_SCHEMA)
    assert.ok(dataUri)
    assert.strictEqual(
      path.normalize(dataUri.fsPath),
      path.normalize(TEST_SCHEMA)
    )
  })

  test('resolves POSIX file paths containing colons', async function () {
    if (process.platform === 'win32') {
      this.skip()
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daffodil-data-'))
    const dataPath = path.join(tempDir, 'session:1.bin')
    try {
      fs.writeFileSync(dataPath, 'data')

      const dataUri = await resolveDataFileUri(dataPath)
      assert.ok(dataUri)
      assert.strictEqual(dataUri.scheme, 'file')
      assert.strictEqual(dataUri.fsPath, dataPath)
    } finally {
      fs.rmSync(tempDir, { force: true, recursive: true })
    }
  })

  test('builds Daffodil current-byte highlights', () => {
    assert.deepStrictEqual(buildDaffodilDataHighlight(5, 10), {
      id: DAFFODIL_CURRENT_DATA_HIGHLIGHT_ID,
      offset: 4,
      length: 1,
      kind: 'current',
      label: 'Daffodil parser byte 5',
      source: 'Apache Daffodil',
    })
    assert.strictEqual(buildDaffodilDataHighlight(0, 10), undefined)
    assert.strictEqual(buildDaffodilDataHighlight(1, 0), undefined)
    assert.strictEqual(buildDaffodilDataHighlight(11, 10)?.offset, 9)
  })

  test('data editor opens through OmegaEdit dependency when installed', async function () {
    if (!vscode.extensions.getExtension(OMEGA_EDIT_EXTENSION_ID)) {
      this.skip()
    }

    const editorState = await vscode.commands.executeCommand(
      DATA_EDITOR_COMMAND,
      TEST_SCHEMA
    )
    assert.ok(editorState)
  })
})
