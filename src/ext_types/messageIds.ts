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
export const EditorRequestIds = [
  'clearChanges',
  'applyChanges',
  'fileInfo',
  'heartbeat',
  'profile',
  'redoChange',
  'replaceResults',
  'requestEditedData',
  'save',
  'saveAs',
  'saveSegment',
  'scrollViewport',
  'search',
  'replace',
  'undoChange',
  'viewportRefresh',
  'showMessage',
  'setUITheme',
  'editorOnChange',
] as const

export const EditorResponseIds = [
  'clearChanges',
  'counts',
  'applyChanges',
  'fileInfo',
  'heartbeat',
  'profile',
  'redoChange',
  'replaceResults',
  'requestEditedData',
  'save',
  'saveAs',
  'saveSegment',
  'scrollViewport',
  'search',
  'replace',
  'undoChange',
  'viewportRefresh',
  'showMessage',
  'setUITheme',
  'editorOnChange',
  'bytePos1b',
] as const

export type EditorRequestId = (typeof EditorRequestIds)[number]

export type EditorResponseId = (typeof EditorResponseIds)[number]

export function isEditorMessageId(id: string): id is EditorRequestId {
  return (EditorRequestIds as readonly string[]).includes(id)
}

export function isEditorResponseId(id: string): id is EditorResponseId {
  return (EditorResponseIds as readonly string[]).includes(id)
}
