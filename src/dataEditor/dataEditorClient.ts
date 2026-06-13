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
  ALL_EVENTS,
  clear,
  countCharacters,
  CountKind,
  createSession,
  createSimpleFileLogger,
  createViewport,
  del,
  edit,
  getByteOrderMark,
  getClient,
  getClientVersion,
  getComputedFileSize,
  getContentType,
  getCounts,
  getLanguage,
  getLogger,
  resetClient,
  getServerInfo,
  getViewportData,
  IOFlags,
  modifyViewport,
  numAscii,
  profileSession,
  redo,
  replaceOneSession,
  runSessionTransaction,
  saveSession,
  SaveStatus,
  searchSession,
  setLogger,
  startServer,
  stopProcessUsingPID,
  subscribeViewportEvents,
  undo,
  ViewportDataResponse,
  ViewportEventKind,
} from '@omega-edit/client'
import assert from 'assert'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import {
  DaffodilData,
  extractDaffodilEvent,
} from '../daffodilDebugger/daffodil'
import {
  DATA_PROFILE_MAX_LENGTH,
  VIEWPORT_CAPACITY_MAX,
} from '../svelte/src/stores/configuration'
import {
  ChangesInfoResponse,
  EditByteModes,
  getRequestCommandType,
  getRequestPayloadType,
  HeartbeatUIResponse,
  MessageRequestMap,
  VSMessagePackage,
} from 'ext_types'
import * as editor_config from './config'
import { configureOmegaEditPort, ServerInfo } from './include/server/ServerInfo'
import {
  DataEditorUI,
  getSvelteWebviewInitializer,
  startSvelteWebviewInitializer,
} from './ui/svelteWebviewInitializer'
import { addActiveSession } from './include/server/Sessions'
import { writeLogbackConfigFile } from './include/server/LogbackConfig'
import { getCurrentHeartbeatInfo } from './include/server/heartbeat'
import * as child_process from 'child_process'
import { osCheck } from '../utils'
import {
  DataEditorFileProvider,
  toEncoding,
  toMessageBytes,
  VSCodeDialogFileProvider,
} from './include/utils'
import { DataEditorFileInfo, DefaultFileInfo } from './include/fileInfoData'

// *****************************************************************************
// global constants
// *****************************************************************************

export const DATA_EDITOR_COMMAND: string = 'extension.data.edit'
export const OMEGA_EDIT_HOST: string = '127.0.0.1'
export const SERVER_START_TIMEOUT: number = 15 // in seconds
export const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()

// *****************************************************************************
// file-scoped constants
// *****************************************************************************

const HEARTBEAT_INTERVAL_MS: number = 1000 // 1 second (1000 ms)
const SERVER_SESSION_TIMEOUT_MS: number = 60 * 1000
const SERVER_CLEANUP_INTERVAL_MS: number = 15 * 1000
const MAX_LOG_FILES: number = 5 // Maximum number of log files to keep TODO: make this configurable
const OPEN_EDITORS = new Map<string, DataEditorUI>()
const EDITOR_PATH_KEY = (key: string) => {
  return key.toLowerCase()
}

// *****************************************************************************
// file-scoped variables
// *****************************************************************************
let serverInfo: ServerInfo = new ServerInfo()
let checkpointPath: string = ''
let omegaEditPort: number = 0
let configuredClientLogger:
  | {
      logFile: string
      logLevel: string
    }
  | undefined

// *****************************************************************************
// exported functions
// *****************************************************************************
export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      DATA_EDITOR_COMMAND,
      async (
        fileProvider: DataEditorFileProvider = VSCodeDialogFileProvider
      ) => {
        let configVars = editor_config.extractConfigurationVariables()
        const editor = await createDataEditorWebviewPanel(
          ctx,
          configVars,
          fileProvider
        )
        await editor?.initialize().catch((err) => {
          vscode.window.showErrorMessage(
            `Could not initialize data editor: ${err}`
          )
        })
        return editor
      }
    )
  )
}

// *****************************************************************************
// exported class
// *****************************************************************************

export class DataEditorClient implements vscode.Disposable {
  private currentViewportId: string
  private fileToEdit: string = ''
  private fileInfoData: DataEditorFileInfo = DefaultFileInfo
  private hasReceivedWebviewReady = false
  private omegaSessionId = ''
  private sendHeartbeatIntervalId: NodeJS.Timeout | number | undefined =
    undefined
  private viewportSubscription:
    | {
        cancel(): void
      }
    | undefined = undefined
  private disposables: vscode.Disposable[] = []
  private disposeCleanupComplete!: () => void
  readonly isDisposed = new Promise<void>((resolve) => {
    this.disposeCleanupComplete = resolve
  })
  constructor(
    protected context: vscode.ExtensionContext,
    private configVars: editor_config.IConfig,
    fileToEdit: string = '',
    private panel: DataEditorUI
  ) {
    this.panel = panel

    this.disposables = [
      this.panel,
      vscode.debug.onDidReceiveDebugSessionCustomEvent(async (e) => {
        const eventAsEditorMessage = extractDaffodilEvent(e)
        if (eventAsEditorMessage === undefined) return
        const { body, event } = eventAsEditorMessage
        if (event !== 'daffodil.data') return
        const { bytePos1b } = body as DaffodilData

        this.panel.postMessage('bytePos1b', {
          bytePos1b,
        })
      }),
    ]

    this.context.subscriptions.push(this)

    this.currentViewportId = ''
    this.fileToEdit = fileToEdit
  }
  public addDisposable(dispoable: vscode.Disposable) {
    this.disposables.push(dispoable)
  }
  public async dispose(): Promise<void> {
    if (this.sendHeartbeatIntervalId) {
      clearInterval(this.sendHeartbeatIntervalId)
      this.sendHeartbeatIntervalId = undefined
    }
    this.viewportSubscription?.cancel()
    this.viewportSubscription = undefined

    for (let i = 0; i < this.disposables.length; i++)
      this.disposables[i].dispose()
    this.disposeCleanupComplete()
  }

