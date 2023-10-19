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

import { CategoryOne, type ByteCategory, CategoryTwo } from './IByteCategory'

class ByteIndicationCategories {
  private _categories: {
    [key: string]: ByteCategory
  } = {}
  private _bitsUtilized: number = 0

  public addIndicationCategory(category: ByteCategory) {
    if (this._bitsUtilized + category.bitLength() > 8)
      throw new Error('Category addition would exceed bit limit')
    this._categories[category.name()] = category
    this._bitsUtilized += category.bitLength()

    return this
  }
  public category(name: string): ByteCategory {
    return this._categories[name]
  }
  public categoryOfIndication(indicationName: string): ByteCategory {
    for (const category in this._categories)
      if (this._categories[category].contains(indicationName))
        return this._categories[category]

    throw new Error(
      `No ByteCategory found with ByteIndication named ${indicationName}`
    )
  }
  public categoryValueByIndication(
    category: ByteCategory,
    indicationName: string
  ): number {
    return category.indexOf(indicationName) << this.categoryBitPos(category)
  }
  public clearIndication(data: Uint8Array, indicationName: string) {
    const category = this.categoryOfIndication(indicationName)
    data.forEach((byte, i, data) => {
      const categoryValueOfByte = byte & this.categoryMask(category)
      if (
        categoryValueOfByte ===
        this.categoryValueByIndication(category, indicationName)
      )
        data[i] &= this.categoryMask(category) ^ 0xff
    })
  }
  public clearAndSetIf(
    data: Uint8Array,
    indication: string,
    predicate: (byte: number, index: number) => boolean
  ) {
    const category = this.categoryOfIndication(indication)
    if (!category) {
      console.error(`No ByteCategory contains the indication: ${indication}`)
      return
    }

    data.forEach((byte, i, data) => {
      data[i] &= this.categoryMask(category) ^ 0xff
      if (predicate(byte, i))
        data[i] |= this.categoryValueByIndication(category, indication)
    })
  }
  public categoryCSSSelector(
    category: ByteCategory,
    byteIndicationValue: number
  ) {
    const maskedByteValue = byteIndicationValue & this.categoryMask(category)
    const indicationIndex = maskedByteValue >> this.categoryBitPos(category)
    const indication = category.indicators()[indicationIndex]
    return indication != undefined
      ? indication.selector()
      : category.indexOf('none')
  }
  private categoryMask(category: ByteCategory): number {
    const categoryBitPos = this.categoryBitPos(category)
    const categoryBitLength = category.bitLength()
    return (Math.pow(2, categoryBitLength) - 1) << categoryBitPos
  }
  private indexOf(category: ByteCategory) {
    let i = 0
    for (let _category in this._categories) {
      if (category.name() === this._categories[_category].name()) {
        return i
      }
      i++
    }
    return -1
  }
  private categoryBitPos(category: ByteCategory): number {
    return this.indexOf(category) * category.bitLength()
  }
}

export const ViewportByteCategories = new ByteIndicationCategories()
ViewportByteCategories.addIndicationCategory(CategoryOne).addIndicationCategory(
  CategoryTwo
)
