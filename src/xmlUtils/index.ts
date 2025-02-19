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

import { XMLParser } from 'fast-xml-parser'

function getAttributeValues(
  tagName: string,
  attributeName: string,
  obj: any,
  fullRecurse: boolean
): string[] {
  var names: string[] = []

  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key === tagName) {
        // Handle both array and object cases for 'element'
        const elements = Array.isArray(obj[key]) ? obj[key] : [obj[key]]
        for (const el of elements) {
          if (el[`@_${attributeName}`]) {
            names.push(el[`@_${attributeName}`])
          }
        }
      }

      // If not wanting to do a full recurse of the XML, only do it when the current key
      // related to the schema.
      if (fullRecurse || (!fullRecurse && key.includes('schema'))) {
        names.push(
          ...getAttributeValues(tagName, attributeName, obj[key], fullRecurse)
        )
      }
    }
  }

  return names
}

export function queryXML(
  data: string,
  tagName: string,
  attributeName: string,
  fullRecurse: boolean
): string[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
  })

  return getAttributeValues(
    tagName,
    attributeName,
    parser.parse(data),
    fullRecurse
  )
}