  public show(): void {
    this.panel.reveal()
  }

  //   async waitForDisposeCleanup(): Promise<void> {
  //     await this.disposeCleanupComplete
  //   }

  public async initialize(): Promise<void> {
    return new Promise(async (res, rej) => {
      await this.panel.isReady().catch((err) => rej(err))
      checkpointPath = this.configVars.checkpointPath

      await this.setupDataEditor().catch((err) => {
        this.panel.dispose()
        rej(err)
      })

      this.panel.onDidReceiveMessage((e) => {
        this.messageReceiver(e)
      })
      const pathKey = EDITOR_PATH_KEY(this.fileToEdit)
      if (OPEN_EDITORS.has(pathKey)) {
        OPEN_EDITORS.get(pathKey)?.reveal()
        this.panel.dispose()

        rej(`Data editor already open for: ${this.fileToEdit}`)
      }

      OPEN_EDITORS.set(pathKey, this.panel)
      this.sendHeartbeatIntervalId = setInterval(() => {
        this.sendHeartbeat()
      }, HEARTBEAT_INTERVAL_MS)

      this.panel.reveal()
      res()
    })
  }

  public sessionId(): string {
    return this.omegaSessionId
  }

  public isActive(): boolean {
    const pathKey = path.resolve(this.fileToEdit).toLowerCase()
    return OPEN_EDITORS.get(pathKey) !== undefined
  }

  public currentFile(): string {
    return this.fileToEdit
  }
  private async setupDataEditor(): Promise<void> {
    return new Promise(async (res, rej) => {
      assert(
        checkpointPath && checkpointPath.length > 0,
        'checkpointPath is not set'
      )
      getLogger().info(
        {
          fn: 'DataEditorClient::setupDataEditor',
          fileToEdit: this.fileToEdit,
        },
        'Starting data editor session setup'
      )

      let data: DataEditorFileInfo = {
        bom: '',
        changeCount: 0,
        computedFileSize: 0,
        filename: this.fileToEdit,
        language: '',
        contentType: '',
        undoCount: 0,
      }

      // create a session and capture the session id, content type, and file size
      try {
        const createSessionResponse = await createSession(
          this.fileToEdit,
          undefined,
          checkpointPath
        )
        this.omegaSessionId = createSessionResponse.getSessionId()
        assert(this.omegaSessionId.length > 0, 'omegaSessionId is not set')
        addActiveSession(this.omegaSessionId)

        getLogger().info(
          {
            fn: 'DataEditorClient::setupDataEditor',
            sessionId: this.omegaSessionId,
            fileSize: data.computedFileSize,
          },
          'Created data editor session'
        )

        const contentTypeResponse = await getContentType(
          this.omegaSessionId,
          0,
          Math.min(1024, data.computedFileSize)
        )
        data.contentType = contentTypeResponse.getContentType()
        assert(data.contentType.length > 0, 'contentType is not set')

        const byteOrderMarkResponse = await getByteOrderMark(
          this.omegaSessionId,
          0
        )
        data.bom = byteOrderMarkResponse.getByteOrderMark()
        assert(data.bom.length > 0, 'byteOrderMark is not set')

        const languageResponse = await getLanguage(
          this.omegaSessionId,
          0,
          Math.min(1024, data.computedFileSize),
          data.bom
        )
        data.language = languageResponse.getLanguage()
        assert(data.language.length > 0, 'language is not set')

        data.computedFileSize = createSessionResponse.hasFileSize()
          ? (createSessionResponse.getFileSize() as number)
          : 0
      } catch (err) {
        // Error message obtained from https://github.com/ctc-oss/omega-edit/commit/b85ecc4579a77469bf29181a2e6ab7f839ee8a52#diff-59917b7537d1a13d123e6c53315fd9f8eebb9a037c8e92142b8caefa64c5e1cbR84
        const isEmojiWindowsError =
          err ==
          'createSession error: 13 INTERNAL: Emojis in filenames is not supported on Windows'

        const msg = isEmojiWindowsError
          ? `Unable to open ${this.fileToEdit}! Data editor doesn't support Emojis in filename on Windows.`
          : `Failed to create session for ${this.fileToEdit}: ${String(err)}`

        getLogger().error({
          err: {
            msg: msg,
            stack: new Error().stack,
          },
        })
        rej(msg)
      }

      // create the viewport
      try {
        const viewportDataResponse = await createViewport(
          undefined,
          this.omegaSessionId,
          0,
          VIEWPORT_CAPACITY_MAX,
          false
        )
        this.currentViewportId = viewportDataResponse.getViewportId()
        assert(
          this.currentViewportId.length > 0,
          'currentViewportId is not set'
        )
        this.viewportSubscription = await viewportSubscribe(
          this.panel,
          this.currentViewportId
        )
        await sendViewportRefresh(this.panel, viewportDataResponse)
        getLogger().info(
          {
            fn: 'DataEditorClient::setupDataEditor',
            viewportId: this.currentViewportId,
          },
          'Created initial viewport'
        )
      } catch (err) {
        const msg = `Failed to create viewport for ${this.fileToEdit}: ${String(
          err
        )}`
        getLogger().error({
          err: {
            msg: msg,
            stack: new Error().stack,
          },
        })
        rej(msg)
      }

      this.fileInfoData = data
      this.panel.postMessage('fileInfo', {
        bom: data.bom,
        contentType: data.contentType,
        filename: this.fileToEdit,
        language: data.language,
      })

      this.panel.postMessage('counts', {
        applied: 0,
        computedFileSize: data.computedFileSize,
        undos: 0,
      })
      getLogger().info(
        {
          fn: 'DataEditorClient::setupDataEditor',
          sessionId: this.omegaSessionId,
          viewportId: this.currentViewportId,
        },
        'Posted initial file info to webview'
      )
      res()
    })
  }

