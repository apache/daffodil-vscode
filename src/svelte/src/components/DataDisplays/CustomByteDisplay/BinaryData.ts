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

import { SimpleWritable } from '../../../stores/localStore'
import {
  type BytesPerRow,
  type RadixValues,
} from '../../../stores/configuration'
import {
  radixBytePad,
  viewport_offset_to_line_num,
} from '../../../utilities/display'
import { dataDislayLineAmount } from '../../../stores'
import { get } from 'svelte/store'

export const BYTE_ACTION_DIV_OFFSET: number = 24

export type EditAction =
  | 'insert-before'
  | 'insert-after'
  | 'insert-replace'
  | 'delete'
  | 'byte-input'

export type ByteValue = {
  offset: number
  text: string | undefined
  value: number
}

export const null_byte = () => {
  return {
    offset: -1,
    text: '',
    value: -1,
  } as ByteValue
}

export interface EditEvent {
  action: EditAction
}

export interface EditByteEvent extends EditEvent {
  targetByte: ByteValue
}

export const byte_value_string = (value: number, radix: RadixValues) => {
  if (value > 255)
    throw `Value {${value}} is larger than an unsigned int (255).`
  let str = value.toString(radix)
  let validLen = radixBytePad(radix)
  return str.length < validLen ? str.padStart(validLen, '0') : str
}

export type ViewportDataType = 'physical' | 'logical'

export type ByteSelectionEvent = {
  targetElement: HTMLDivElement
  targetByte: ByteValue
  fromViewport: ViewportDataType
}

export const RADIX_REGEX_MATCH_STR = {
  16: /[0-9a-fA-F]{2}/g,
  10: /[0-9]{3}/g,
  8: /[0-8]{3}/g,
  2: /[0-1]{8}/g,
}

export class ViewportData_t {
  data = new Uint8Array(0)
  fileOffset = -1
  length = -1
  bytesLeft = -1
  capacity = this.data.length
}

export class ViewportDataStore_t extends SimpleWritable<ViewportData_t> {
  private _offsetMax: number = -1

  protected init(): ViewportData_t {
    return new ViewportData_t()
  }

  public get offsetMax(): number {
    return this._offsetMax
  }

  public set(value: ViewportData_t): void {
    this.store.set(value)
    this._offsetMax = value.fileOffset + value.bytesLeft + value.length
  }

  public lowerFetchBoundary(): number {
    return this.storeData().fileOffset
  }

  public upperFetchBoundary(bytesPerRow: BytesPerRow): number {
    const store = this.storeData()
    const boundary =
      store.fileOffset + store.length - get(dataDislayLineAmount) * bytesPerRow

    return boundary
  }

  public lineTopMax(bytesPerRow: BytesPerRow): number {
    const vpMaxOffset = Math.max(
      0,
      this.storeData().length - get(dataDislayLineAmount) * bytesPerRow
    )
    const vpLineTopMax = viewport_offset_to_line_num(
      vpMaxOffset + this.storeData().fileOffset,
      this.storeData().fileOffset,
      bytesPerRow
    )

    return vpLineTopMax + 1
  }

  public physical_byte_values(
    radix: RadixValues,
    bytesPerRow: 16 | 8
  ): ByteValue[] {
    const byteValues =
      this.physical_display(radix, bytesPerRow).match(
        RADIX_REGEX_MATCH_STR[radix]
      ) || []

    return byteValues.map((byteStr, index) => {
      return {
        text: byteStr,
        offset: index,
        value: parseInt(byteStr, radix),
      }
    })
  }

  public subarray(from: number, to: number): Uint8Array {
    return this.storeData().data.subarray(from, to)
  }

  public slice(from: number, to: number): Uint8Array {
    return this.storeData().data.slice(from, to)
  }

  private physical_display(radix: RadixValues, bytesPerRow: 16 | 8): string {
    let result = ''
    let arr = this.storeData().data
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytesPerRow; ++col) {
          result += arr[i++].toString(radix).padStart(pad, '0') + ' '
        }
        result = result.slice(0, result.length - 1)
        if (i === arr.byteLength) {
          break
        }
        result += '\n'
      }
    }
    return result
  }
}

export function latin1Undefined(charCode: number): boolean {
  return charCode < 32 || (charCode > 126 && charCode < 160)
}
