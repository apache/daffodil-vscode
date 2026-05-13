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

import type { ServerHeartbeat } from 'dataEditor/include/server/heartbeat/HeartBeatInfo'
import type { ColorThemeKind } from 'vscode'
import { EditByteModes } from './formattypes'
/**
 * Level of notification type sent to the VSCode extension.
 */
export type NotificationMessageLevel = 'Information' | 'Warning' | 'Error'

/**
 * Request type for sending a notification to be displayed by VSCode.
 */
export type NotificationRequest = {
  level: NotificationMessageLevel
  message: string
}

export type EditedDataRequest = {
  selectionToFileOffset: number
  editedContent: string
  viewport: 'physical' | 'logical'
  selectionSize: number
  encodingStr: string
  radix: number
  editMode: EditByteModes
}

export type EditedDataResponse = {
  data: Uint8Array
  dataDisplay: string
}

export type ApplyChangesData = {
  offset: number
  original_segment: Uint8Array
  edited_segment: Uint8Array
}

export type ApplyChangesRequest = ApplyChangesData

export type SaveRequest = {
  targetFile: string
}

export type ScrollViewportRequest = {
  startOffset: number
  bytesPerRow: number
  numLinesDisplayed?: number
}

export type ViewportRefreshResponse = {
  viewportId: string
  fileOffset: number
  length: number
  bytesLeft: number
  data: Uint8Array
  capacity: number
}

export type ReplaceRequest = {
  encoding: BufferEncoding | string
  searchStr: string | Uint8Array
  replaceStr: string | Uint8Array
  is_case_insensitive?: boolean
  is_reverse?: boolean
  offset?: number
  length?: number
  limit?: number
  overwriteOnly?: boolean
}

export type ReplaceResponse = {
  replacementsCount: 0 | 1
  nextOffset: number
  searchDataBytesLength: number
  replaceDataBytesLength: number
}

export type EditorOnChangeRequest = {
  editMode: EditByteModes
  encoding: BufferEncoding | string
  selectionData: Uint8Array
}

export type EditorOnChangeResponse = {
  encodedStr: string
}

export type UndoRequest = {
  sessionId: string
}

export type RedoRequest = UndoRequest

export type ProfileRequest = {
  startOffset: number
  length: number
}

export type ProfileResponse = {
  startOffset: number
  length: number
  byteProfile: number[]
  numAscii: number
  language: string
  contentType: string
  characterCount: {
    byteOrderMark: string
    byteOrderMarkBytes: number
    singleByteCount: number
    doubleByteCount: number
    tripleByteCount: number
    quadByteCount: number
    invalidBytes: number
  }
}

export type SaveSegmentRequest = {
  offset: number
  length: number
}

export type SearchRequest = {
  encoding: BufferEncoding | string
  searchStr: string
  is_case_insensitive?: boolean
  is_reverse?: boolean
  offset?: number
  length?: number
  limit?: number
}

export type SearchResponse = {
  results: number[]
  byteLength: number
  overflow: boolean
}

export type ChangesInfoResponse = {
  fileName: string
  computedFileSize: number
  changeCount: number
  undoCount: number
}

export type FileInfoResponse = {
  filename: string
  bom: string
  language: string
  contentType: string
}

export type CountResponse = {
  applied: number
  undos: number
  computedFileSize: number
}

export type SaveResponse = Pick<CountResponse, 'computedFileSize'>

export type SaveAsResponse = SaveResponse & {
  newFilePath: string
}

export type DFDLDataBytePos = {
  bytePos1b: number
}

export type HeartbeatResponse = ServerHeartbeat & { port: number }

export type SetUIThemeResponse = ColorThemeKind
