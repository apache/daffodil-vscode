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

import { describe, it } from 'mocha'
import { fileMetrics, regularSizedFile, saveable } from '../../src/stores/index'
import assert from 'assert'
import { get } from 'svelte/store'
import { FileMetricsData } from '../../src/components/Header/fieldsets/FileMetrics'

describe('Data Editor Stores ( Derived )', () => {
  describe('regularSizedFile', () => {
    const TruthySize = 1024
    const FalsySize = 1

    it('should return true on regular computed sized viewports', () => {
      fileMetrics.update((metrics) => {
        metrics.computedSize = TruthySize
        return metrics
      })
      assert.equal(get(regularSizedFile), true)
    })
    it('should return false on non-regular computed sized viewports', () => {
      fileMetrics.update((metrics) => {
        metrics.computedSize = FalsySize
        return metrics
      })
      assert.equal(get(regularSizedFile), false)
    })
    after(() => {
      fileMetrics.set(new FileMetricsData())
    })
  })

  describe('saveable', () => {
    it('should report boolean value derived from fileMetrics.changeCount', () => {
      ;[
        { count: 2, expect: true },
        { count: 0, expect: false },
      ].forEach((testValues) => {
        fileMetrics.update((metrics) => {
          metrics.changeCount = testValues.count
          return metrics
        })
        assert.equal(get(saveable), testValues.expect)
      })
    })
  })
})