  private async sendHeartbeat() {
    const heartbeatInfo = getCurrentHeartbeatInfo()
    const heartbeatResponse: HeartbeatUIResponse = {
      ...heartbeatInfo,
      serverInfo: serverInfo,
      omegaEditPort: this.configVars.port,
    }

    const delivered = await this.panel.postMessage(
      'heartbeat',
      heartbeatResponse
    )

    getLogger().debug({
      fn: 'DataEditorClient::sendHeartbeat',
      delivered,
      hasReceivedWebviewReady: this.hasReceivedWebviewReady,
      serverTimestamp: heartbeatInfo.serverTimestamp,
      sessionCount: heartbeatInfo.sessionCount,
    })
  }

  private async sendChangesInfo() {
    // get the counts from the server
    const counts = await getCounts(this.omegaSessionId, [
      CountKind.COMPUTED_FILE_SIZE,
      CountKind.CHANGE_TRANSACTIONS,
      CountKind.UNDO_TRANSACTIONS,
    ])

    // accumulate the counts into a single object
    let data: ChangesInfoResponse = {
      filename: this.fileToEdit,
      computedFileSize: 0,
      changeCount: 0,
      undoCount: 0,
    }
    counts.forEach((count) => {
      switch (count.getKind()) {
        case CountKind.COMPUTED_FILE_SIZE:
          data.computedFileSize = count.getCount()
          break
        case CountKind.CHANGE_TRANSACTIONS:
          data.changeCount = count.getCount()
          break
        case CountKind.UNDO_TRANSACTIONS:
          data.undoCount = count.getCount()
          break
      }
    })
    this.fileInfoData = {
      ...this.fileInfoData,
      ...data,
    }
    this.panel.postMessage('counts', {
      applied: data.changeCount,
      computedFileSize: data.computedFileSize,
      undos: data.undoCount,
    })
  }

