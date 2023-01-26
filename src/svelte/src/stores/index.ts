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
import { vscode } from '../utilities/vscode'
import { MessageCommand } from '../utilities/message'

import type { LogicalDisplayState } from '../utilities/message'
import { afterUpdate } from 'svelte'

const state_key = 'apache-daffodil-data-editor.state'

export const answer = localStore(state_key + '.answer', 42)
export const filesize = writable(0)
export const cursorPos = writable(0)
export const editedCount = writable(0)
export const fileByteStart = writable(0)
export const displayRadix = writable(16)
export const addressValue = writable(16)
export const addressDisplay = writable('')
export const editorSelection = writable('')
export const selectionEndStore = writable(0)
export const editorEncoding = writable('hex')
export const selectionStartStore = writable(0)
export const disableDataView = writable(false)
export const dataViewEndianness = writable('be')
export const UInt8Data = writable(new Uint8Array(0))

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

export const selectionActive = derived(selectionSize, $selectionSize=>{
  return ($selectionSize > 0)
})

export const commitable = derived([editorEncoding, editorSelection, selectionActive], ([$editorEncoding, $editorSelection, $selectionActive]) => {
  if(!$selectionActive)
    return false
  if($editorEncoding === 'hex') {
    if(($editorSelection.length) % 2 != 0){
      return false
    }
  }
  return true
})

export const dataView = derived([UInt8Data, selectionStartStore, selectionEndStore, editedCount], ([$UInt8Data, $selectionStartStore, $selectionEndStore, $editedCount])=>{
    return new DataView($UInt8Data.buffer.slice($selectionStartStore, $selectionEndStore))
})

export const byteOffsetPos = derived([cursorPos, editorEncoding], ([$cursorPos, $editorEncoding]) => {
  let bytePOS: number

  $editorEncoding === 'hex'
    ? (bytePOS = Math.ceil(
        ($cursorPos - 1) / 2
      ))
    : bytePOS = $cursorPos
  
  return bytePOS
})

export const dataViewLookAhead = derived([dataView, byteOffsetPos, disableDataView], ([$dataView, $byteOffsetPos]) => {
  return $dataView.byteLength - $byteOffsetPos.valueOf()
})

export const int8 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive])=>{
  try{
    if($dataViewLookAhead >= 1 && $selectionActive)
        return $dataView.getInt8($byteOffsetPos).toString($displayRadix)
  }catch(RangeError){ }
  return ''
})

export const uint8 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive])=>{
  try{
    if($dataViewLookAhead >= 1 && $selectionActive)
      return $dataView.getUint8($byteOffsetPos).toString($displayRadix)
    return ''
  }catch(RangeError){ }
  return ''
})

export const int16 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
    if($dataViewLookAhead >= 2 && $selectionActive)
      return $dataView.getInt16($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }
  catch(RangeError){  }
    return ''
})

export const uint16 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
    if($dataViewLookAhead >= 2 && $selectionActive)
      return $dataView.getUint16($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }catch(RangeError){}
  return ''
})

export const int32 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
    if($dataViewLookAhead >= 4 && $selectionActive)
      return $dataView.getInt32($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }catch(RangeError){ }
  return ''
})

export const uint32 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
  if($dataViewLookAhead >= 4 && $selectionActive)
    return $dataView.getUint32($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }catch(RangeError){ }
  return ''
})

export const float32 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
  if($dataViewLookAhead >= 4 && $selectionActive)
    return $dataView.getFloat32($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix).substring(0, 32)
  }catch(RangeError){ }
  return ''
})

export const int64 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
  if($dataViewLookAhead >= 8 && $selectionActive)
    return $dataView.getBigInt64($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }catch(RangeError){ }
  return ''
})

export const uint64 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
  if($dataViewLookAhead >= 8 && $selectionActive)
    return $dataView.getBigUint64($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix)
  }catch(RangeError){}
  return ''
})

export const float64 = derived(
    [byteOffsetPos, dataViewLookAhead, displayRadix, dataView, selectionActive, dataViewEndianness], 
    ([$byteOffsetPos, $dataViewLookAhead, $displayRadix, $dataView, $selectionActive, $dataViewEndianness])=>{
  try{
  if($dataViewLookAhead >= 8 && $selectionActive)
    return $dataView.getFloat64($byteOffsetPos, ($dataViewEndianness === 'le')).toString($displayRadix).substring(0, 32)
  }catch(RangeError){  }
  return ''
})
