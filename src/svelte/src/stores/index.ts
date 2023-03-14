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
import {
  validEncodingStr,
  validRequestableData,
  radixBytePad,
  regexEditDataTest,
} from '../utilities/display'

export const diskFileSize = writable(0)
export const fileName = writable('')
export const fileType = writable('')
export const undoCount = writable(0)
export const changeCount = writable(0)
export const computedFileSize = writable(0)
export const cursorPos = writable(0)
export const searchData = writable('')
export const replaceData = writable('')
export const fileByteStart = writable(0)
export const displayRadix = writable(16)
export const addressValue = writable(16)
export const gotoOffsetMax = writable(0)
export const commitErrMsg = writable('')
export const searching = writable(false)
export const searchCaseInsensitive = writable(false)
export const gotoOffset = writable(0)
export const gotoOffsetInput = writable('')
export const searchResults = writable([])
export const searchErrMsg = writable('')
export const replaceErrMsg = writable('')
export const disableDataView = writable(false)
export const dataViewEndianness = writable('le') // 'le' for little endian and 'be' for big endian
export const viewportData = writable(new Uint8Array(0))
export const editorSelection = writable('')
export const selectionEndOffset = writable(0)
export const selectionOriginalEnd = writable(0)
export const editorEncoding = writable('latin1')
export const selectionStartOffset = writable(0)
export const rawEditorSelectionTxt = writable('')
export const editedDataSegment = writable(new Uint8Array(0))
export const editMode = writable('simple')
export const editByteWindowHidden = writable(true)
export const focusedViewportId = writable('')
export const replacing = writable(false)
export const replacementsCount = writable(0)
export const searchIndex = writable(0)
export const headerHidden = writable(false)
export const editByte = derived(
  [
    displayRadix,
    focusedViewportId,
    editMode,
    viewportData,
    selectionStartOffset,
  ],
  ([
    $displayRadix,
    $focusedViewportId,
    $editMode,
    $viewportData,
    $selectionStartOffset,
  ]) => {
    if (
      $viewportData[$selectionStartOffset] !== undefined &&
      $editMode === 'simple'
    ) {
      return $focusedViewportId === 'logical'
        ? String.fromCharCode($viewportData[$selectionStartOffset])
        : $viewportData[$selectionStartOffset]
            .toString($displayRadix)
            .padStart(radixBytePad($displayRadix), '0')
            .toUpperCase()
    }
    return ''
  }
)

export const editedByteIsOriginalByte = derived(
  [editorSelection, editByte, focusedViewportId],
  ([$editorSelection, $editByte, $focusedViewportId]) => {
    return $focusedViewportId === 'logical'
      ? $editorSelection === $editByte
      : $editorSelection.toLowerCase() === $editByte.toLowerCase()
  }
)
export const selectionSize = derived(
  [editMode, selectionStartOffset, selectionEndOffset, editorSelection],
  ([$editMode, $selectionStartStore, $selectionEndStore, $editorSelection]) => {
    if ($editMode === 'simple') return 1

    return $editorSelection !== ''
      ? $selectionEndStore - $selectionStartStore + 1
      : 0
  }
)

export const bytesPerRow = derived(displayRadix, ($displayRadix) => {
  return $displayRadix === 2 ? 8 : 16
})

export const fileByteEnd = derived(
  [bytesPerRow, diskFileSize],
  ([$bytesPerRow, $diskFileSize]) => {
    return $diskFileSize / $bytesPerRow
  }
)

export const allowCaseInsensitiveSearch = derived(
  editorEncoding,
  ($editorEncoding) => {
    return $editorEncoding === 'ascii' || $editorEncoding === 'latin1'
  }
)

export const saveable = derived([changeCount], ([$changeCount]) => {
  return $changeCount > 0
})

