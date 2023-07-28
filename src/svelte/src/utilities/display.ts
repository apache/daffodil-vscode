// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { writable } from 'svelte/store'
import {
  EditByteModes,
  type BytesPerRow,
  type RadixValues,
} from '../stores/configuration'

export type ViewportReferences = {
  physical: HTMLTextAreaElement
  address: HTMLTextAreaElement
  logical: HTMLTextAreaElement
}

export type Viewport = 'physical' | 'address' | 'logical'

export type ValidationResponse = {
  valid: boolean
  errMsg: string
}

export type ByteDivWidth = '20px' | '24px' | '64px'

type ByteDivWidths = { [key in RadixValues]: ByteDivWidth }

const ByteDivWidths = {
  16: '20px' as ByteDivWidth,
  10: '24px' as ByteDivWidth,
  8: '24px' as ByteDivWidth,
  2: '64px' as ByteDivWidth,
}

export type BinaryBytePrefix = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB'
export type BinaryBitPrefix = 'b' | 'Kb' | 'Mb' | 'Gb' | 'Tb' | 'Pb'
type ValidByteOctetCount = 1 | 2 | 3 | 4

export const DISPLAYED_DATA_LINES = 20

export const tooltipsEnabled = writable(false)
export const sizeHumanReadable = writable(false)

export function viewport_references(
  viewport?: Viewport
): ViewportReferences | HTMLTextAreaElement {
  return viewport
    ? (document.getElementById(viewport) as HTMLTextAreaElement)
    : {
        physical: document.getElementById('physical') as HTMLTextAreaElement,
        address: document.getElementById('address') as HTMLTextAreaElement,
        logical: document.getElementById('logical') as HTMLTextAreaElement,
      }
}

export function edit_byte_window_ref(): HTMLDivElement {
  return document.getElementById('editByteWindow') as HTMLDivElement
}

export function radixBytePad(radix: RadixValues): number {
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

export function radixToString(radix: RadixValues): string {
  switch (radix) {
    case 2:
      return 'binary'
    case 8:
      return 'octal'
    case 10:
      return 'decimal'
    case 16:
      return 'hex'
  }
  return 'binary'
}

export function byteDivWidthFromRadix(radix: RadixValues): ByteDivWidth {
  return ByteDivWidths[radix]
}

export function regexEditDataTest(
  text: string,
  dataType: string | number
): boolean {
  const binary_regex = /^[0-1]*$/
  const decimal_regex = /^[0-9]*$/
  const octal_regex = /^[0-7]*$/
  const hex_regex = /^[0-9a-fA-F]*$/

  switch (dataType) {
    case 'binary':
    case 2:
      return binary_regex.test(text)
    case 8:
      return octal_regex.test(text)
    case 10:
      return decimal_regex.test(text)
    case 'hex':
    case 16:
      return hex_regex.test(text)
    default:
      return isEncodedTextEditable(text, dataType as string)
  }
}

export function validateEncodingStr(
  text: string,
  encoding: string | number,
  editMode?: string
): ValidationResponse {
  const validRegex = regexEditDataTest(text, encoding)
  if (!validRegex) return { valid: false, errMsg: `Invalid input` }
  const validLen = validateStrByteLen(text, encoding, editMode)
  if (!validLen) return { valid: false, errMsg: `Invalid edit length` }
  return { valid: true, errMsg: '' }
}

function validateStrByteLen(
  text: string,
  dataType: string | number,
  editMode?: string
): boolean {
  switch (dataType) {
    case 'binary':
    case 2:
      return editMode === EditByteModes.Single
        ? text.length === radixBytePad(2)
        : text.length % radixBytePad(2) == 0
    case 8:
      return editMode === EditByteModes.Single
        ? text.length === radixBytePad(8)
        : text.length % radixBytePad(8) == 0
    case 10:
      return editMode === EditByteModes.Single
        ? text.length === radixBytePad(10)
        : text.length % radixBytePad(10) == 0
    case 'hex':
    case 16:
      return editMode === EditByteModes.Single
        ? text.length === radixBytePad(16)
        : text.length % radixBytePad(16) == 0
    default:
      return editMode === EditByteModes.Single ? text.length === 1 : true
  }
}

function isEncodedTextEditable(text: string, encoding: string): boolean {
  switch (encoding) {
    case 'latin1':
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) > 255) {
          return false
        }
      }
      break
    case 'ascii':
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) > 127) {
          return false
        }
      }
      break
    case 'utf8':
    case 'utf16le':
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) > 65535) {
          return false
        }
      }
      break
  }
  return true
}

export function byte_count_divisible_offset(
  offset: number,
  bytesPerRow: BytesPerRow,
  addLineNum: number = 0
): number {
  return (
    Math.floor(offset / bytesPerRow) * bytesPerRow + bytesPerRow * addLineNum
  )
}

export function viewport_offset_to_line_num(
  offset: number,
  vpStartOffset: number,
  bytesPerRow: BytesPerRow
): number {
  return Math.floor((offset - vpStartOffset) / bytesPerRow)
}

export enum BinaryBytePrefixes {
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
}

export function humanReadableByteLength(byteLength: number): string {
  let ret = byteLength.toLocaleString('en')
  let byteStrLen = ret.length
  if (byteStrLen <= 3) ret += BinaryBytePrefixes[0]
  else {
    const octets = ret.split(',')

    ret =
      octets[0] +
      '.' +
      octets[1].substring(0, 1) +
      BinaryBytePrefixes[octets.length - 1]
  }

  return ret
}
