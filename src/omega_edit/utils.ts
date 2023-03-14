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
  EventSubscriptionRequest,
  ViewportDataRequest,
  ViewportDataResponse,
} from 'omega-edit/omega_edit_pb'
import * as fs from 'fs'
import { ALL_EVENTS, getClient } from 'omega-edit/client'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import { EditorClient } from 'omega-edit/omega_edit_grpc_pb'
import { getLogger } from 'omega-edit/logger'

let client: EditorClient
export async function initOmegaEditClient(
  port: number,
  host: string = '127.0.0.1'
) {
  client = getClient(port, host)
}

export async function setViewportDataForPanel(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  client.getViewportData(
    new ViewportDataRequest().setViewportId(viewportId),
    async (err, r: ViewportDataResponse) => {
      const bufferData: Uint8Array = r.getData_asU8()
      panel.webview.postMessage({
        command: MessageCommand.viewportSubscribe,
        data: {
          viewportData: bufferData,
          displayData: Buffer.from(bufferData).toString('hex'),
        },
      })
    }
  )
}

export async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  // initial viewport population
  await setViewportDataForPanel(panel, viewportId)

  // subscribe to all viewport events
  client
    .subscribeToViewportEvents(
      new EventSubscriptionRequest().setId(viewportId).setInterest(ALL_EVENTS)
    )
    .on('data', async () => {
      getLogger().debug(`viewport event received: ${viewportId}`)
      await setViewportDataForPanel(panel, viewportId)
    })
}

export class DisplayState {
  public bytesPerRow: number
  public editorEncoding: BufferEncoding
  constructor() {
    this.bytesPerRow = 16
    this.editorEncoding = 'hex'
  }
}

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

export function logicalDisplay(
  bytes: ArrayBuffer,
  bytesPerRow: number
): string {
  const undefinedCharStandIn = '�'
  let result = ''
  if (bytes.byteLength > 0) {
    // TODO: How does this affect the simple editor?
    // replace newlines with spaces for the logical display
    const data = Buffer.from(bytes).toString('latin1').replace('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}

export function fillRequestData(message: EditorMessage): [Buffer, string] {
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  if (message.data.editMode === 'full') {
    selectionByteData = encodedStrToData(
      message.data.editedContent,
      message.data.encoding
    )
    selectionByteDisplay = dataToEncodedStr(
      selectionByteData,
      message.data.encoding
    )
  } else {
    selectionByteData =
      message.data.viewport === 'logical'
        ? encodedStrToData(message.data.editedContent, 'latin1')
        : radixStrToData(message.data.editedContent, message.data.radix)

    selectionByteDisplay =
      message.data.viewport === 'logical'
        ? message.data.editedContent
        : dataToRadixStr(selectionByteData, message.data.radix)
  }

  return [selectionByteData, selectionByteDisplay]
}
export function radixStrToData(
  selectionEdits: string,
  selectionRadix: number
): Buffer {
  return Buffer.from([parseInt(selectionEdits, selectionRadix)])
}

export function encodedStrToData(
  selectionEdits: string,
  selectionEncoding?: BufferEncoding
): Buffer {
  let selectionByteData: Buffer
  switch (selectionEncoding) {
    case 'hex':
      selectionByteData = Buffer.alloc(selectionEdits.length / 2)
      for (let i = 0; i < selectionEdits.length; i += 2) {
        selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
      }
      return selectionByteData
    case 'binary':
      selectionByteData = Buffer.alloc(selectionEdits.length / 8)
      for (let i = 0; i < selectionEdits.length; i += 8) {
        selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
      }
      return selectionByteData
    default:
      return Buffer.from(selectionEdits, selectionEncoding)
  }
}

export function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding
): string {
  return encoding === 'binary'
    ? dataToRadixStr(buffer, 2)
    : buffer.toString(encoding)
}

export function dataToRadixStr(buffer: Buffer, radix: number): string {
  const padLen = radixBytePad(radix)
  let ret = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    ret += buffer[i].toString(radix).padStart(padLen, '0')
  }
  return ret
}

export function radixBytePad(radix: number): number {
  switch (radix) {
    case 2:
      return 8
    case 8:
      return 3
    case 10:
      return 3
    case 16:
      return 2
  }
  return 0
}

export async function getOnDiskFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats.size)
      }
    })
  })
}
