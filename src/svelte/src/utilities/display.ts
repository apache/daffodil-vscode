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

const binary_regex = /^[0-1]*$/
const decimal_regex = /^[0-9]*$/
const octal_regex = /^[0-7]*$/
const hex_regex = /^[0-9a-fA-F]*$/
// const base64_regex =
//   /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

export type ValidationResponse = {
  valid: boolean
  errMsg: string
}

export const radixOpt = [
  { name: 'Hexadecimal', value: 16 },
  { name: 'Decimal', value: 10 },
  { name: 'Octal', value: 8 },
  { name: 'Binary', value: 2 },
]

export const encoding_groups = [
  {
    group: 'Binary',
    encodings: [
      { name: 'Hexidecimal', value: 'hex' },
      { name: 'Binary', value: 'binary' },
    ],
  },
  {
    group: 'Single-byte',
    encodings: [
      { name: 'ASCII (7-bit)', value: 'ascii' },
      { name: 'Latin-1 (8-bit)', value: 'latin1' },
    ],
  },
  {
    group: 'Multi-byte',
    encodings: [
      { name: 'UTF-8', value: 'utf-8' },
      { name: 'UTF-16LE', value: 'utf-16le' },
    ],
  },
]

export const endiannessOpt = [
  { name: 'Big', value: 'be' },
  { name: 'Little', value: 'le' },
]

export const lsbOpt = [
  { name: 'Higher Offset', value: 'h' },
  { name: 'Lower Offset', value: 'l' },
]

export const byteSizeOpt = [{ value: 8 }, { value: 7 }, { value: 6 }]

export const addressOpt = [
  { name: 'Hexidecimal', value: 16 },
  { name: 'Decimal', value: 10 },
  { name: 'Octal', value: 8 },
]

export const dvHighlightTag = { start: '<mark>', end: '</mark>' }

const offsetDisplays = {
  16: {
    text: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>0 1 2 3 4 5 6 7 8 9 A B C D E F  ',
    spread: 2,
  },
  10: {
    text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5  ',
    spread: 3,
  },
  8: {
    text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7  ',
    spread: 3,
  },
  2: {
    text: '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666  <br/>01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123  ',
    spread: 1,
  },
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
export function isEncodedTextEditable(text: string, encoding: string): boolean {
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

export function regexEditDataTest(
  text: string,
  dataType: string | number
): boolean {
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

export function validStrByteLen(
  text: string,
  dataType: string | number,
  editMode?: string
): boolean {
  switch (dataType) {
    case 'binary':
    case 2:
      return editMode === 'simple'
        ? text.length === radixBytePad(2)
        : text.length % radixBytePad(2) == 0
    case 8:
      return editMode === 'simple'
        ? text.length === radixBytePad(8)
        : text.length % radixBytePad(8) == 0
    case 10:
      return editMode === 'simple'
        ? text.length === radixBytePad(10)
        : text.length % radixBytePad(10) == 0
    case 'hex':
    case 16:
      return editMode === 'simple'
        ? text.length === radixBytePad(16)
        : text.length % radixBytePad(16) == 0
    default:
      return editMode === 'simple' ? text.length === 1 : true
  }
}

export function validEncodingStr(
  text: string,
  encoding: string | number,
  editMode?: string
): ValidationResponse {
  const validRegex = regexEditDataTest(text, encoding)
  if (!validRegex) return { valid: false, errMsg: `Invalid input` }
  const validLen = validStrByteLen(text, encoding, editMode)
  if (!validLen) return { valid: false, errMsg: `Invalid edit length` }
  return { valid: true, errMsg: '' }
}

export function validRequestableData(
  data: string,
  viewport: string,
  encoding: string,
  editMode: string,
  radix: number
): ValidationResponse {
  switch (editMode) {
    case 'simple':
      if (data.length === 0) return { valid: false, errMsg: '' }
      return viewport === 'physical'
        ? validEncodingStr(data, radix, editMode)
        : validEncodingStr(data, 'latin1', editMode)
    case 'full':
      return validEncodingStr(data, encoding)
  }
}

export function setSelectionOffsetInfo(
  from: string,
  start: number,
  end: number,
  size: number,
  cursorPos?: number
): string {
  return `${from} [${start} - ${end}] Size: ${size} `
}

export function isWhitespace(c: string | undefined): boolean {
  return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
}

export function syncScroll(from: HTMLElement, to: HTMLElement) {
  // Scroll the "to" by the same percentage as the "from"
  if (from && to) {
    const sf = from.scrollHeight - from.clientHeight
    if (sf >= 1) {
      const st = to.scrollHeight - to.clientHeight
      to.scrollTop = (st / 100) * ((from.scrollTop / sf) * 100)
    }
  }
}

export function getOffsetDisplay(radix, view: string) {
  let spread = offsetDisplays[radix].spread
  if (view === 'logical') {
    if (radix === 2)
      return '0 0 0 0 0 0 0 0 <br>0 1 2 3 4 5 6 7  '.replaceAll(
        ' ',
        '&nbsp;'.repeat(spread)
      )
    spread = 1
  }
  return offsetDisplays[radix].text.replaceAll(' ', '&nbsp;'.repeat(spread))
}

export function encodeForDisplay(
  arr: Uint8Array,
  radix: number,
  bytes_per_row: number
): string {
  let result = ''
  if (arr.byteLength > 0) {
    const pad = radixBytePad(radix)
    let i = 0
    while (true) {
      for (let col = 0; i < arr.byteLength && col < bytes_per_row; ++col) {
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

export function makeAddressRange(
  start: number,
  end: number,
  stride: number,
  radix: number
): string {
  let i = start
  let result = (i * stride).toString(radix)
  for (++i; i < end; ++i) {
    result += '\n' + (i * stride).toString(radix)
  }

  return result
}

export function radixToString(radix: number): string {
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
