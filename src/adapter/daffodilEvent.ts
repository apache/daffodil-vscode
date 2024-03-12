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

import * as vscode from 'vscode'
import * as fs from 'fs'

import * as daf from '../daffodilDebugger'
import { ensureFile, tmpFile } from '../utils'
import { outputChannel } from './activateDaffodilDebug'

export function handleDebugEvent(e: vscode.DebugSessionCustomEvent) {
  switch (e.event) {
    case daf.infosetEvent:
      let update: daf.InfosetEvent = e.body
      let path = ensureFile(tmpFile(e.session.id))
      fs.copyFileSync(path, `${path}.prev`)
      fs.writeFileSync(path, update.content)
      break
    // this allows for any error event to be caught in this case
    case e.event.startsWith('daffodil.error') ? e.event : '':
      vscode.window.showErrorMessage(
        `An error was received from the Daffodil debugger. ([show logs](command:extension.dfdl-debug.showLogs "show logs"))`
      )
      outputChannel.appendLine(e.body.message)
      break
  }
}
