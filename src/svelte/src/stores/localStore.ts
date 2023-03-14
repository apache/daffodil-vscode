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

import { writable } from 'svelte/store'

// receives the key of the local storage and an initial value
export const localStore = (key: string, initial: any) => {
  // local helper function
  const toString = (value: any) => JSON.stringify(value, null, 2)

  if (localStorage.getItem(key) === null) {
    // item not present in local storage, initialize local storage with initial value
    localStorage.setItem(key, toString(initial))
  }

  // convert to object
  const saved = JSON.parse(localStorage.getItem(key))
  // create the underlying writable store
  const { subscribe, set, update } = writable(saved)

  return {
    subscribe,
    set: (value: any) => {
      localStorage.setItem(key, toString(value)) // save to local storage as a string
      return set(value)
    },
    update,
  }
}
