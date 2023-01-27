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

export const radixOpt = [
    { name: 'HEX', value: 16 },
    { name: 'DEC', value: 10 },
    { name: 'OCT', value: 8 },
    { name: 'BIN', value: 2 },
]

export const encoding_groups = [
    { group: 'Binary' , encodings: [
            { name: 'Hexidecimal', value: 'hex'},
            { name: 'Binary', value: 'binary'},
            { name: 'Base64', value: 'base64'},
        ]
    },
    { group: 'Single-byte' , encodings: [
            { name: 'ASCII (7-bit)', value: 'ascii'},
            { name: 'ISO-8859-1 (8-bit)', value: 'latin1'},
        ]
    },
    { group: 'Multi-byte' , encodings: [
            { name: 'USC-2', value: 'usc2'},
            { name: 'UTF-8', value: 'utf-8'},
            { name: 'UTF-16', value: 'utf-16'},
        ]
    },
]

export const endiannessOpt = [
    { name: 'Little', value: 'le'},
    { name: 'Big', value: 'be'},
]

export const lsbOpt = [
    { name: 'Higher Offset', value: 'h'},
    { name: 'Lower Offset', value: 'l'}
]

export const byteSizeOpt = [
    { value: 8 },
    { value: 7 },
    { value: 6 },
]

export const addressOpt = [
    { name: 'Hexidecimal', value: 16 },
    { name: 'Decimal', value: 10 },
    { name: 'Octal', value: 8 },
]

const offsetDisplays = {
    16: { text: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>0 1 2 3 4 5 6 7 8 9 A B C D E F  ', spread: 2 },
    10: { text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5  ', spread: 3 },
    8: { text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7  ', spread: 3 },
    2: { text: '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666  <br/>01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123  ',
          spread: 1 }
}

function radixBytePad(radix: number): number {
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

export function countAscii(buf: Uint8Array): number {
  return buf.reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
}

export function getOffsetDisplay(radix, view: string) {
    let spread = offsetDisplays[radix].spread
    if( view === 'logical' ) {
        if( radix === 2 )
            return '0 0 0 0 0 0 0 0 <br>0 1 2 3 4 5 6 7'
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
