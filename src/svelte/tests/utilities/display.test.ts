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
import { radixBytePad, radixToString } from '../../src/utilities/display'
import { RadixValues } from '../../src/stores/configuration'
import assert from 'assert'

describe('Display Functions', () => {
  describe('radixBytePad', () => {
    it('should return the appropriate text length per radix value given', () => {
      ;[
        { radix: 2, pad: 8 },
        { radix: 8, pad: 3 },
        { radix: 10, pad: 3 },
        { radix: 16, pad: 2 },
      ].forEach((assertionPair) => {
        assert.equal(
          radixBytePad(assertionPair.radix as RadixValues),
          assertionPair.pad
        )
      })
    })
  })

  describe('radixToString', () => {
    it('should return the correct radix index string from RadixValue', () => {
      ;[
        { radix: 2, str: 'bin' },
        { radix: 8, str: 'oct' },
        { radix: 10, str: 'dec' },
        { radix: 16, str: 'hex' },
      ].forEach((assertionPair) => {
        assert.equal(
          radixToString(assertionPair.radix as RadixValues),
          assertionPair.str
        )
      })
    })
  })
})
