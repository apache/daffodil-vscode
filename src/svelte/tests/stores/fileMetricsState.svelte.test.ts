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

import { describe, it, expect } from 'vitest'
import {
  canRedo,
  canRevert,
  canUndo,
  fileMetricsState,
  isRegularSizedFile,
  saveable,
} from '../../src/components/Header/fieldsets/FileMetrics.svelte.ts'

describe('FileMetricsState Runes', () => {
  describe('regularSizedFile', () => {
    it('should report boolean value derived from computedSize', () => {
      ;[
        { size: 1024, expect: true },
        { size: 1, expect: false },
      ].forEach((testValues) => {
        fileMetricsState.computedSize = testValues.size
        expect(isRegularSizedFile()).toBe(testValues.expect)
      })
    })
  })
  describe('saveable', () => {
    it('should report boolean value derived from changeCount', () => {
      ;[
        { count: 2, expect: true },
        { count: 0, expect: false },
      ].forEach((testValues) => {
        fileMetricsState.changeCount = testValues.count
        expect(saveable()).toBe(testValues.expect)
      })
    })
  })
  describe('canUndo', () => {
    it('should report boolean value derived from changeCount', () => {
      ;[
        { count: 2, expect: true },
        { count: 0, expect: false },
      ].forEach((testValues) => {
        fileMetricsState.changeCount = testValues.count
        expect(canUndo()).toBe(testValues.expect)
      })
    })
  })
  describe('canRedo', () => {
    it('should report boolean value derived from undoCount', () => {
      ;[
        { count: 2, expect: true },
        { count: 0, expect: false },
      ].forEach((testValues) => {
        fileMetricsState.undoCount = testValues.count
        expect(canRedo()).toEqual(testValues.expect)
      })
    })
  })
  describe('canRevert', () => {
    it('should report boolean value derived from non zero change counts', () => {
      ;[
        { count: { undo: 1, change: 1 }, expect: true },
        { count: { undo: 0, change: 1 }, expect: true },
        { count: { undo: 1, change: 0 }, expect: true },
        { count: { undo: 0, change: 0 }, expect: false },
      ].forEach((testValues) => {
        fileMetricsState.undoCount = testValues.count.undo
        fileMetricsState.changeCount = testValues.count.change
        expect(canRevert()).toBe(testValues.expect)
      })
    })
  })
})
