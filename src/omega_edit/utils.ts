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
import * as hexy from 'hexy'
import {
  EventSubscriptionRequest,
  // ObjectId,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'
import * as fs from 'fs'
import { getClient, ALL_EVENTS } from 'omega-edit/settings'
import * as omegaEditServer from 'omega-edit/server'
import { runScript } from '../utils'
import { EditorMessage } from './messageHandler'

const client = getClient()

export function randomId() {
  return Math.floor(Math.random() * (1000 - 0 + 1))
}

export async function getFilePath(
  sessionFile: string,
  overwrite: boolean,
  newFile: boolean
): Promise<string | undefined> {
  // Get file path for saved file
  let filePath: string | undefined

  if (overwrite) {
    filePath = sessionFile
  } else if (newFile) {
    let fileName = sessionFile.split('/')[sessionFile.split('/').length - 1]
    let path = sessionFile.replace(`/${fileName}`, '')
    let fileNameStart = fileName
      .split('.')
      .slice(0, fileName.split('.').length - 1)
      .join('')
    let fileNameEnd = fileName.split('.')[fileName.split('.').length - 1]
    filePath = `${path}/${fileNameStart}-${randomId().toString()}.${fileNameEnd}`
  } else {
    filePath = await vscode.window.showInputBox({
      placeHolder: 'Save session as:',
    })
  }

  return filePath
}

export async function setViewportDataForPanel(
  panel: vscode.WebviewPanel,
  vp: string,
  commandViewport: string,
  commandHex: string | null
) {
  client.getViewportData(
    new ViewportDataRequest().setViewportId(vp),
    (err, r) => {
      let data = r?.getData_asB64()
      if (data) {
        let bufferData = Buffer.from(data, 'base64')

        panel.webview.postMessage({
          command: commandViewport,
          viewportData: Uint8Array.from(bufferData),
          displayData: bufferData.toString('hex'),
        })

        if (commandHex === 'hexAll') {
          let hex = hexy.hexy(bufferData)
          let offsetLines = ''
          let encodedData = ''

          let hexLines = hex.split('\n')

          // Format hex code to make the file look nicer
          hexLines.forEach((h) => {
            if (h) {
              let splitHex = h.split(':')
              let dataLocations = splitHex[1].split(' ')

              offsetLines += splitHex[0] + '<br/>'
              if (dataLocations.length > 9) {
                for (let i = 1; i < 9; i++) {
                  let middle = Math.floor(dataLocations[i].length / 2)
                  encodedData +=
                    dataLocations[i].substring(0, middle).toUpperCase() +
                    '' +
                    dataLocations[i].substring(middle).toUpperCase() +
                    ' '
                }
              }

              encodedData += '<br/>'
            }
          })

          panel.webview.postMessage({
            command: commandHex,
            text: encodedData,
            offsetText: offsetLines,
          })
        } else if (commandHex) {
          let hxt = hexy.hexy(bufferData)
          panel.webview.postMessage({ command: commandHex, text: hxt })
        }
      }
    }
  )
}

export async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  vp1: string,
  vp2: string,
  commandViewport: string,
  commandHex: string | null
) {
  let request = new EventSubscriptionRequest()
    .setId(vp1)
    .setInterest(ALL_EVENTS)

  client.subscribeToViewportEvents(request).on('data', async (ve) => {
    await setViewportDataForPanel(panel, vp2, commandViewport, commandHex)
  })

  // data request not ran right away, so this ensures the views are populated
  await setViewportDataForPanel(panel, vp2, commandViewport, commandHex)
}

export async function startOmegaEditServer(
  ctx: vscode.ExtensionContext,
  rootPath: string,
  omegaEditPackageVersion: string
): Promise<[vscode.Terminal, boolean]> {
  const [scriptName, scriptPath] = await omegaEditServer.setupServer(
    rootPath,
    omegaEditPackageVersion,
    ctx.asAbsolutePath('./node_modules/omega-edit')
  )

  let terminal = await runScript(scriptPath, scriptName)
  return [terminal, true]
}

export class DisplayState {
  public bytesPerRow: number
  public editorEncoding: BufferEncoding
  constructor() {
    this.bytesPerRow = 16
    this.editorEncoding = 'hex'
  }
}

export function fileExtensionType(filename: string): string {
  return filename.substring(filename.lastIndexOf('.'))
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

type Mimes = {
  [key: string]: number[]
}

const mimeTypes = {
  PNG: [0x89, 0x50, 0x4e, 0x47],
  JPEG: [0xff, 0xd8, 0xff, 0xe0],
  PDF: [0x25, 0x50, 0x44, 0x46],
  HTML: [0x3c, 0x21, 0x44, 0x4f, 0x43],
  MP3: [0x49, 0x44, 0x33],
  MP4: [0x00, 0x00, 0x00, 0x18],
  ZIP: [0x50, 0x4b, 0x03, 0x04],
  CSV: [0xef, 0xbb, 0xbf],
  DOCX: [0x50, 0x4b, 0x03, 0x04],
  XLSX: [0x50, 0x4b, 0x03, 0x04],
} as Mimes

export async function checkMimeType(filename: string): Promise<string> {
  let bytes: Buffer
  const file = fs.openSync(filename, 'r')
  bytes = Buffer.alloc(5)
  fs.readSync(file, bytes, 0, 5, null)
  fs.close(file)

  for (const key in mimeTypes) {
    if (mimeTypes[key].toString() === bytes.toString()) {
      return key
    }
  }
  return filename.lastIndexOf('.') > 0
    ? filename.substring(filename.lastIndexOf('.'))
    : 'unknown/binary'
}

export function fillRequestData(message: EditorMessage): [Buffer, string] {
  let selectionByteData = encodedStrToData(
    message.data.editor.editedContent,
    message.data.encoding
  )
  let selectionByteDisplay = dataToEncodedStr(
    selectionByteData,
    message.data.encoding
  )
  return [selectionByteData, selectionByteDisplay]
}
export function encodedStrToData(
  selectionEdits: string,
  selectionEncoding: BufferEncoding
): Buffer {
  let selectionByteLength: number
  let selectionByteData: Buffer

  if (selectionEncoding === 'hex') {
    selectionByteLength = selectionEdits.length / 2
    selectionByteData = Buffer.alloc(selectionByteLength)
    for (let i = 0; i < selectionEdits.length; i += 2) {
      selectionByteData[i / 2] = parseInt(selectionEdits.substr(i, 2), 16)
    }
  } else if (selectionEncoding === 'binary') {
    selectionByteLength = selectionEdits.length / 8
    selectionByteData = Buffer.alloc(selectionByteLength)
    for (let i = 0; i < selectionEdits.length; i += 8) {
      selectionByteData[i / 8] = parseInt(selectionEdits.substr(i, 8), 2)
    }
  } else {
    selectionByteLength = selectionEdits.length
    selectionByteData = Buffer.from(selectionEdits, selectionEncoding)
  }
  return selectionByteData
}

export function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding
): string {
  let ret = ''
  if (encoding === 'binary') {
    for (let i = 0; i < buffer.byteLength; i++) {
      ret += buffer[i].toString(2).padStart(8, '0')
    }
  } else {
    ret = buffer.toString(encoding)
  }
  return ret
}