  private async messageReceiver(incomingMessage: VSMessagePackage) {
    const command = getRequestCommandType(...incomingMessage.payload)

    switch (command) {
      case 'webviewReady':
        this.hasReceivedWebviewReady = true
        getLogger().info(
          {
            fn: 'DataEditorClient::messageReceiver',
            sessionId: this.omegaSessionId,
            viewportId: this.currentViewportId,
          },
          'Received webviewReady from data editor'
        )
        break
      case 'showMessage':
        {
          const { level, message } = getRequestPayloadType<typeof command>(
            incomingMessage.payload[1]
          )
          vscode.window[`show${level}Message`](message)
        }
        break
      case 'scrollViewport':
        {
          const { startOffset, bytesPerRow } = getRequestPayloadType<
            typeof command
          >(incomingMessage.payload[1])

          await this.scrollViewport(
            this.panel,
            this.currentViewportId,
            startOffset,
            bytesPerRow
          ).catch((err) => {
            vscode.window.showErrorMessage(err)
          })
        }
        break
      // Session Manipulation Commands
      case 'save':
        await this.saveFile(this.fileToEdit)

        break
      case 'saveSegment':
        const { length, offset } = getRequestPayloadType<typeof command>(
          incomingMessage.payload[1]
        )
        const uri = await vscode.window.showSaveDialog({
          title: 'Save Segment',
          saveLabel: 'Save',
        })
        if (uri && uri.fsPath) {
          await this.saveFileSegment(uri.fsPath, offset, length)
        }
        break
      case 'saveAs':
        {
          const uri = await vscode.window.showSaveDialog({
            title: 'Save Session',
            saveLabel: 'Save',
          })
          if (uri && uri.fsPath) {
            await this.saveFile(uri.fsPath)
          }
        }
        break

      case 'applyChanges':
        {
          const { offset, edited_segment, original_segment } =
            getRequestPayloadType<typeof command>(incomingMessage.payload[1])
          await edit(
            this.omegaSessionId,
            offset,
            original_segment,
            edited_segment
          )
          await this.sendChangesInfo()
        }
        break
      case 'undoChange':
        {
          await undo(this.omegaSessionId)
          await this.sendChangesInfo()
          this.panel.postMessage('clearChanges')
        }
        break
      case 'redoChange':
        {
          await redo(this.omegaSessionId)
          await this.sendChangesInfo()
          this.panel.postMessage('clearChanges')
        }
        break
      case 'clearChanges':
        {
          if (
            (await vscode.window.showInformationMessage(
              'Are you sure you want to revert all changes?',
              { modal: true },
              'Yes',
              'No'
            )) === 'Yes'
          ) {
            await clear(this.omegaSessionId)
            await this.sendChangesInfo()
            this.panel.postMessage('clearChanges')
          }
        }
        break
      case 'requestEditedData':
        {
          const payload = getRequestPayloadType<typeof command>(
            incomingMessage.payload[1]
          )
          const [selectionData, selectionDisplay] = fillRequestData(payload)

          await this.panel.postMessage('requestEditedData', {
            data: Uint8Array.from(selectionData),
            dataDisplay: selectionDisplay,
          })
        }
        break
      case 'replace':
        {
          const {
            encoding,
            replaceStr,
            searchStr,
            is_case_insensitive,
            is_reverse,
            length,
            offset,
            overwriteOnly,
          } = getRequestPayloadType<typeof command>(incomingMessage.payload[1])
          const requestedEncoding = toEncoding(encoding)

          const searchDataBytes =
            searchStr instanceof Uint8Array
              ? searchStr
              : encodedStrToData(searchStr, requestedEncoding)
          const replaceDataBytes =
            replaceStr instanceof Uint8Array
              ? replaceStr
              : encodedStrToData(replaceStr, requestedEncoding)
          const nextOffset = await replaceOneSession(
            this.omegaSessionId,
            searchDataBytes,
            replaceDataBytes,
            is_case_insensitive,
            is_reverse,
            offset,
            length,
            overwriteOnly
          )
          if (nextOffset === -1) {
            vscode.window.showErrorMessage('No replacement took place')
          } else {
            await this.sendChangesInfo()
          }
          await this.panel.postMessage('replaceResults', {
            replacementsCount: nextOffset === -1 ? 0 : 1,
            nextOffset: nextOffset,
            searchDataBytesLength: searchDataBytes.length,
            replaceDataBytesLength: replaceDataBytes.length,
          })
        }
        break

      // Utility Message Commands
      case 'search':
        {
          const {
            encoding,
            searchStr,
            is_case_insensitive,
            is_reverse,
            length,
            limit,
            offset,
          } = getRequestPayloadType<typeof command>(incomingMessage.payload[1])
          const requestedEncoding = toEncoding(encoding)

          const searchDataBytes = encodedStrToData(searchStr, requestedEncoding)
          const searchLimit = limit ? limit + 1 : 2

          const searchResults = await searchSession(
            this.omegaSessionId,
            searchDataBytes,
            is_case_insensitive,
            is_reverse,
            offset,
            length,
            searchLimit
          )

          if (searchResults.length === 0) {
            vscode.window.showInformationMessage(
              `No more matches found for '${searchStr}'`
            )
          }
          let overflow = false
          if (searchResults.length >= searchLimit) {
            overflow = true
            searchResults.pop()
          }
          await this.panel.postMessage('search', {
            results: searchResults,
            byteLength: searchDataBytes.length,
            overflow: overflow,
          })
        }
        break
      case 'profile':
        {
          let { length, startOffset } = getRequestPayloadType<typeof command>(
            incomingMessage.payload[1]
          )
          length = length < 0 ? DATA_PROFILE_MAX_LENGTH : length

          const byteProfile = await profileSession(
            this.omegaSessionId,
            startOffset,
            length
          ).catch((err) => {
            vscode.window.showErrorMessage(
              `Unable to post 'profile' response: ${err}`
            )
            return
          })
          const characterCount = await countCharacters(
            this.omegaSessionId,
            startOffset,
            length
          ).catch((err) => {
            vscode.window.showErrorMessage(
              `Unable to post 'profile' response: ${err}`
            )
            return
          })
          const contentTypeResponse = await getContentType(
            this.omegaSessionId,
            startOffset,
            length
          ).catch((err) => {
            vscode.window.showErrorMessage(
              `Unable to post 'profile' response: ${err}`
            )
            return
          })
          const languageResponse = await getLanguage(
            this.omegaSessionId,
            startOffset,
            length,
            characterCount!.getByteOrderMark()
          ).catch((err) => {
            vscode.window.showErrorMessage(
              `Unable to post 'profile' response: ${err}`
            )
            return
          })
          await this.panel.postMessage('profile', {
            startOffset: startOffset,
            length: length,
            byteProfile: byteProfile!,
            numAscii: numAscii(byteProfile!),
            language: languageResponse!.getLanguage(),
            contentType: contentTypeResponse!.getContentType(),
            characterCount: {
              byteOrderMark: characterCount!.getByteOrderMark(),
              byteOrderMarkBytes: characterCount!.getByteOrderMarkBytes(),
              singleByteCount: characterCount!.getSingleByteChars(),
              doubleByteCount: characterCount!.getDoubleByteChars(),
              tripleByteCount: characterCount!.getTripleByteChars(),
              quadByteCount: characterCount!.getQuadByteChars(),
              invalidBytes: characterCount!.getInvalidBytes(),
            },
          })
        }
        break
      case 'editorOnChange':
        {
          const { editMode, encoding, selectionData } = getRequestPayloadType<
            typeof command
          >(incomingMessage.payload[1])

          const requestedEncoding = toEncoding(encoding)

          this.panel.displayState.update('encoding', requestedEncoding)

          const encodeDataAs =
            editMode === EditByteModes.Single
              ? 'hex'
              : this.panel.displayState.get('encoding')

          if (selectionData && selectionData.length > 0) {
            await this.panel.postMessage('editorOnChange', {
              encodedStr: dataToEncodedStr(
                Buffer.from(selectionData),
                encodeDataAs
              ),
            })
          }
        }
        break
    }
  }

