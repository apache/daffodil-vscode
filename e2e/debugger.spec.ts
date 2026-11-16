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
import { expect, test } from './fixtures'

// Debugs a schema through the UI, the way a person would. This test doesn't ask
// for dataEditor, so it only sets up the fixtures that start VS Code.

test('pauses on entry when debugging a schema', async ({
  workbench,
  workspaceDir,
}) => {
  // The "Debug File" command debugs the open file, so open the schema first
  await workbench.openFile('test.dfdl.xsd')
  await workbench.runCommand('Daffodil Debug: Debug File')

  // The command asks for the data file to parse with the schema
  await workbench.pickFile(path.join(workspaceDir, 'test.txt'))

  // The extension now does several things, which this waits for:
  //  1. Compiles the schema with the Daffodil CLI
  //     (validateSchemaWithDaffodilCLI in src/daffodilDebugger/utils.ts)
  //  2. Starts the debugger (runDebugger in the same file)
  //  3. Connects to the debugger, and pauses on entry
  // The Continue button appears once it has paused. All of this is slow, so it
  // gets a longer timeout than the usual 30 seconds.
  await expect(workbench.debugContinueButton()).toBeVisible({
    timeout: 120_000,
  })

  // End the session before the fixtures close VS Code
  await workbench.stopDebugging()
})
