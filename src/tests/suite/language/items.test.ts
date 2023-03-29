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

import * as assert from 'assert'
import { attributeCompletion } from '../../../language/providers/intellisense/attributeItems'
import { commonCompletion } from '../../../language/providers/intellisense/commonItems'
import { elementCompletion } from '../../../language/providers/intellisense/elementItems'

suite('Items Test Suite', () => {
  const expectedElementItems = [
    'xml version',
    'schema',
    'element name',
    'element ref',
    'group name',
    'group ref',
    'dfdl:assert',
    'dfdl:discriminator',
    'dfdl:hiddenGroupRef',
    'dfdl:format',
    'annotation',
    'appinfo',
    'complexType',
    'complexType name=',
    'simpleType',
    'simpleType name=',
    'sequence',
    'choice',
    'dfdl:defineVariable',
    'dfdl:setVariable',
    'dfdl:defineFormat',
    'dfdl:defineEscapeScheme',
    'dfdl:simpleType',
    'dfdl:element',
    'restriction',
    'minInclusive',
    'minExclusive',
    'maxInclusive',
    'maxExclusive',
  ]
  const expectedAttributeItems = [
    'name',
    'ref',
    'minOccurs',
    'maxOccurs',
    'dfdl:occursCount',
    'dfdl:byteOrder',
    'dfdl:bitOrder',
    'dfdl:occursCountKind',
    'dfdl:length',
    'dfdl:lengthKind',
    'dfdl:prefixIncludesPrefixLength',
    'dfdl:prefixLengthType',
    'dfdl:utf16Width',
    'dfdl:encoding',
    'dfdl:encodingErrorPolicy',
    'dfdl:nilKind',
    'dfdl:nilValue',
    'dfdl:nilValueDelimiterPolicy',
    'dfdl:alignment',
    'dfdl:lengthUnits',
    'dfdl:lengthPattern',
    'dfdl:inputValueCalc',
    'dfdl:outputValueCalc',
    'dfdl:alignmentUnits',
    'dfdl:outputNewLine',
    'dfdl:choiceBranchKey',
    'dfdl:representation',
    'dfdl:textStringJustification',
    'dfdl:textStandardZeroRep',
    'dfdl:textStandardInfinityRep',
    'dfdl:textStandardExponentRep',
    'dfdl:textStandardNaNRep',
    'dfdl:textNumberPattern',
    'dfdl:textNumberRep',
    'dfdl:textNumberRoundingMode',
    'dfdl:textNumberRoundingIncrement',
    'dfdl:textNumberRounding',
    'dfdl:textNumberCheckPolicy',
    'dfdl:textOutputMinLength',
    'dfdl:textStandardGroupingSeparator',
    'dfdl:textPadKind',
    'dfdl:textStandardBase',
    'dfdl:textTrimKind',
    'dfdl:leadingSkip',
    'dfdl:trailingSkip',
    'dfdl:truncateSpecifiedLengthString',
    'dfdl:sequenceKind',
    'dfdl:separator',
    'dfdl:separatorPosition',
    'dfdl:separatorSuppressionPolicy',
    'dfdl:terminator',
    'dfdl:textBidi',
    'dfdl:hiddenGroupRef',
    'dfdl:choiceLengthKind',
    'dfdl:choiceLength',
    'dfdl:fillByte',
    'dfdl:ignoreCase',
    'dfdl:initiatedContent',
    'dfdl:initiator',
    'dfdl:choiceDispatchKey',
    'dfdl:binaryNumberRep',
    'dfdl:floating',
    'dfdl:binaryFloatRep',
    'dfdl:calendarPatternKind',
    'dfdl:documentFinalTerminatorCanBeMissing',
    'dfdl:emptyValueDelimiterPolicy',
    'dfdl:escapeSchemeRef',
    'testKind',
    'test',
    'testPattern',
    'message',
    'failureType',
  ]

  test('all commonItems available', async () => {
    let itemNames: string[] = []
    commonCompletion('', 'xs:').items.forEach((r) => itemNames.push(r.item))
    assert.strictEqual(itemNames.includes('type'), true)
  })

  test('all elementItems available', async () => {
    elementCompletion('', '', '').items.forEach((item) => {
      assert.strictEqual(expectedElementItems.includes(item.item), true)
    })
  })

  test('all attributeItems available', async () => {
    attributeCompletion('', '', 'dfdl:').items.forEach((item) => {
      assert.strictEqual(expectedAttributeItems.includes(item.item), true)
    })
  })
})
