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

import { expect } from 'chai'
import { attributeCompletion } from '../../../language/providers/intellisense/attributeItems'
import { commonCompletion } from '../../../language/providers/intellisense/commonItems'
import { elementCompletion } from '../../../language/providers/intellisense/elementItems'

describe('Items Test Suite', () => {
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

  it('all commonItems available', async (done) => {
    let itemNames: string[] = []
    commonCompletion('', 'xs:').items.forEach((r) => itemNames.push(r.item))
    expect(itemNames).to.include('type=')
    done()
  })

  it('all elementItems available', async (done) => {
    elementCompletion('', '', 'xs:').items.forEach((item) => {
      expect(expectedElementItems).to.include(item.item)
    })
    done()
  })

  it('all attributeItems available', async (done) => {
    attributeCompletion('', 'xs:').items.forEach((item) => {
      expect(expectedAttributeItems).to.include(item.item)
    })
    done()
  })
})
