/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
