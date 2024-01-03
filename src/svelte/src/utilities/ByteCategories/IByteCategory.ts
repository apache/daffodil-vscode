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

import {
  NoIndication,
  type IByteIndication,
  ByteIndication,
} from './IIndication'

export interface IByteCategory {
  addIndication(selectorName: string): void
  bitLength(): number
  name(): string
  indicators(): readonly IByteIndication[]
  at(index: number): IByteIndication
  indexOf(selectorName: string): number
  contains(selectorName: string): boolean
}

export class ByteCategory implements IByteCategory {
  private _indicators: IByteIndication[] = [NoIndication]

  constructor(
    private _name: string,
    private _bitLength: number
  ) {
    if (_bitLength > 8)
      throw new Error('Byte category indications cannot exceed 8 bits.')
  }
  addIndication(selectorName: string) {
    this._indicators.push(new ByteIndication(selectorName))
    return this
  }
  bitLength() {
    return this._bitLength
  }
  name() {
    return this._name
  }
  indicators() {
    return this._indicators
  }
  at(index: number) {
    return index >= this._indicators.length || index < 0
      ? this._indicators[0]
      : this._indicators[index]
  }
  indexOf(selectorName: string) {
    const target = selectorName.toLowerCase()
    let ret = -1

    this._indicators.forEach((categoryObj, i) => {
      if (categoryObj.selector() === target) ret = i
    })
    if (ret < 0)
      throw new Error(`Indication category "${selectorName}" not found.`)
    else return ret
  }
  contains(selectorName: string): boolean {
    for (let i = 0; i < this._indicators.length; i++)
      if (this._indicators[i].selector() == selectorName.toLowerCase())
        return true
    return false
  }
}

export const CategoryOne = new ByteCategory('one', 2)
CategoryOne.addIndication('selected')

export const CategoryTwo = new ByteCategory('two', 2)
CategoryTwo.addIndication('searchresult').addIndication('replacement')

export const DebuggerCategory = new ByteCategory('debugger', 2)
DebuggerCategory.addIndication('bytePos1b')
