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

import { writable } from 'svelte/store'

export type Radixes = 'Hexadecimal' | 'Decimal' | 'Octal' | 'Binary'

export type RadixValues = 16 | 10 | 8 | 2

export type BytesPerRow = 16 | 8

export enum EditByteModes {
  Single = 'single',
  Multiple = 'multiple',
}

export const RADIX_OPTIONS: Record<Radixes, RadixValues> = {
  Hexadecimal: 16,
  Decimal: 10,
  Octal: 8,
  Binary: 2,
}

export const ENCODING_GROUPS = [
  {
    group: 'Binary',
    encodings: [
      { name: 'Hexadecimal', value: 'hex' },
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

export type AvailableStrEncodings =
  | 'hex'
  | 'binary'
  | 'ascii'
  | 'latin1'
  | 'utf-8'
  | 'utf-16'

export type StrEncodingByteWidths = { [k in AvailableStrEncodings]: number }
export const StrEncodingByteWidths: StrEncodingByteWidths = {
  hex: 1,
  binary: 1,
  ascii: 1,
  latin1: 1,
  'utf-8': 1 | 2 | 4,
  'utf-16': 2 | 4,
}

export enum EditActionRestrictions {
  None,
  OverwriteOnly,
}

export type EditAction = { name: string; value: EditActionRestrictions }
export const EDIT_ACTIONS: EditAction[] = [
  { name: 'Delete, Insert, and Overwrite', value: EditActionRestrictions.None },
  { name: 'Overwrite Only', value: EditActionRestrictions.OverwriteOnly },
]

export const ENDIANNESS_OPTIONS = [
  { name: 'Big', value: 'be' },
  { name: 'Little', value: 'le' },
]

export const BYTE_ORDER_OPTIONS = [
  { name: 'Higher Offset', value: 'h' },
  { name: 'Lower Offset', value: 'l' },
]

export const BYTE_SIZE_OPTIONS = [{ value: 8 }, { value: 7 }, { value: 6 }]

export const ADDRESS_RADIX_OPTIONS = [
  { name: 'Hexadecimal', value: 16 },
  { name: 'Decimal', value: 10 },
  { name: 'Octal', value: 8 },
]

export const UNPRINTABLE_CHAR_STAND_IN = String.fromCharCode(9617)

// Number of bytes to for the viewport to populate
export const VIEWPORT_CAPACITY_MAX = 16 * 64 // 1024, Ωedit maximum viewport size is 1048576 (1024 * 1024)

// Number of bytes to display in the viewport
export const NUM_LINES_DISPLAYED = 20

export const DATA_PROFILE_MAX_LENGTH = 10_000_000

export const editorActionsAllowed = writable(EditActionRestrictions.None)
