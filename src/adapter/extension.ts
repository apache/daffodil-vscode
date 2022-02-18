/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict'

import * as Net from 'net'
import * as vscode from 'vscode'
import * as htmlView from '../hexView'
import * as position from '../position'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'
import { platform } from 'process'
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
const runMode: 'external' | 'server' | 'namedPipeServer' | 'inline' = 'inline'

export async function activate(context: vscode.ExtensionContext) {
  // activate position
  position.activate(context)

  // debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
  switch (runMode) {
    case 'server':
      // run the debug adapter as a server inside the extension and communicate via a socket
      activateDaffodilDebug(
        context,
        new DaffodilDebugAdapterServerDescriptorFactory(context)
      )
      break

    case 'namedPipeServer':
      // run the debug adapter as a server inside the extension and communicate via a named pipe (Windows) or UNIX domain socket (non-Windows)
      activateDaffodilDebug(
        context,
        new DaffodilDebugAdapterNamedPipeServerDescriptorFactory(context)
      )
      break

    case 'inline':
      // run the debug adapter inside the extension and directly talk to it
      activateDaffodilDebug(context)
      break

    case 'external':
    default:
      // run the debug adapter as a separate process
      activateDaffodilDebug(context, new DebugAdapterExecutableFactory(context))
      break
  }
}

export function deactivate() {
  // deactivate position
  position.deactivate()
}

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  context: vscode.ExtensionContext
  htmlViewer: htmlView.DebuggerHexView

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.htmlViewer = new htmlView.DebuggerHexView(context)
  }

  // The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
  // Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

  createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    // param "executable" contains the executable optionally specified in the package.json (if any)

    // use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
    if (!executable) {
      const command = 'absolute path to my DA executable'
      const args = ['some args', 'another arg']
      const options = {
        cwd: 'working directory for executable',
        env: { envVariable: 'some value' },
      }
      executable = new vscode.DebugAdapterExecutable(command, args, options)
    }

    // make VS Code launch the DA executable
    return executable
  }
}

class DaffodilDebugAdapterServerDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private server?: Net.Server
  context: vscode.ExtensionContext
  htmlViewer: htmlView.DebuggerHexView

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.htmlViewer = new htmlView.DebuggerHexView(context)
  }

  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    if (!this.server) {
      // start listening on a random port
      this.server = Net.createServer((socket) => {
        const session = new DaffodilDebugSession(workspaceFileAccessor)
        session.setRunAsServer(true)
        session.start(socket as NodeJS.ReadableStream, socket)
      }).listen(0)
    }

    // make VS Code connect to debug server
    return new vscode.DebugAdapterServer(
      (this.server.address() as Net.AddressInfo).port
    )
  }

  dispose() {
    if (this.server) {
      this.server.close()
    }
  }
}

class DaffodilDebugAdapterNamedPipeServerDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private server?: Net.Server
  context: vscode.ExtensionContext
  htmlViewer: htmlView.DebuggerHexView

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.htmlViewer = new htmlView.DebuggerHexView(context)
  }

  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    if (!this.server) {
      // start listening on a random named pipe path
      const pipeName = randomBytes(10).toString('utf8')
      const pipePath =
        platform === 'win32'
          ? join('\\\\.\\pipe\\', pipeName)
          : join(tmpdir(), pipeName)

      this.server = Net.createServer((socket) => {
        const session = new DaffodilDebugSession(workspaceFileAccessor)
        session.setRunAsServer(true)
        session.start(<NodeJS.ReadableStream>socket, socket)
      }).listen(pipePath)
    }

    // make VS Code connect to debug server
    // TODO: enable named pipe support as soon as VS Code 1.49 is out
    //return new vscode.DebugAdapterNamedPipeServer(this.server.address() as string);
    return undefined
  }

  dispose() {
    if (this.server) {
      this.server.close()
    }
  }
}
