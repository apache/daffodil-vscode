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

import type { ValidationResponse } from '../utilities/display'
import { ThemeType } from '../utilities/colorScheme'
import { FileMetrics } from '../components/Header/fieldsets/FileMetrics'
import { derived, writable } from 'svelte/store'
import { SimpleWritable } from './localStore'
import { ErrorComponentType, ErrorStore } from '../components/Error/Error'
import {
  radixBytePad,
  regexEditDataTest,
  validateEncodingStr,
} from '../utilities/display'
import {
  BYTE_ACTION_DIV_OFFSET,
  ViewportDataStore_t,
  type ByteValue,
} from '../components/DataDisplays/CustomByteDisplay/BinaryData'
import {
  ReplaceQuery,
  SearchQuery,
} from '../components/Header/fieldsets/SearchReplace'
import {
  EditByteModes,
  UNPRINTABLE_CHAR_STAND_IN,
  type RadixValues,
  type BytesPerRow,
  EditActionRestrictions,
} from './configuration'

export class SelectionData_t {
  startOffset = -1
  endOffset = -1
  originalEndOffset = -1
  active = false
  public isValid(): boolean {
    return (
      this.startOffset >= 0 &&
      this.originalEndOffset >= this.startOffset &&
      this.endOffset >= 0 &&
      this.originalEndOffset >= 0
    )
  }
}

class SelectionData extends SimpleWritable<SelectionData_t> {
  protected init(): SelectionData_t {
    return new SelectionData_t()
  }
  public reset() {
    this.store.set(new SelectionData_t())
  }
}

export enum EditModeRestrictions {
  None,
  OverwriteOnly,
}

// noinspection JSUnusedGlobalSymbols

// theme to use for the UI
export const UITheme = writable(ThemeType.Dark)

// address radix to use for the UI (2, 8, 10, 16)
export const addressRadix = writable(16 as RadixValues)

// populated when there is a apply error
export const applyErrMsg = writable('')

// endianness to use for the data view ('le' or 'be' for little or big endian respectively)
export const dataViewEndianness = writable('le')

// radix to use for displaying raw bytes (2, 8, 10, 16)
export const displayRadix = writable(16 as RadixValues)

// segment of data that is being edited in single or multiple byte modes
export const editedDataSegment = writable(new Uint8Array(0))

// encoding to use in the multibyte editor
export const editorEncoding = writable('latin1')

export const editorSelection = writable('')

export const focusedViewportId = writable('')

// writeable string input for the seek offset
export const seekOffsetInput = writable('')

// writeable boolean, true indicates that the search is case insensitive for character sets that support it
export const searchCaseInsensitive = writable(false)

// Current viewport line number at the top of the data display
export const dataFeedLineTop = writable(0)

// Data display needs to wait from data from extension or function
export const dataFeedAwaitRefresh = writable(false)

export const rerenderActionElements = writable(false)

// Viewport properties
export const viewport = new ViewportDataStore_t()
export const viewportNumLinesDisplayed = writable(20)

export const bytesPerRow = writable(16 as BytesPerRow)
export const editingByte = writable(false)
export const selectedByte = writable({
  text: '',
  offset: -1,
  value: -1,
} as ByteValue)

// Omega Edit and Data Editor file information
export const fileMetrics = new FileMetrics()

export const searchQuery = new SearchQuery()
export const replaceQuery = new ReplaceQuery()

export const searchErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const replaceErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const seekErr = new ErrorStore(ErrorComponentType.SYMBOL)

// Which types of edit restrictions are in place
export const editorActionsAllowed = writable(EditActionRestrictions.None)
export const tooltipsEnabled = writable(false)

// If byte lengths should be in a human readable format
export const sizeHumanReadable = writable(false)

// tracks the start and end offsets of the current selection
export const selectionDataStore = new SelectionData()

// Can the user's selection derive both edit modes?
export const regularSizedFile = derived(fileMetrics, ($fileMetrics) => {
  return $fileMetrics.computedSize >= 2
})