  private async saveFileSegment(
    fileToSave: string,
    offset: number,
    length: number
  ) {
    // if the file to save is the same as the file being edited then we can save the file with a single transaction to
    // trim the file to contain only the desired segment, preserving session state
    if (this.fileToEdit === fileToSave) {
      const computedFileSize = await getComputedFileSize(this.omegaSessionId)
      if (offset === 0) {
        if (offset + length !== computedFileSize) {
          // delete from length to the end of the file
          await del(this.omegaSessionId, length, computedFileSize - length)
          await this.sendChangesInfo()
        }
      } else if (offset + length === computedFileSize) {
        // delete from 0 to offset
        await del(this.omegaSessionId, 0, offset)
        await this.sendChangesInfo()
      } else {
        // Trim both sides atomically so undo/redo treats the segment save as one edit.
        await runSessionTransaction(this.omegaSessionId, async () => {
          await del(
            this.omegaSessionId,
            offset + length,
            computedFileSize - offset - length
          )
          await del(this.omegaSessionId, 0, offset)
        })
        await this.sendChangesInfo()
      }
      // save the segment to the file using the typical save method
      await this.saveFile(fileToSave)
    } else {
      let saved = false
      let cancelled = false

      // try to save the file with overwrite
      const saveResponse = await saveSession(
        this.omegaSessionId,
        fileToSave,
        IOFlags.OVERWRITE,
        offset,
        length
      )
      if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
        // the file was modified since the session was created, query user to overwrite the modified file
        if (
          (await vscode.window.showInformationMessage(
            'File has been modified since being opened overwrite the file anyway?',
            { modal: true },
            'Yes',
            'No'
          )) === 'Yes'
        ) {
          // the user decided to overwrite the file, try to save again with force overwrite
          const saveResponse2 = await saveSession(
            this.omegaSessionId,
            fileToSave,
            IOFlags.FORCE_OVERWRITE,
            offset,
            length
          )
          saved = saveResponse2.getSaveStatus() === SaveStatus.SUCCESS
        } else {
          cancelled = true
        }
      } else {
        saved = saveResponse.getSaveStatus() === SaveStatus.SUCCESS
      }

      if (saved) {
        vscode.window.showInformationMessage(`Saved: ${fileToSave}`)
      } else if (cancelled) {
        vscode.window.showInformationMessage(`Cancelled save: ${fileToSave}`)
      } else {
        vscode.window.showErrorMessage(`Failed to save: ${fileToSave}`)
      }
    }
  }

  private async saveFile(fileToSave: string) {
    let saved = false
    let cancelled = false

    // try to save the file with overwrite
    const saveResponse = await saveSession(
      this.omegaSessionId,
      fileToSave,
      IOFlags.OVERWRITE
    )
    if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
      // the file was modified since the session was created, query user to overwrite the modified file
      if (
        (await vscode.window.showInformationMessage(
          'File has been modified since being opened overwrite the file anyway?',
          { modal: true },
          'Yes',
          'No'
        )) === 'Yes'
      ) {
        // the user decided to overwrite the file, try to save again with force overwrite
        const saveResponse2 = await saveSession(
          this.omegaSessionId,
          fileToSave,
          IOFlags.FORCE_OVERWRITE
        )
        saved = saveResponse2.getSaveStatus() === SaveStatus.SUCCESS
      } else {
        cancelled = true
      }
    } else {
      saved = saveResponse.getSaveStatus() === SaveStatus.SUCCESS
    }

    if (saved) {
      const fileSize = await getComputedFileSize(this.omegaSessionId)
      if (this.fileToEdit !== fileToSave) {
        this.fileToEdit = fileToSave
        this.panel.postMessage('saveAs', {
          computedFileSize: fileSize,
          newFilePath: this.fileToEdit,
        })
      } else {
        this.panel.postMessage('save', {
          computedFileSize: fileSize,
        })
      }
      vscode.window.showInformationMessage(`Saved: ${fileToSave}`)
    } else if (cancelled) {
      vscode.window.showInformationMessage(`Cancelled save: ${fileToSave}`)
    } else {
      vscode.window.showErrorMessage(`Failed to save: ${fileToSave}`)
    }
  }

  private async scrollViewport(
    panel: DataEditorUI,
    viewportId: string,
    offset: number,
    bytesPerRow: number
  ) {
    // start of the row containing the offset, making sure the offset is never negative
    const startOffset = Math.max(0, offset - (offset % bytesPerRow))

    return new Promise<void>(async (res, rej) => {
      const dataResponse = await modifyViewport(
        viewportId,
        startOffset,
        VIEWPORT_CAPACITY_MAX
      ).catch((err) => {
        const msg = `Failed to modify viewport ${viewportId} to offset ${startOffset}: ${err}`
        getLogger().error({
          err: {
            msg: msg,
            stack: new Error().stack,
          },
        })
        rej(msg)
      })
      await sendViewportRefresh(panel, dataResponse!).catch((err) => {
        const msg = `Failed to send viewport ${viewportId} refresh offset ${startOffset}: ${err}`
        getLogger().error({
          err: {
            msg: msg,
            stack: new Error().stack,
          },
        })
        rej(msg)
      })
      res()
    })
  }
}

