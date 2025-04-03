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
import {
  DaffodilDataLeftOver,
  DaffodilParseError,
  dataLeftOverEvent,
  extractDaffodilData,
  extractDaffodilEvent,
  parseErrorEvent,
} from '../daffodilDebugger/daffodil'

export const activate = () =>
  vscode.debug.onDidReceiveDebugSessionCustomEvent(async (e) => {
    const debugEvent = extractDaffodilEvent(e)
    if (debugEvent === undefined) return
    const debugEventObject = debugEvent.asObject()

    let message = ''

    switch (debugEventObject.command) {
      case dataLeftOverEvent:
        const dataLeftOver = extractDaffodilData(
          debugEventObject
        ) as DaffodilDataLeftOver
        message = dataLeftOver.message
        break
      case parseErrorEvent:
        const parseError = extractDaffodilData(
          debugEventObject
        ) as DaffodilParseError
        message = parseError.message
        break
    }

    if (message !== '') {
      // Make the message have two line breaks between each line to make the message look better.
      message = message.replaceAll('\n', '\n\n')
      vscode.window.showErrorMessage(message, { modal: true })
    }
  })
