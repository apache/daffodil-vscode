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
    'xs:schema',
    'xs:element name',
    'xs:element ref',
    'xs:group name',
    'xs:group ref',
    'dfdl:assert',
    'dfdL:discriminator',
    'dfdl:hiddenGroupRef',
    'dfdl:format',
    'xs:annotation',
    'xs:appinfo',
    'xs:complexType',
    'xs:complexType name=',
    'xs:simpleType',
    'xs:simpleType name=',
    'xs:sequence',
    'xs:choice',
    'dfdl:defineVariable',
    'dfdl:setVariable',
  ]
  const expectedAttributeItems = [
    'dfdl:defineFormat',
    'dfdl:defineEscapeScheme',
    'type=',
    'minOccurs=',
    'maxOccurs=',
    'dfdl:occursCount=',
    'dfdl:byteOrder=',
    'dfdl:occursCountKind=',
    'dfdl:length=',
    'dfdl:lengthKind=',
    'dfdl:encoding=',
    'dfdl:alignment=',
    'dfdl:lengthUnits=',
    'dfdl:lengthPattern=',
    'dfdl:inputValueCalc=',
    'dfdl:outputValueCalc=',
    'dfdl:alignmentUnits=',
    'dfdl:terminator=',
    'dfdl:outputNewLine=',
    'dfdl:choiceBranchKey=',
    'dfdl:representation',
    'dfdl:hiddenGroupRef=',
    'dfdl:sequenceKind=',
    'dfdl:separator=',
    'dfdl:separatorPosition=',
    'dfdl:separatorSuppressionPolicy',
    'dfdl:choiceLengthKind=',
    'dfdl:choiceLength=',
    'dfdl:initiatedContent=',
    'dfdl:choiceDispatchKey=',
    'dfdl:simpleType',
    'xs:restriction',
  ]

  test('all commonItems available', async () => {
    let itemNames: string[] = []
    commonCompletion('', 'xs:').items.forEach((r) => itemNames.push(r.item))
    assert.strictEqual(itemNames.includes('type='), true)
  })

  test('all elementItems available', async () => {
    elementCompletion('', '', 'xs:').items.forEach((item) => {
      assert.strictEqual(expectedElementItems.includes(item.item), true)
    })
  })

  test('all attributeItems available', async () => {
    attributeCompletion('', 'xs:').items.forEach((item) => {
      assert.strictEqual(expectedAttributeItems.includes(item.item), true)
    })
  })
})