export const searchable = derived(
  [searchQuery, editorEncoding],
  ([$searchQuery, $editorEncoding]) => {
    if ($searchQuery.input.length === 0 || $searchQuery.processing) {
      searchErr.update(() => {
        return ''
      })
      return false
    }
    const ret = validateEncodingStr($searchQuery.input, $editorEncoding, 'full')
    searchErr.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const replaceable = derived(
  [replaceQuery, editorEncoding, searchable, selectionDataStore],
  ([$replaceData, $editorEncoding, $searchable, $selectionData]) => {
    if (
      $replaceData.input.length < 0 ||
      !$searchable ||
      $replaceData.processing
    ) {
      replaceErr.update(() => {
        return ''
      })
      return false
    }
    if ($selectionData.active) {
      replaceErr.update(() => {
        return 'Cannot replace while viewport data is selected'
      })
      return false
    }

    const ret = validateEncodingStr($replaceData.input, $editorEncoding)
    replaceErr.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

// derived readable enumeration that indicates the edit mode (single byte or multiple bytes)
export const editMode = derived(
  [selectionDataStore, regularSizedFile],
  ([$selectionData, $regularSizedFile]) => {
    if (!$regularSizedFile) return EditByteModes.Multiple

    return $selectionData.originalEndOffset - $selectionData.startOffset === 0
      ? EditByteModes.Single
      : EditByteModes.Multiple
  },
  EditByteModes.Single
)

// derived readable number whose value is the size of the current data selection
export const selectionSize = derived(
  [selectionDataStore, editorSelection],
  ([$selectionData, $editorSelection]) => {
    return $editorSelection !== ''
      ? $selectionData.endOffset - $selectionData.startOffset + 1
      : 0
  }
)

// derived from the seek offset input and the current address radix
export const seekOffset = derived(
  [seekOffsetInput, addressRadix],
  ([$seekOffsetInput, $addressRadix]) => {
    return $seekOffsetInput.length > 0
      ? Math.max(0, parseInt($seekOffsetInput, $addressRadix))
      : 0
  }
)

// derived readable string whose value is the selected encoded byte value with respect to the current focused viewport
export const editByte = derived(
  [displayRadix, focusedViewportId, viewport, selectionDataStore],
  ([$displayRadix, $focusedViewportId, $viewport, $selectionData]) => {
    // TODO: I think there is a cleaner way to do this given that we already have the encoded data in the respective viewports
    if ($viewport.data[$selectionData.startOffset] !== undefined) {
      return $focusedViewportId === 'logical'
        ? String.fromCharCode($viewport.data[$selectionData.startOffset])
        : $viewport.data[$selectionData.startOffset]
            .toString($displayRadix)
            .padStart(radixBytePad($displayRadix), '0')
    }
    return ''
  }
)

// derived readable boolean that indicates if the edited byte is equivalent to the original byte
export const editedByteIsOriginalByte = derived(
  [editorSelection, selectedByte, focusedViewportId],
  ([$editorSelection, $selectedByte, $focusedViewportId]) => {
    return $focusedViewportId === 'logical'
      ? $editorSelection === $selectedByte.text
      : $editorSelection.toLowerCase() === $selectedByte.text.toLowerCase()
  }
)

export const viewportColumnWidth = derived(bytesPerRow, (bytesPerRow) => {
  return bytesPerRow * BYTE_ACTION_DIV_OFFSET
})
// derived readable boolean that indicates if the case-insensitive search is allowed
export const allowCaseInsensitiveSearch = derived(
  editorEncoding,
  ($editorEncoding) => {
    return $editorEncoding === 'ascii' || $editorEncoding === 'latin1'
  }
)

// derived readable boolean that indicates if the file is saveable (there are outstanding changes)
export const saveable = derived([fileMetrics], ([$fileMetrics]) => {
  return $fileMetrics.changeCount > 0
})

export const requestable = derived(
  [editorSelection, focusedViewportId, editorEncoding, editMode, displayRadix],
  ([
    $editorSelection,
    $focusedViewportId,
    $editorEncoding,
    $editMode,
    $displayRadix,
  ]) => {
    const ret = validRequestableData(
      $editorSelection,
      $focusedViewportId,
      $editorEncoding,
      $editMode,
      $displayRadix
    )
    applyErrMsg.update(() => {
      return ret.errMsg
    })

    return ret.valid
  }
)

export const originalDataSegment = derived(
  [viewport, selectionDataStore, regularSizedFile],
  ([$viewport, $selectionData, $regularSizedFile]) => {
    if (!$viewport.data) return []
    if (!$regularSizedFile) return $viewport.data

    return $viewport.data.slice(
      $selectionData.startOffset,
      $selectionData.originalEndOffset + 1
    )
  }
)

// derived readable boolean that indicates if the edited selection is applicable
export const applicable = derived(
  [
    requestable,
    viewport,
    editorSelection,
    displayRadix,
    editedDataSegment,
    selectionDataStore,
    selectionSize,
    editMode,
    editedByteIsOriginalByte,
    editorActionsAllowed,
    regularSizedFile,
  ],
  ([
    $requestable,
    $viewport,
    $editorSelection,
    $displayRadix,
    $selectedFileData,
    $selectionData,
    $selectionSize,
    $editMode,
    $editedByteIsOriginalByte,
    $editorActionsAllowed,
    $regularSizedFile,
  ]) => {
    if (!$regularSizedFile) {
      return $viewport.data.length !=
        $editorSelection.length / radixBytePad($displayRadix) &&
        $editorActionsAllowed === EditActionRestrictions.OverwriteOnly
        ? false
        : $requestable
    }
    if (
      !$requestable ||
      ($editedByteIsOriginalByte && $editMode === EditByteModes.Single)
    )
      return false
    const originalLength =
      $selectionData.originalEndOffset - $selectionData.startOffset
    const editedLength = $selectionData.endOffset - $selectionData.startOffset
    const editLengthHasDelta = originalLength !== editedLength

    if (
      $editorActionsAllowed === EditActionRestrictions.OverwriteOnly &&
      editLengthHasDelta
    )
      return false
    if (editLengthHasDelta) return true
    for (let i = 0; i < $selectionSize; i++) {
      if (
        $viewport.data[i + $selectionData.startOffset] !== $selectedFileData[i]
      )
        return true
    }

    return false
  }
)

// derived readable boolean that indicates if the seek offset input is valid
export const seekable = derived(
  [seekOffset, seekOffsetInput, viewport, addressRadix],
  ([$seekOffset, $seekOffsetInput, $viewport, $addressRadix]) => {
    if ($seekOffsetInput.length <= 0) return { valid: false, seekErrMsg: '' }
    if ($seekOffset > viewport.offsetMax)
      return { valid: false, seekErrMsg: 'Exceeds filesize' }
    if (!regexEditDataTest($seekOffsetInput, $addressRadix))
      return { valid: false, seekErrMsg: 'Invalid characters' }
    return { valid: true, seekErrMsg: '' }
  }
)

function typedArrayToBuffer(
  array: Uint8Array,
  startOffset: number,
  length: number
): ArrayBuffer {
  startOffset += array.byteOffset
  return array.buffer.slice(
    startOffset,
    startOffset + Math.min(array.byteLength, length)
  )
}

export const dataView = derived(
  [selectionDataStore, viewport],
  ([$selectionData, $viewport]) => {
    return new DataView(
      typedArrayToBuffer($viewport.data, $selectionData.startOffset, 8)
    )
  }
)

function validRequestableData(
  data: string,
  viewport: string,
  encoding: string,
  editMode: string,
  radix: number
): ValidationResponse {
  switch (editMode) {
    case EditByteModes.Single:
      if (data.length === 0) return { valid: false, errMsg: '' }
      return viewport === 'physical'
        ? validateEncodingStr(data, radix, editMode)
        : validateEncodingStr(data, 'latin1', editMode)
    case EditByteModes.Multiple:
      return validateEncodingStr(data, encoding)
    default:
      return { valid: false, errMsg: 'illegal edit mode' }
  }
}

export const dvOffset = derived(
  [selectionDataStore, addressRadix, viewport],
  ([$selectionData, $addressRadix, $viewport]) => {
    return $selectionData.active
      ? ($viewport.fileOffset + $selectionData.startOffset).toString(
          $addressRadix
        )
      : ''
  }
)

export const dvLatin1 = derived(
  [selectionDataStore, dataView],
  ([$selectionData, $dataView]) => {
    return $selectionData.active && $dataView.byteLength >= 1
      ? String.fromCharCode($dataView.getUint8(0))
      : ''
  }
)

export const dvInt8 = derived(
  [selectionDataStore, dataView, displayRadix],
  ([$selectionData, $dataView, $displayRadix]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 1
        ? $dataView.getInt8(0).toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(8, '0') : value
  }
)

export const dvUint8 = derived(
  [selectionDataStore, dataView, displayRadix],
  ([$selectionData, $dataView, $displayRadix]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 1
        ? $dataView.getUint8(0).toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(8, '0') : value
  }
)

export const dvInt16 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 2
        ? $dataView
            .getInt16(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(16, '0') : value
  }
)

export const dvUint16 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 2
        ? $dataView
            .getUint16(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(16, '0') : value
  }
)

export const dvInt32 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 4
        ? $dataView
            .getInt32(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(32, '0') : value
  }
)

export const dvUint32 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 4
        ? $dataView
            .getUint32(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(32, '0') : value
  }
)

