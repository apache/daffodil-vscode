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

import { derived, readable, writable } from 'svelte/store'
import { selectionDataStore } from '../stores'

let selectionHighlightLUT = new Uint8Array(1024)
export let selectionHighlightMask = writable(0)

let searchResultsHighlightLUT = new Uint8Array(1024).fill(0)

export enum HightlightCategoryMasks {
  None = 0,
  ActiveSelection = 1,
  ConsideredForSelection = 2,
  SearchResult = 4,
}

export const selectionHighlights = derived(
  [selectionDataStore, selectionHighlightMask],
  ([$selectionData, $selectionHighlightMask]) => {
    let start = $selectionData.startOffset
    let end =
      $selectionHighlightMask === 0
        ? $selectionData.originalEndOffset
        : $selectionData.endOffset
    if (start > end && end > -1) [start, end] = [end, start]

    for (let i = 0; i < 1024; i++) {
      selectionHighlightLUT[i] =
        i >= start && i <= end ? 1 << $selectionHighlightMask : 0
    }

    return selectionHighlightLUT
  }
)

export const searchResultsHighlights = readable(searchResultsHighlightLUT)
export const searchResultsUpdated = writable(false)
export function updateSearchResultsHighlights(
  data: number[],
  viewportFileOffset: number,
  byteWidth: number
) {
  const criteriaStart = data.findIndex((x) => x >= viewportFileOffset)
  const criteriaEnd = data.findIndex((x) => x >= viewportFileOffset + 1024)
  const searchCriteria = data.slice(
    criteriaStart,
    criteriaEnd >= 0 ? criteriaEnd : data.length
  )

  searchResultsHighlightLUT.fill(0)

  searchCriteria.forEach((offset) => {
    for (let i = 0; i < byteWidth; i++)
      searchResultsHighlightLUT[offset - viewportFileOffset + i] = 1
  })
  searchResultsUpdated.set(true)
}
export function clearSearchResultsHighlights() {
  searchResultsHighlightLUT.fill(0)
}