export const requestable = derived(
  [
    rawEditorSelectionTxt,
    focusedViewportId,
    editorEncoding,
    editMode,
    displayRadix,
  ],
  ([
    $rawEditorSelectionTxt,
    $focusedViewportId,
    $editorEncoding,
    $editMode,
    $displayRadix,
  ]) => {
    const ret = validRequestableData(
      $rawEditorSelectionTxt,
      $focusedViewportId,
      $editorEncoding,
      $editMode,
      $displayRadix
    )
    commitErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const originalDataSegment = derived(
  [viewportData, selectionStartOffset, selectionOriginalEnd],
  ([$viewportData, $selectionStartOffset, $selectionOriginalEnd]) => {
    return $viewportData.slice($selectionStartOffset, $selectionOriginalEnd + 1)
  }
)

export const commitable = derived(
  [
    requestable,
    viewportData,
    editedDataSegment,
    selectionStartOffset,
    selectionOriginalEnd,
    selectionEndOffset,
    selectionSize,
    editedByteIsOriginalByte,
  ],
  ([
    $requestable,
    $viewportData,
    $selectedFileData,
    $selectionStartOffset,
    $selectionOriginalEnd,
    $selectionEndOffset,
    $selectionSize,
    $editedByteIsOriginalByte,
  ]) => {
    if (!$requestable || $editedByteIsOriginalByte) return false
    const originalLength = $selectionOriginalEnd - $selectionStartOffset
    const editedLength = $selectionEndOffset - $selectionStartOffset

    if (originalLength !== editedLength) return true
    for (let i = 0; i < $selectionSize; i++) {
      if ($viewportData[i + $selectionStartOffset] !== $selectedFileData[i])
        return true
    }
    return false
  }
)

export const searchable = derived(
  [searchData, editorEncoding, searching, editMode],
  ([$searchData, $editorEncoding, $searching, $editMode]) => {
    if ($searchData.length <= 0 || $searching) {
      return false
    }
    const ret = validEncodingStr($searchData, $editorEncoding, 'full')
    searchErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const replaceable = derived(
  [replaceData, editorEncoding, searchable, replacing],
  ([$replaceData, $editorEncoding, $searchable, $replacing]) => {
    if ($replaceData.length <= 0 || !$searchable || $replacing) {
      return false
    }
    const ret = validEncodingStr($replaceData, $editorEncoding)
    replaceErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const gotoable = derived(
  [gotoOffset, gotoOffsetInput, gotoOffsetMax, addressValue],
  ([$gotoOffset, $gotoOffsetInput, $gotoOffsetMax, $addressValue]) => {
    if ($gotoOffsetInput.length <= 0) return { valid: false, gotoErrMsg: '' }
    if ($gotoOffset >= $gotoOffsetMax)
      return { valid: false, gotoErrMsg: 'Exceeds filesize' }
    if (!regexEditDataTest($gotoOffsetInput, $addressValue))
      return { valid: false, gotoErrMsg: 'Invalid characters' }
    return { valid: true, gotoErrMsg: '' }
  }
)

export const dataView = derived(editedDataSegment, ($selectedFileData) => {
  return new DataView($selectedFileData.buffer)
})

export const byteOffsetPos = derived(
  [cursorPos, editorEncoding],
  ([$cursorPos, $editorEncoding]) => {
    switch ($editorEncoding) {
      case 'hex':
        return Math.floor($cursorPos / 2)
      case 'binary':
        return Math.floor($cursorPos / 8)
      default:
        return $cursorPos
    }
  }
)

export const dataViewLookAhead = derived(
  [editMode, dataView, byteOffsetPos, disableDataView],
  ([$editMode, $dataView, $byteOffsetPos]) => {
    return $editMode === 'full'
      ? $dataView.byteLength - $byteOffsetPos.valueOf()
      : $dataView.byteLength
  }
)

export const int8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView.getInt8($byteOffsetPos).toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView.getUint8($byteOffsetPos).toString(10)
      return ''
    } catch (RangeError) {}
    return ''
  }
)

export const int16 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getInt16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint16 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getUint16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const int32 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getInt32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint32 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getUint32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const float32 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getFloat32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const int64 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigInt64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint64 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigUint64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const float64 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, dataViewEndianness],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $dataViewEndianness]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getFloat64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)
