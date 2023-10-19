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
import { replaceQuery, searchQuery } from '../../../stores'
import { VIEWPORT_CAPACITY_MAX } from '../../../stores/configuration'
import { viewportByteIndicators } from '../../../utilities/highlights'

export enum OffsetSearchType {
  ABSOLUTE,
  RELATIVE,
}

export type RelativeSeekSign = '+' | '-'

interface QueryableData {
  input: string
  processing: boolean
  initiaited: boolean
  iterableDataFromOffset(offset: number): IndexCriteria
}

export type IndexCriteria = {
  start: number
  end: number
  data: any[]
}
export class SearchData implements QueryableData {
  input: string = ''
  processing: boolean = false
  initiaited: boolean = false
  searchIndex: number = 0
  searchResults: Array<number> = []
  overflow: boolean = false
  byteLength: number = 0
  iterableDataFromOffset(offset: number): IndexCriteria {
    const start = this.searchResults.findIndex((x) => x >= offset)
    const end = this.searchResults.findIndex(
      (x) => x >= offset + VIEWPORT_CAPACITY_MAX
    )
    let ret: IndexCriteria = {
      start: start,
      end: end,
      data: this.searchResults.slice(
        start,
        end >= 0 ? end : this.searchResults.length
      ),
    }
    return ret
  }
}
export class SearchQuery extends SimpleWritable<SearchData> {
  protected init(): SearchData {
    return new SearchData()
  }
  public clear() {
    this.update((query) => {
      query.processing = false
      query.initiaited = false
      query.searchIndex = 0
      query.searchResults = []
      viewportByteIndicators.clearIndication('searchresult')
      return query
    })
  }
  public updateSearchResults(msgData: any) {
    this.update((query) => {
      query.initiaited = true
      query.searchResults = msgData.searchResults
      query.byteLength = msgData.searchDataBytesLength
      query.overflow = msgData.overflow
      return query
    })
  }
}

/**
Object that defines describes an instance of a replacement that occured during a Search & Replace query.
@param offset **File** offset of where the replacement occured.
@param byteLength Byte length of the replacement data.
*/
export type DataReplacement = {
  offset: number
  byteLength: number
}

export class ReplaceData implements QueryableData {
  input: string = ''
  processing: boolean = false
  initiaited: boolean = false
  results: Array<DataReplacement> = []
  iterableDataFromOffset(offset: number): IndexCriteria {
    const start = this.results.findIndex((x) => x.offset >= offset)
    const end = this.results.findIndex(
      (x) => x.offset >= offset + VIEWPORT_CAPACITY_MAX
    )
    const withinRange = start >= 0
    const data = withinRange
      ? this.results.slice(start, end >= 0 ? end : this.results.length)
      : []
    let ret: IndexCriteria = {
      start: start,
      end: end,
      data: data,
    }
    return ret
  }
}
export class ReplaceQuery extends SimpleWritable<ReplaceData> {
  protected init(): ReplaceData {
    return new ReplaceData()
  }
  public addResult(result: DataReplacement) {
    this.update((data) => {
      data.initiaited = true
      data.results.push(result)
      return data
    })
  }
  public pop() {
    this.update((data) => {
      data.results.pop()
      return data
    })
  }
  public clear() {
    this.update((data) => {
      data.processing = false
      data.results = []
      data.initiaited = false
      return data
    })
  }
}

export function clear_queryable_results() {
  searchQuery.clear()
  replaceQuery.clear()
}
