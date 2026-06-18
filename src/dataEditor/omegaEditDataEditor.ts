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

import * as path from 'path'
import * as vscode from 'vscode'
import {
  DaffodilData,
  dataEvent,
  extractDaffodilEvent,
} from '../daffodilDebugger/daffodil'
import { substituteVSCodeEnvVariables } from '../utils'

export const DATA_EDITOR_COMMAND = 'extension.data.edit'
export const OMEGA_EDIT_EXTENSION_ID = 'ctc-oss.omega-edit-data-editor'
export const OMEGA_EDIT_EXTENSION_API_VERSION = 2
export const DAFFODIL_CURRENT_DATA_HIGHLIGHT_ID =
  'apache-daffodil.current-data-byte'
const DFDL_DEBUG_TYPE = 'dfdl'

export type OmegaEditExternalHighlightKind =
  | 'current'
  | 'parsed'
  | 'error'
  | 'warning'
  | 'breakpoint'
  | 'secondary'

export interface OmegaEditExternalHighlight {
  id: string
  offset: number
  length: number
  kind: OmegaEditExternalHighlightKind
  label: string
  source?: string
}

export interface OmegaEditEditorState {
  uri: string
  filePath: string
  fileSize: number
  externalHighlights: OmegaEditExternalHighlight[]
}

export interface OmegaEditEditorSelector {
  uri?: vscode.Uri | string
}

export interface OmegaEditOpenOptions {
  offset?: number
}

export interface OmegaEditExternalHighlightRequest
  extends OmegaEditEditorSelector {
  highlights: OmegaEditExternalHighlight[]
  reveal?: boolean
}

export interface OmegaEditExtensionApi {
  readonly extensionId: typeof OMEGA_EDIT_EXTENSION_ID
  readonly version: typeof OMEGA_EDIT_EXTENSION_API_VERSION
  readonly onDidChangeEditorState: vscode.Event<OmegaEditEditorState>
  open(
    uri: vscode.Uri,
    options?: OmegaEditOpenOptions
  ): Promise<OmegaEditEditorState | undefined>
  getEditorState(
    options?: vscode.Uri | string | OmegaEditEditorSelector
  ): OmegaEditEditorState | undefined
  setExternalHighlights(
    request: OmegaEditExternalHighlightRequest
  ): Promise<OmegaEditEditorState | undefined>
  clearExternalHighlights(
    options?: vscode.Uri | string | OmegaEditEditorSelector
  ): OmegaEditEditorState | undefined
}

const openDataEditorUris = new Map<string, vscode.Uri>()
let omegaEditApiPromise: Promise<OmegaEditExtensionApi> | undefined

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      DATA_EDITOR_COMMAND,
      async (fileToEdit: string | vscode.Uri = '') =>
        await openDataEditor(fileToEdit)
    ),
    vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
      void handleDaffodilDebugEvent(event)
    }),
    vscode.debug.onDidTerminateDebugSession((session) => {
      if (session.type === DFDL_DEBUG_TYPE) {
        void clearDaffodilDataHighlights()
      }
    })
  )
}

export async function openDataEditor(
  fileToEdit: string | vscode.Uri = ''
): Promise<OmegaEditEditorState | undefined> {
  const dataUri = await resolveDataFileUri(fileToEdit)
  if (!dataUri) return undefined

  const api = await getOmegaEditApiForUserAction()
  if (!api) return undefined

  const state = await api.open(dataUri)
  if (state) {
    openDataEditorUris.set(dataUri.toString(), dataUri)
  }
  return state
}

export async function resolveDataFileUri(
  fileToEdit: string | vscode.Uri = ''
): Promise<vscode.Uri | undefined> {
  if (fileToEdit instanceof vscode.Uri) {
    return fileToEdit
  }

  const dataPath = fileToEdit.trim()
  if (dataPath.length === 0) {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
      title: 'Select Data File',
    })

    if (!fileUri || !fileUri[0]) {
      vscode.window.showInformationMessage(
        'Data Editor file opening cancelled.'
      )
      return undefined
    }

    return fileUri[0]
  }

  const uri = dataPathLooksLikeUri(dataPath)
    ? vscode.Uri.parse(dataPath)
    : vscode.Uri.file(resolveDataPath(dataPath))

  try {
    const stat = await vscode.workspace.fs.stat(uri)
    if ((stat.type & vscode.FileType.File) === 0) {
      vscode.window.showErrorMessage(
        `Data Editor can only open files: ${uri.fsPath || uri.toString()}`
      )
      return undefined
    }
  } catch {
    vscode.window.showErrorMessage(
      `Data Editor file does not exist: ${uri.fsPath || uri.toString()}`
    )
    return undefined
  }

  return uri
}

