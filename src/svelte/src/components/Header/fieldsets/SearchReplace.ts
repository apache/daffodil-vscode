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

import { SimpleWritable } from '../../../stores/localStore'
import { addressRadix, seekOffsetInput } from '../../../stores'
import { get } from 'svelte/store'
import { validateEncodingStr } from '../../../utilities/display'
import { ErrorStore, ErrorComponentType } from '../../Error/Error'
import { editorEncoding, selectionDataStore } from '../../../stores'
import { derived } from 'svelte/store'

interface QueryableData {
  input: string
  processing: boolean
  isValid: boolean
}
class SearchData implements QueryableData {
  input: string = ''
  processing: boolean = false
  isValid: boolean = false
  searchIndex: number = 0
  searchResults: Array<number> = []
  overflow: boolean = false
  byteLength: number = 0
}
class SearchQuery extends SimpleWritable<SearchData> {
  protected init(): SearchData {
    return new SearchData()
  }
  public clear() {
    this.update((query) => {
      query.processing = false
      query.searchIndex = 0
      query.searchResults = []
      return query
    })
  }
  public updateSearchResults(offset?: number) {
    this.update((query) => {
      query.searchIndex = !offset
        ? Math.abs(
            (query.searchResults.length + query.searchIndex) %
              query.searchResults.length
          )
        : Math.abs(
            (query.searchResults.length + offset) % query.searchResults.length
          )

      seekOffsetInput.update((_) => {
        return query.searchResults[query.searchIndex].toString(
          get(addressRadix)
        )
      })
      return query
    })
  }
}

class ReplaceData implements QueryableData {
  input: string = ''
  processing: boolean = false
  isValid: boolean = false
}
export class ReplaceQuery extends SimpleWritable<ReplaceData> {
  protected init(): ReplaceData {
    return new ReplaceData()
  }
}

export const searchQuery = new SearchQuery()
export const replaceQuery = new ReplaceQuery()

export const searchErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const replaceErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const seekErr = new ErrorStore(ErrorComponentType.SYMBOL)

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
