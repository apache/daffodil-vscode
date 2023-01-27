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
export const selectedFileData = writable(new Uint8Array(0))
export const commitErrMsg = writable('')
export const gotoOffset = writable(0)
export const gotoOffsetMax = writable(0)
export const editType = writable('')
export const viewportData = writable(new Uint8Array(0))

export const selectionSize = derived([selectionStartStore, selectionEndStore, editorSelection], ([$selectionStartStore, $selectionEndStore, $editorSelection])=>{
    if($editorSelection !== '') {
      return $selectionEndStore - $selectionStartStore + 1
    }
    return 0
})

export const bytesPerRow = derived(displayRadix, $displayRadix=>{
    let newVal: number
    ($displayRadix === 2)? newVal = 8 : newVal = 16

    return newVal
})

export const fileByteEnd = derived([bytesPerRow, filesize], ([$bytesPerRow, $filesize])=>{
  return $filesize / $bytesPerRow
})

export const selectionActive = derived([selectionSize,editorSelection], ([$selectionSize, $editorSelection])=>{
  return ($selectionSize >= 0 && $editorSelection !== '')
})

export const commitable = derived([editorEncoding, editorSelection, selectionActive], ([$editorEncoding, $editorSelection, $selectionActive]) => {
  if(!$selectionActive)
    return false
  let invalidChars: RegExpMatchArray
  switch($editorEncoding){
    case 'hex':
      invalidChars = $editorSelection.match(/[^0-9a-fA-F]/gi)
      if(invalidChars){
          commitErrMsg.update(()=>{
            return `Invalid HEX characters`
          })
        return false
      }
      else if(($editorSelection.length) % 2 != 0){
        commitErrMsg.update(()=>{
          return "Invalid HEX editable length"
        })
        return false
      }
      break
    case 'binary':
      invalidChars = $editorSelection.match(/[^0-1]/gi)
      if(invalidChars){
        commitErrMsg.update(()=>{
          return `Invalid BIN characters`
        })
        return false
      }
      else if(($editorSelection.length) % 8 != 0) {
        commitErrMsg.update(()=>{
          return "Invalid BIN editable length"
        })
        return false
      }
      break
    case 'base64':
      invalidChars = $editorSelection.match(/[^A-Za-z0-9+/]+={0,2}$/gi)
      if(invalidChars){
        commitErrMsg.update(()=>{
          return 'Invalid BASE64 characters'
        })
        return false
      }
      break
  }
  return true
})

export const dataView = derived([selectedFileData, selectionStartStore, selectionEndStore, editedCount], ([$selectedFileData, $selectionStartStore, $selectionEndStore])=>{
    return new DataView($selectedFileData.buffer)
})

export const byteOffsetPos = derived([cursorPos, editorEncoding], ([$cursorPos, $editorEncoding]) => {
  let bytePOS: number
  switch($editorEncoding){
    case 'hex':
      bytePOS = Math.floor(($cursorPos) / 2)
      break
    case 'binary':
      bytePOS = Math.floor(($cursorPos) / 8)
      break
    default:
      bytePOS = $cursorPos
      break
  }
  
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