export function buildDaffodilDataHighlight(
  bytePos1b: number,
  fileSize: number
): OmegaEditExternalHighlight | undefined {
  if (
    !Number.isFinite(bytePos1b) ||
    !Number.isInteger(bytePos1b) ||
    bytePos1b < 1 ||
    !Number.isFinite(fileSize) ||
    fileSize < 1
  ) {
    return undefined
  }

  const offset = Math.min(bytePos1b - 1, fileSize - 1)
  return {
    id: DAFFODIL_CURRENT_DATA_HIGHLIGHT_ID,
    offset,
    length: 1,
    kind: 'current',
    label: `Daffodil parser byte ${bytePos1b}`,
    source: 'Apache Daffodil',
  }
}

async function handleDaffodilDebugEvent(
  event: vscode.DebugSessionCustomEvent
): Promise<void> {
  if (event.session.type !== DFDL_DEBUG_TYPE) return
  if (openDataEditorUris.size === 0) return

  const daffodilEvent = extractDaffodilEvent(event)
  if (daffodilEvent?.event !== dataEvent) return

  const body = daffodilEvent.body as DaffodilData
  let api: OmegaEditExtensionApi
  try {
    api = await getOmegaEditApi()
  } catch {
    return
  }

  for (const [key, uri] of openDataEditorUris) {
    try {
      const editorState = api.getEditorState(uri)
      if (!editorState) {
        openDataEditorUris.delete(key)
        continue
      }

      const highlight = buildDaffodilDataHighlight(
        body.bytePos1b,
        editorState.fileSize
      )
      if (!highlight) continue

      const updatedState = await api.setExternalHighlights({
        uri,
        highlights: [highlight],
        reveal: true,
      })
      if (!updatedState) {
        openDataEditorUris.delete(key)
      }
    } catch {
      openDataEditorUris.delete(key)
    }
  }
}

async function clearDaffodilDataHighlights(): Promise<void> {
  const apiPromise = omegaEditApiPromise
  if (!apiPromise) return

  let api: OmegaEditExtensionApi
  try {
    api = await apiPromise
  } catch {
    if (omegaEditApiPromise === apiPromise) {
      omegaEditApiPromise = undefined
    }
    return
  }

  for (const [key, uri] of openDataEditorUris) {
    try {
      if (!api.getEditorState(uri)) {
        openDataEditorUris.delete(key)
        continue
      }

      api.clearExternalHighlights(uri)
    } catch {
      openDataEditorUris.delete(key)
    }
  }
}

async function getOmegaEditApiForUserAction(): Promise<
  OmegaEditExtensionApi | undefined
> {
  try {
    return await getOmegaEditApi()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    vscode.window.showErrorMessage(message)
    return undefined
  }
}

async function getOmegaEditApi(): Promise<OmegaEditExtensionApi> {
  if (!omegaEditApiPromise) {
    omegaEditApiPromise = activateOmegaEditApi()
  }

  const apiPromise = omegaEditApiPromise
  try {
    return await apiPromise
  } catch (err) {
    if (omegaEditApiPromise === apiPromise) {
      omegaEditApiPromise = undefined
    }
    throw err
  }
}

async function activateOmegaEditApi(): Promise<OmegaEditExtensionApi> {
  const extension = vscode.extensions.getExtension<OmegaEditExtensionApi>(
    OMEGA_EDIT_EXTENSION_ID
  )

  if (!extension) {
    throw new Error(
      `Required VS Code extension '${OMEGA_EDIT_EXTENSION_ID}' is not installed.`
    )
  }

  const api = await extension.activate()
  if (!isOmegaEditExtensionApi(api)) {
    throw new Error(
      `VS Code extension '${OMEGA_EDIT_EXTENSION_ID}' did not return a compatible Data Editor API.`
    )
  }

  return api
}

function isOmegaEditExtensionApi(
  value: unknown
): value is OmegaEditExtensionApi {
  if (!value || typeof value !== 'object') return false

  const api = value as Partial<OmegaEditExtensionApi>
  return (
    api.extensionId === OMEGA_EDIT_EXTENSION_ID &&
    api.version === OMEGA_EDIT_EXTENSION_API_VERSION &&
    typeof api.open === 'function' &&
    typeof api.getEditorState === 'function' &&
    typeof api.setExternalHighlights === 'function' &&
    typeof api.clearExternalHighlights === 'function'
  )
}

function dataPathLooksLikeUri(dataPath: string): boolean {
  if (/^[a-z]:[\\/]/i.test(dataPath)) return false

  return /^file:/i.test(dataPath) || /^[a-z][a-z0-9+.-]*:\/\//i.test(dataPath)
}

function resolveDataPath(dataPath: string): string {
  const substitutedPath = substituteVSCodeEnvVariables(dataPath)
  if (path.isAbsolute(substitutedPath)) {
    return path.normalize(substitutedPath)
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  return path.normalize(
    workspaceFolder
      ? path.join(workspaceFolder, substitutedPath)
      : path.resolve(substitutedPath)
  )
}
