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

import { writable, derived } from 'svelte/store'
import { localStore } from './localStore'
import {vscode} from '../utilities/vscode'
import { MessageCommand } from '../utilities/message'

import type { LogicalDisplayState } from '../utilities/message'

const state_key = 'apache-daffodil-data-editor.state'

export const answer = localStore(state_key + '.answer', 42)
export const displayRadix = writable(16)
export const addressValue = writable(16)
export const addressDisplay = writable('')
export const fileByteStart = writable(0)
export const filesize = writable(0)
export const selectionStartStore = writable(0)
export const selectionEndStore = writable(0)
export const editorSelection = writable('')
export const editorEncoding = writable('hex')
export const cursorPos = writable(0)

export const selectionSize = derived([selectionStartStore, selectionEndStore], ([$selectionStartStore, $selectionEndStore])=>{
    return $selectionEndStore - $selectionStartStore
})
export const bytesPerRow = derived(displayRadix, $displayRadix=>{
    let logicalDisplayState: LogicalDisplayState
    let newVal: number
    ($displayRadix === 2)? newVal = 8 : newVal = 16

    logicalDisplayState = { bytesPerRow: newVal }
    vscode.postMessage({
        command: MessageCommand.addressOnChange,
        data: {
        state: logicalDisplayState,
        },
    })

    return newVal
})
export const fileByteEnd = derived([bytesPerRow, filesize], ([$bytesPerRow, $filesize])=>{
  return $filesize / $bytesPerRow
})

export const UInt8Data = writable(new Uint8Array(0))

