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
import {
  ApplyChangesRequest,
  ChangesInfoResponse,
  CountResponse,
  DFDLDataBytePos,
  EditedDataRequest,
  EditedDataResponse,
  EditorOnChangeRequest,
  EditorOnChangeResponse,
  FileInfoResponse,
  HeartbeatResponse,
  NotificationRequest,
  ProfileRequest,
  ProfileResponse,
  ReplaceRequest,
  ReplaceResponse,
  SaveAsResponse,
  SaveResponse,
  SaveSegmentRequest,
  ScrollViewportRequest,
  SearchRequest,
  SearchResponse,
  SetUIThemeResponse,
  ViewportRefreshResponse,
} from './messages'
import { EditorRequestIds, isEditorMessageId } from './messageIds'

type MessageCommands =
  | 'clearChanges'
  | 'applyChanges'
  | 'editorOnChange'
  | 'fileInfo'
  | 'heartbeat'
  | 'profile'
  | 'redoChange'
  | 'replaceResults'
  | 'requestEditedData'
  | 'save'
  | 'saveAs'
  | 'saveSegment'
  | 'scrollViewport'
  | 'search'
  | 'replace'
  | 'setUITheme'
  | 'showMessage'
  | 'undoChange'
  | 'viewportRefresh'

type CommandMap = {
  [K in MessageCommands]: any
}
export interface MessageRequestMap extends CommandMap {
  counts: never
  clearChanges: never
  applyChanges: ApplyChangesRequest
  editorOnChange: EditorOnChangeRequest
  fileInfo: never
  heartbeat: never
  profile: ProfileRequest
  redoChange: never
  replaceResults: never
  requestEditedData: EditedDataRequest
  save: never
  saveAs: never
  saveSegment: SaveSegmentRequest
  scrollViewport: ScrollViewportRequest
  search: SearchRequest
  replace: ReplaceRequest
  undoChange: never
  viewportRefresh: never
  showMessage: NotificationRequest
}

export interface MessageResponseMap extends CommandMap {
  clearChanges: never
  applyChanges: ChangesInfoResponse
  editorOnChange: EditorOnChangeResponse
  fileInfo: FileInfoResponse
  counts: CountResponse
  profile: ProfileResponse
  redoChange: never
  replaceResults: ReplaceResponse
  requestEditedData: EditedDataResponse
  save: SaveResponse
  saveAs: SaveAsResponse
  saveSegment: never
  scrollViewport: never
  search: SearchResponse
  replace: ReplaceResponse
  undoChange: never
  viewportRefresh: ViewportRefreshResponse
  showMessage: never
  setUITheme: SetUIThemeResponse
  heartbeat: HeartbeatResponse
  bytePos1b: DFDLDataBytePos
}

export type ExtensionMessageKeys =
  | 'showMessage'
  | 'setUITheme'
  | 'editorOnChange'

export type DataEditorMessageKeys = Exclude<
  MessageCommands,
  ExtensionMessageKeys
>
export type DataEditorMessageRequests = Pick<
  MessageRequestMap,
  DataEditorMessageKeys
>
export type DataEditorMessageResponses = Pick<
  MessageResponseMap,
  DataEditorMessageKeys
>
/**
 * Key indexable interface to templated type inference of available messages sent between
 * the components of the DFDL VSCode extension.
 */
export type ExtensionMessageRequests = Pick<
  MessageRequestMap,
  ExtensionMessageKeys
>

export interface DFDLSessionMessageResponses extends MessageResponseMap {
  bytePos1b: DFDLDataBytePos
}

export type VSMessagePackage = {
  id: string
  payload: PostMessageArgs<MessageRequestMap, keyof MessageRequestMap>
}

export function getRequestCommandType(cmd: string, payload: any) {
  if (!isEditorMessageId(cmd)) {
    throw ''
  } else {
    const cmdIdx = EditorRequestIds.findIndex((ids) => {
      return ids == cmd
    })
    return EditorRequestIds[cmdIdx]
  }
}
export function getRequestPayloadType<K extends keyof MessageRequestMap>(
  payload: MessageRequestMap[keyof MessageRequestMap]
) {
  return payload as MessageRequestMap[K]
}
export type PostMessageArgs<R, K extends keyof R> = [R[K]] extends [never]
  ? [type: K]
  : [type: K, payload: R[K]]
