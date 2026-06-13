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
import { debug, window } from 'vscode'

export function isDFDLDebugSessionActive(file: string): boolean {
  if (debug.activeDebugSession === undefined) return false
  if (debug.activeDebugSession!.type !== 'dfdl') return false
  if (debug.activeDebugSession!.configuration.data !== file) return false
  return true
}

export function toEncoding(encoding: string): BufferEncoding {
  if (!Buffer.isEncoding(encoding)) {
    console.error(`Value (${encoding}) is not a valid BufferEncoding type`)
    return 'utf-8'
  }
  return encoding as BufferEncoding
}

export interface DataEditorFileProvider {
  getFile(formatOp?: (file: string) => string): Promise<string>
}

export const VSCodeDialogFileProvider: DataEditorFileProvider = {
  getFile(formatOp?: (file: string) => string) {
    return new Promise(async (res, rej) => {
      const fileUri = await window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select',
        canSelectFiles: true,
        canSelectFolders: false,
        title: 'Select Data File',
      })
      // If user cancels file prompt, display info message
      if (!fileUri || !fileUri[0]) {
        rej(`Data Editor file opening cancelled.`)
      }
      res(fileUri![0].fsPath)
    })
  },
}

export function toMessageBytes(data: Uint8Array): number[] {
  return Array.from(data)
}

export function fromMessageBytes(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data
  }
  if (Array.isArray(data)) {
    return Uint8Array.from(data)
  }
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return Uint8Array.from((data as { data: number[] }).data)
  }
  if (data && typeof data === 'object') {
    const values = Object.entries(data as Record<string, unknown>)
      .filter(
        (entry): entry is [string, number] =>
          /^\d+$/.test(entry[0]) && typeof entry[1] === 'number'
      )
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, value]) => value)
    if (values.length > 0) {
      return Uint8Array.from(values)
    }
  }
  return new Uint8Array(0)
}