// *****************************************************************************
// file-scoped functions
// *****************************************************************************

async function createDataEditorWebviewPanel(
  ctx: vscode.ExtensionContext,
  launchConfigVars: editor_config.IConfig,
  fileProvider: DataEditorFileProvider
): Promise<DataEditorClient | undefined> {
  //prompt file prompt first.
  const fileToEdit = await fileProvider
    .getFile((file) => {
      file = file.replace(
        editor_config.WorkspaceKeyword,
        editor_config.rootPath
      )
      file = path.resolve(file).toLowerCase()
      return file
    })
    .catch((err) => {
      throw new Error(err)
    })

  // Ensure the app data path exists
  fs.mkdirSync(APP_DATA_PATH, { recursive: true })
  assert(fs.existsSync(APP_DATA_PATH), 'app data path does not exist')

  // Make sure the omega edit port is configured
  configureOmegaEditPort(launchConfigVars)
  omegaEditPort = launchConfigVars.port
  checkpointPath = launchConfigVars.checkpointPath
  await setupLogging(launchConfigVars)

  // Start the server if it's not already running
  const serverListening = await checkServerListening(
    omegaEditPort,
    OMEGA_EDIT_HOST
  )
  if (!serverListening) {
    resetOmegaEditConnectionState()
    clearStoppedServerArtifacts()
    await serverStart()
  }
  await getClient(omegaEditPort, OMEGA_EDIT_HOST)
  assert(
    await checkServerListening(omegaEditPort, OMEGA_EDIT_HOST),
    'server not listening'
  )
  serverInfo = await getServerInfo()

  startSvelteWebviewInitializer(ctx)

  const webviewAttr = getSvelteWebviewInitializer().getAttributes(fileToEdit)

  if (OPEN_EDITORS.has(EDITOR_PATH_KEY(fileToEdit)))
    throw new Error(
      `A Data Editor instance already exists for ${webviewAttr.title}`
    )

  const ui = getSvelteWebviewInitializer().createSveltePanel(webviewAttr)

  ui.displayState.onColorThemeChanged((kind) => {
    ui.postMessage('setUITheme', kind)
  })
  // Use the new duplicate-safe open method

  return new DataEditorClient(ctx, launchConfigVars, fileToEdit, ui)
}

function rotateLogFiles(logFile: string): void {
  interface LogFile {
    path: string
    ctime: Date
  }

  function isRotatedLogFileName(fileName: string): boolean {
    const parsed = path.parse(logFile)
    const currentFileName = parsed.base
    const legacyPrefix = `${currentFileName}.`

    if (fileName === currentFileName) {
      return false
    }

    if (fileName.startsWith(legacyPrefix)) {
      return true
    }

    if (parsed.ext.length === 0) {
      return false
    }

    return (
      fileName.startsWith(`${parsed.name}.`) && fileName.endsWith(parsed.ext)
    )
  }

  function getRotatedLogFileName(timestamp: string): string {
    const parsed = path.parse(logFile)
    return parsed.ext.length > 0
      ? `${parsed.name}.${timestamp}${parsed.ext}`
      : `${parsed.base}.${timestamp}`
  }

  assert(
    MAX_LOG_FILES > 0,
    'Maximum number of log files must be greater than 0'
  )

  if (fs.existsSync(logFile)) {
    const logDir = path.dirname(logFile)

    // Get list of existing log files
    const logFiles: LogFile[] = fs
      .readdirSync(logDir)
      .filter((file) => isRotatedLogFileName(file))
      .map((file) => ({
        path: path.join(logDir, file),
        ctime: fs.statSync(path.join(logDir, file)).ctime,
      }))
      .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())

    // Delete oldest log files if maximum number of log files is exceeded
    while (logFiles.length >= MAX_LOG_FILES) {
      const fileToDelete = logFiles.pop() as LogFile
      fs.unlinkSync(fileToDelete.path)
    }

    // Rename current log file with timestamp and create a new empty file
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    fs.renameSync(logFile, path.join(logDir, getRotatedLogFileName(timestamp)))
  }
}

function getPidFile(serverPort: number): string {
  return path.join(APP_DATA_PATH, `serv-${serverPort}.pid`)
}

async function setupLogging(configVars: editor_config.Config): Promise<void> {
  const logFile = configVars.logFile
  const logLevel =
    process.env.OMEGA_EDIT_CLIENT_LOG_LEVEL ||
    process.env.OMEGA_EDIT_LOG_LEVEL ||
    configVars.logLevel
  if (
    configuredClientLogger?.logFile === logFile &&
    configuredClientLogger.logLevel === logLevel
  ) {
    return
  }
  rotateLogFiles(logFile)
  setLogger(createSimpleFileLogger(logFile, logLevel))
  configuredClientLogger = { logFile, logLevel }
  vscode.window.showInformationMessage(`Logging (${logLevel}) to '${logFile}'`)
}

