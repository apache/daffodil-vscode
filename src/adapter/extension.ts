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

'use strict'

import * as vscode from 'vscode'
import * as position from '../position'
import { ProviderResult } from 'vscode'
import { DaffodilDebugSession } from './daffodilDebug'
import {
  activateDaffodilDebug,
  workspaceFileAccessor,
} from './activateDaffodilDebug'

/*
 * The compile time flag 'runMode' controls how the debug adapter is run.
 * Please note: the test suite only supports 'external' mode.
 */

export async function activate(context: vscode.ExtensionContext) {
  // activate position
  position.activate(context)

  // debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
  // however we currently only support our inline debugger
  activateDaffodilDebug(context)
}

export function deactivate() {
  // deactivate position
  position.deactivate()
}

export class InlineDebugAdapterFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  createDebugAdapterDescriptor(
    _session: vscode.DebugSession
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    return new vscode.DebugAdapterInlineImplementation(
      new DaffodilDebugSession(workspaceFileAccessor)
    )
  }
}