export const dvInt64 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 8
        ? $dataView
            .getBigInt64(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(64, '0') : value
  }
)

export const dvUint64 = derived(
  [selectionDataStore, dataView, displayRadix, dataViewEndianness],
  ([$selectionData, $dataView, $displayRadix, $dataViewEndianness]) => {
    const value =
      $selectionData.active && $dataView.byteLength >= 8
        ? $dataView
            .getBigUint64(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
        : ''
    return value && $displayRadix === 2 ? value.padStart(64, '0') : value
  }
)

function latin1Undefined(charCode: number): boolean {
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

function logicalDisplay(bytes: Uint8Array, bytesPerRow: number): string {
  let result = ''

  for (let i = 0, col = 0; i < bytes.length; ++i) {
    if (latin1Undefined(bytes[i])) {
      result += UNPRINTABLE_CHAR_STAND_IN
    } else {
      const char = String.fromCharCode(bytes[i])
      result += char === '\n' ? ' ' : char
    }

    if (++col === bytesPerRow) {
      col = 0
      if (i < bytes.length) {
        result += '\n'
      }
    } else {
      result += ' '
    }
  }

  return result
}

// derived readable string whose value is the logical display of the current viewport
export const viewportLogicalDisplayText = derived(
  [viewport, bytesPerRow],
  ([$viewport, $bytesPerRow]) => {
    return logicalDisplay($viewport.data, $bytesPerRow)
  }
)