async function sendViewportRefresh(
  ui: DataEditorUI,
  viewportDataResponse: ViewportDataResponse
): Promise<void> {
  return new Promise(async (res) => {
    const delivered = await ui.postMessage('viewportRefresh', {
      viewportId: viewportDataResponse.getViewportId(),
      fileOffset: viewportDataResponse.getOffset(),
      length: viewportDataResponse.getLength(),
      bytesLeft: viewportDataResponse.getFollowingByteCount(),
      data: toMessageBytes(viewportDataResponse.getData_asU8()),
      capacity: VIEWPORT_CAPACITY_MAX,
    })

    getLogger().debug({
      fn: 'sendViewportRefresh',
      delivered,
      viewportId: viewportDataResponse.getViewportId(),
      offset: viewportDataResponse.getOffset(),
      length: viewportDataResponse.getLength(),
      bytesLeft: viewportDataResponse.getFollowingByteCount(),
    })
    res()
  })
}

/**
 * Subscribe to all events for a given viewport so the editor gets refreshed when changes to the viewport occur
 * @param panel webview panel to send updates to
 * @param viewportId id of the viewport to subscribe to
 */
async function viewportSubscribe(ui: DataEditorUI, viewportId: string) {
  return await subscribeViewportEvents({
    viewportId,
    interest: ALL_EVENTS & ~ViewportEventKind.MODIFY,
    onEvent: async (event) => {
      getLogger().debug({
        viewportId: event.getViewportId(),
        event: event.getViewportEventKind(),
      })
      await sendViewportRefresh(ui, await getViewportData(viewportId))
    },
  })
}

function fillRequestData(
  message: MessageRequestMap['requestEditedData']
): [Buffer, string] {
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  let encoding = toEncoding(message.encodingStr)

  if (message.editMode === EditByteModes.Multiple) {
    selectionByteData = encodedStrToData(message.editedContent, encoding)
    selectionByteDisplay = dataToEncodedStr(selectionByteData, encoding)
  } else {
    selectionByteData =
      message.viewport === 'logical'
        ? encodedStrToData(message.editedContent, 'latin1')
        : Buffer.from([parseInt(message.editedContent, message.radix)])

    selectionByteDisplay =
      message.viewport === 'logical'
        ? message.editedContent
        : dataToRadixStr(selectionByteData, message.radix)
  }

  return [selectionByteData, selectionByteDisplay]
}

function encodedStrToData(
  selectionEdits: string,
  selectionEncoding?: BufferEncoding
): Buffer {
  let selectionByteData: Buffer
  switch (selectionEncoding) {
    case 'hex':
      selectionByteData = Buffer.alloc(selectionEdits.length / 2)
      for (let i = 0; i < selectionEdits.length; i += 2) {
        selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
      }
      return selectionByteData
    case 'binary':
      selectionByteData = Buffer.alloc(selectionEdits.length / 8)
      for (let i = 0; i < selectionEdits.length; i += 8) {
        selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
      }
      return selectionByteData
    default:
      return Buffer.from(selectionEdits, selectionEncoding)
  }
}

function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding | undefined
): string {
  if (!encoding) {
    console.error(
      `Request encoding (${encoding}) is not an appropriate type of BufferEncoding`
    )
    return ''
  }
  return encoding === 'binary'
    ? dataToRadixStr(buffer, 2)
    : buffer.toString(encoding)
}

function dataToRadixStr(buffer: Buffer, radix: number): string {
  const padLen = radixBytePad(radix)
  let ret = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    ret += buffer[i].toString(radix).padStart(padLen, '0')
  }
  return ret
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

/**
 * Checks if a server is listening on a given port and host
 * @param port port to check
 * @param host host to check
 * @returns true if a server is listening on the given port and host, false otherwise
 */
function checkServerListening(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket: net.Socket = new net.Socket()
    socket.setTimeout(2000) // set a 2-second timeout for the connection attempt
    socket.on('connect', () => {
      socket.destroy() // close the connection once connected
      resolve(true) // server is listening
    })
    socket.on('timeout', () => {
      socket.destroy() // close the connection on timeout
      resolve(false) // server is not listening
    })
    socket.on('error', () => {
      resolve(false) // server is not listening or an error occurred
    })
    socket.connect(port, host)
  })
}

/**
 * Removes a directory and all of its contents
 * @param dirPath path to directory to remove
 */
function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = `${dirPath}/${file}`
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectory(curPath)
      } else {
        // Delete file
        fs.unlinkSync(curPath)
      }
    })

    // Remove empty directory
    fs.rmdirSync(dirPath)
  }
}

function resetOmegaEditConnectionState(): void {
  resetClient()
}

function clearStoppedServerArtifacts(): void {
  const serverPidFile = getPidFile(omegaEditPort)
  if (fs.existsSync(serverPidFile)) {
    fs.unlinkSync(serverPidFile)
  }
  if (checkpointPath.length > 0) {
    removeDirectory(checkpointPath)
  }
}

export async function serverStop() {
  resetOmegaEditConnectionState()
  const serverPidFile = getPidFile(omegaEditPort)
  if (!fs.existsSync(serverPidFile)) {
    if (!(await checkServerListening(omegaEditPort, OMEGA_EDIT_HOST))) {
      clearStoppedServerArtifacts()
    }
    return
  }

  const pid = parseInt(fs.readFileSync(serverPidFile).toString())
  if (Number.isNaN(pid)) {
    clearStoppedServerArtifacts()
    return
  }

  let stopped = await stopProcessUsingPID(pid)
  if (!stopped) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    stopped = await stopProcessUsingPID(pid)
  }

  const serverListening = await checkServerListening(
    omegaEditPort,
    OMEGA_EDIT_HOST
  )

  if (stopped || !serverListening) {
    vscode.window.setStatusBarMessage(
      `Ωedit server stopped on port ${omegaEditPort} with PID ${pid}`,
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true)
        }, 4000)
      })
    )
    clearStoppedServerArtifacts()
    return
  }

  vscode.window.showErrorMessage(
    `Ωedit server on port ${omegaEditPort} with PID ${pid} failed to stop`
  )
}

