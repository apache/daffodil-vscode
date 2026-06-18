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

const fs = require('fs')
const vscode = require('vscode')

const extensionId = 'ctc-oss.omega-edit-data-editor'
const editorStates = new Map()
const onDidChangeEditorStateEmitter = new vscode.EventEmitter()

function defaultUiState() {
  return {
    visibleOffset: 0,
    visibleByteCount: 0,
    selectedOffset: 0,
    selectionStart: 0,
    selectionEnd: 0,
    selectionLength: 0,
    bytesPerRow: 16,
    offsetRadix: 'hex',
    activePane: 'hex',
    editMode: 'overwrite',
  }
}

function uriFromOptions(options) {
  if (!options) return undefined
  if (typeof options === 'string') return vscode.Uri.parse(options)
  if (options instanceof vscode.Uri) return options
  if (options.uri instanceof vscode.Uri) return options.uri
  if (typeof options.uri === 'string') return vscode.Uri.parse(options.uri)
  return undefined
}

function getState(options) {
  const uri = uriFromOptions(options)
  if (!uri) return editorStates.values().next().value
  return editorStates.get(uri.toString())
}

function publishState(state) {
  editorStates.set(state.uri, state)
  onDidChangeEditorStateEmitter.fire(state)
  return state
}

function activate() {
  return {
    extensionId,
    version: 2,
    onDidChangeEditorState: onDidChangeEditorStateEmitter.event,
    async open(uri, options = {}) {
      const fileSize = fs.statSync(uri.fsPath).size
      const selectedOffset = options.offset ?? 0
      return publishState({
        ...defaultUiState(),
        uri: uri.toString(),
        filePath: uri.fsPath,
        fileSize,
        selectedOffset,
        dirty: false,
        canUndo: false,
        canRedo: false,
        undoCount: 0,
        redoCount: 0,
        savedChangeDepth: 0,
        changeCount: 0,
        sessionSyncVersion: 0,
        externalHighlights: [],
        transformSummaries: [],
      })
    },
    getEditorState(options) {
      return getState(options)
    },
    async setExternalHighlights(request) {
      const state = getState(request)
      if (!state) return undefined
      state.externalHighlights = request.highlights
      return publishState(state)
    },
    clearExternalHighlights(options) {
      const state = getState(options)
      if (!state) return undefined
      state.externalHighlights = []
      return publishState(state)
    },
  }
}

function deactivate() {
  onDidChangeEditorStateEmitter.dispose()
}

module.exports = { activate, deactivate }
