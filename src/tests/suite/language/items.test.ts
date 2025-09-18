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
    'element',
    'element name',
    'element ref',
    'group',
    'group name',
    'group ref',
    'dfdl:assert',
    'dfdl:discriminator',
    'dfdl:format',
    'annotation',
    'appinfo',
    'complexType',
    'complexType name',
    'simpleType',
    'simpleType name',
    'sequence',
    'choice',
    'dfdl:newVariableInstance',
    'dfdl:defineVariable',
    'dfdl:defineVariable name',
    'dfdl:setVariable',
    'dfdl:defineFormat',
    'dfdl:defineEscapeScheme',
    'dfdl:escapeScheme',
    'dfdl:simpleType',
    'dfdl:element',
    'dfdl:sequence',
    'dfdl:group',
    'dfdl:choice',
    'dfdl:property',
    'restriction',
    'minInclusive',
    'minExclusive',
    'maxInclusive',
    'maxExclusive',
    'pattern',
    'totalDigits',
    'fractionDigits',
    'enumeration',
    'include',
    'documentation',
    'import',
    '<[CDATA[]]>',
    '<![CDATA[]]>',
    '{}',
  ]
  const expectedAttributeItems = [
    'name',
    'ref',
    'default',
    'fixed',
    'minOccurs',
    'maxOccurs',
    'nillable',
    'dfdl:occursCount',
    'dfdl:byteOrder',
    'dfdl:bitOrder',
    'dfdl:occursCountKind',
    'dfdl:occursStopValue',
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
    'dfdl:useNilForDefault',
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
    'dfdl:textStringPadCharacter',
    'dfdl:textStandardZeroRep',
    'dfdl:textStandardInfinityRep',
    'dfdl:textStandardExponentRep',
    'dfdl:textStandardNaNRep',
    'dfdl:textNumberPattern',
    'dfdl:decimalSigned',
    'dfdl:textNumberRep',
    'dfdl:textNumberJustification',
    'dfdl:textNumberPadCharacter',
    'dfdl:textNumberRoundingMode',
    'dfdl:textNumberRoundingIncrement',
    'dfdl:textNumberRounding',
    'dfdl:textNumberCheckPolicy',
    'dfdl:textOutputMinLength',
    'dfdl:textStandardDecimalSeparator',
    'dfdl:textStandardGroupingSeparator',
    'dfdl:textPadKind',
    'dfdl:textStandardBase',
    'dfdl:textZonedSignStyle',
    'dfdl:textTrimKind',
    'dfdl:textBooleanTrueRep',
    'dfdl:textBooleanFalseRep',
    'dfdl:textBooleanJustification',
    'dfdl:textBooleanPadCharacter',
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
    'dfdl:binaryDecimalVirtualPoint',
    'dfdl:binaryPackedSignCodes',
    'dfdl:binaryNumberCheckPolicy',
    'dfdl:binaryBooleanTrueRep',
    'dfdl:binaryBooleanFalseRep',
    'dfdl:calendarPattern',
    'dfdl:calendarPatternKind',
    'dfdl:calendarCheckPolicy',
    'dfdl:calendarTimeZone',
    'dfdl:calendarObserveDST',
    'dfdl:calendarFirstDayOfWeek',
    'dfdl:calendarDaysInFirstWeek',
    'dfdl:calendarCenturyStart',
    'dfdl:calendarLanguage',
    'dfdl:textCalendarJustification',
    'dfdl:textCalendarPadCharacter',
    'dfdl:binaryCalendarRep',
    'dfdl:binaryCalendarEpoch',
    'dfdl:documentFinalTerminatorCanBeMissing',
    'dfdl:emptyValueDelimiterPolicy',
    'dfdl:emptyElementParsePolicy',
    'dfdl:escapeSchemeRef',
    'dfdl:escapeKind',
    'dfdl:escapeCharacter',
    'dfdl:escapeBlockStart',
    'dfdl:escapeBlockEnd',
    'dfdl:escapeEscapeCharacter',
    'dfdl:extraEscapedCharacters',
    'dfdl:generateEscapeBlock',
    'dfdl:escapeCharacterPolicy',
    'testKind',
    'test',
    'testPattern',
    'message',
    'failureType',
    'schemaLocation',
    'namespace',
  ]

  test('all commonItems available', async () => {
    let itemNames: string[] = []
    commonCompletion('').items.forEach((r) => itemNames.push(r.item))
    assert.strictEqual(itemNames.includes('type'), true)
  })

  test('all elementItems available', async () => {
    elementCompletion('', '').items.forEach((item) => {
      assert.strictEqual(expectedElementItems.includes(item.item), true)
    })
  })

  test('all attributeItems available', async () => {
    attributeCompletion('', '', 'dfdl:', '', '').items.forEach((item) => {
      assert.strictEqual(expectedAttributeItems.includes(item.item), true)
    })
  })
})