function generateLogbackConfigFile(
  logFile: string,
  logLevel: string = 'INFO'
): string {
  const logbackConfigFile = path.join(
    APP_DATA_PATH,
    `serv-${omegaEditPort}.logconf.xml`
  )
  rotateLogFiles(logFile)
  return writeLogbackConfigFile(logbackConfigFile, logFile, logLevel)
}

function getProcessCommandLine(pid: number): string {
  return child_process
    .execSync(
      osCheck(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\\"ProcessId = ${pid}\\\").CommandLine"`,
        `ps -p ${pid} -o command=`
      )
    )
    .toString('utf8')
    .trim()
}

async function serverStart() {
  // Check for stale PID file
  const serverPidFile = getPidFile(omegaEditPort)
  if (fs.existsSync(serverPidFile)) {
    const pid = parseInt(fs.readFileSync(serverPidFile).toString())
    if (!isNaN(pid)) {
      // Ensure PID isn't assigned to a different process before stopping process
      try {
        if (getProcessCommandLine(pid).toLowerCase().includes('omega-edit')) {
          await serverStop()
        } else {
          fs.unlinkSync(serverPidFile)
        }
      } catch (error) {
        // if process doesn't exist, ps returns 1 resulting in command failed error
        fs.unlinkSync(serverPidFile)
      }
    } else {
      fs.unlinkSync(serverPidFile)
    }
  }
  const serverStartingText = `Ωedit server starting on port ${omegaEditPort}`
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  )
  statusBarItem.text = serverStartingText
  statusBarItem.show()

  let animationFrame = 0
  const animationInterval = 400 // ms per frame
  const animationFrames = ['', '.', '..', '...']
  const animationIntervalId = setInterval(() => {
    statusBarItem.text = `${serverStartingText} ${
      animationFrames[++animationFrame % animationFrames.length]
    }`
  }, animationInterval)
  const config = vscode.workspace.getConfiguration('dataEditor')
  const logLevel =
    process.env.OMEGA_EDIT_SERVER_LOG_LEVEL ||
    process.env.OMEGA_EDIT_LOG_LEVEL ||
    config.get<string>('logLevel', 'info')
  const logConfigFile = generateLogbackConfigFile(
    path.join(APP_DATA_PATH, `serv-${omegaEditPort}.log`),
    logLevel
  )
  if (!fs.existsSync(logConfigFile)) {
    clearInterval(animationIntervalId)
    statusBarItem.dispose()
    throw new Error(`Log config file '${logConfigFile}' not found`)
  }

  // Start the server and wait up to 10 seconds for it to start
  const serverPid = (await Promise.race([
    startServer(omegaEditPort, OMEGA_EDIT_HOST, getPidFile(omegaEditPort), {
      sessionTimeoutMs: SERVER_SESSION_TIMEOUT_MS,
      cleanupIntervalMs: SERVER_CLEANUP_INTERVAL_MS,
      shutdownWhenNoSessions: true,
      logConfigFile,
    }),
    new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject((): Error => {
          return new Error(
            `Server startup timed out after ${SERVER_START_TIMEOUT} seconds`
          )
        })
      }, SERVER_START_TIMEOUT * 1000)
    }),
  ])) as number | undefined
  clearInterval(animationIntervalId)
  if (serverPid === undefined || serverPid <= 0) {
    statusBarItem.dispose()
    throw new Error('Server failed to start or PID is invalid')
  }
  // this makes sure the server if fully online and ready to take requests
  statusBarItem.text = `Initializing Ωedit server on port ${omegaEditPort}`
  for (let i = 1; i <= 60; ++i) {
    try {
      await getServerInfo()
      break
    } catch (err) {
      statusBarItem.text = `Initializing Ωedit server on port ${omegaEditPort} (${i}/60)`
    }
    // wait 1 second before trying again
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 1000)
    })
  }
  try {
    serverInfo = await getServerInfo()
  } catch (err) {
    statusBarItem.dispose()
    await serverStop()
    throw new Error('Server failed to initialize')
  }
  statusBarItem.text = `Ωedit server on port ${omegaEditPort} initialized`
  const serverVersion = serverInfo.serverVersion
  // if the OS is not Windows, check that the server PID matches the one started
  // NOTE: serverPid is the PID of the server wrapper script on Windows
  if (
    !os.platform().toLowerCase().startsWith('win') &&
    serverInfo.serverProcessId !== serverPid
  ) {
    statusBarItem.dispose()
    throw new Error(
      `server PID mismatch ${serverInfo.serverProcessId} != ${serverPid}`
    )
  }
  const clientVersion = getClientVersion()
  if (serverVersion !== clientVersion) {
    statusBarItem.dispose()
    throw new Error(
      `Server version ${serverVersion} and client version ${clientVersion} must match`
    )
  }

  statusBarItem.text = `Ωedit server v${serverVersion} ready on port ${omegaEditPort} with PID ${serverInfo.serverProcessId}`
  setTimeout(() => {
    statusBarItem.dispose()
  }, 5000)
}
