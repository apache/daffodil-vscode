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

import { SelectionData_t, searchResultsUpdated } from '../stores'
import { VIEWPORT_CAPACITY_MAX } from '../stores/configuration'
import { SimpleWritable } from '../stores/localStore'
import type {
  DataReplacement,
  ReplaceData,
  SearchData,
} from '../components/Header/fieldsets/SearchReplace'
import { ViewportByteCategories } from './ByteCategories/CategoryIndications'

class ViewportByteIndications extends SimpleWritable<Uint8Array> {
  protected init(): Uint8Array {
    return new Uint8Array(VIEWPORT_CAPACITY_MAX).fill(0)
  }
  public clearIndication(indicationName: string) {
    this.store.update((indications) => {
      ViewportByteCategories.clearIndication(indications, indicationName)
      return indications
    })
  }
  public updateSearchIndications(
    searchQuery: SearchData,
    viewportFileOffset: number
  ) {
    if (searchQuery.searchResults.length > 0) {
      const resultsIterable =
        searchQuery.iterableDataFromOffset(viewportFileOffset)
      const { data } = resultsIterable
      const start = data[0]
      const byteLength = searchQuery.byteLength

      this.store.update((indications) => {
        ViewportByteCategories.clearAndSetIf(
          indications,
          'searchresult',
          (_, i) => {
            const adjustIndex = i + viewportFileOffset
            return adjustIndex >= start && adjustIndex < start + byteLength
          }
        )
        searchResultsUpdated.set(true)
        return indications
      })
    }
  }

  public updateReplaceIndications(
    replaceData: ReplaceData,
    viewportFileOffset: number
  ) {
    const resultsIterable =
      replaceData.iterableDataFromOffset(viewportFileOffset)

    if (resultsIterable.data.length > 0) {
      const { offset, byteLength } = resultsIterable.data[0] as DataReplacement
      this.store.update((indications) => {
        ViewportByteCategories.clearAndSetIf(
          indications,
          'replacement',
          (_, i) => {
            const adjustIndex = i + viewportFileOffset
            return adjustIndex >= offset && adjustIndex < offset + byteLength
          }
        )
        return indications
      })
    }
  }

  public updateSelectionIndications(selectionData: SelectionData_t) {
    const category1 = ViewportByteCategories.category('one')
    const start = selectionData.startOffset
    const editedEnd = selectionData.endOffset + 1
    const originalEnd = selectionData.originalEndOffset

    if (!selectionData.makingSelection() && !selectionData.active) {
      this.store.update((indications) => {
        ViewportByteCategories.clearIndication(indications, 'selected')
        return indications
      })
    }
    if (selectionData.active || selectionData.makingSelection()) {
      const offsetPartitions = [
        generateSelectionCategoryParition(0, start, (byte) => {
          byte[0] &= ~category1.indexOf('selected')
        }),
        generateSelectionCategoryParition(start, editedEnd, (byte) => {
          byte[0] |= category1.indexOf('selected')
        }),
        generateSelectionCategoryParition(
          Math.max(originalEnd, editedEnd),
          VIEWPORT_CAPACITY_MAX,
          (byte) => {
            byte[0] &= ~category1.indexOf('selected')
          }
        ),
      ]
      this.store.update((indications) => {
        for (const partition of offsetPartitions) {
          for (let i = partition.start; i < partition.end; i++)
            partition.assignByte(indications.subarray(i, i + 1))
        }
        return indications
      })
    }
  }

  public updateDebuggerPosIndication(bytePos: number, fileOffset: number) {
    this.store.update((indications) => {
      ViewportByteCategories.clearAndSetIf(indications, 'bytePos1b', (_, i) => {
        return i + fileOffset === bytePos
      })
      return indications
    })
  }
}

export const viewportByteIndicators = new ViewportByteIndications()

type CategoryOffsetParition = {
  start: number
  end: number
  assignByte: (byte: Uint8Array) => void
}
function generateSelectionCategoryParition(
  start: number,
  end: number,
  assignmentFn: (byte: Uint8Array) => void
): CategoryOffsetParition {
  return {
    start,
    end,
    assignByte: assignmentFn,
  }
}

export function categoryCSSSelectors(byteIndicationValue: number): string {
  let ret = ''
  ViewportByteCategories.categoryList().forEach((category) => {
    const categorysCSSSelector = ViewportByteCategories.categoryCSSSelector(
      category,
      byteIndicationValue
    )
    if (categorysCSSSelector != 'none') ret += categorysCSSSelector + ' '
  })

  return ret
}
