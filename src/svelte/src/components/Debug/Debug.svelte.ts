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
import { getContext, setContext } from 'svelte'

export interface DebugVariable {
  id: string
  valueStr: () => string
}

let debugVars = $state<DebugVariable[]>([])
export const addVarToDebug = (...vars: DebugVariable[]) => {
  debugVars.push(...vars)
}

export function setDebugVarContext() {
  setContext('debug-vars', {
    add: addVarToDebug,
    get: () => debugVars,
    remove: (dvar: DebugVariable) => {
      debugVars = debugVars.filter((item) => {
        const matched = item.id === dvar.id
        if (!matched) return dvar
        console.log('Removing dvar: ', dvar.id)
      })
    },
  })
  return getDebugVarContext()
}
export type DebugVarsContextType = {
  add: typeof addVarToDebug
  get: () => typeof debugVars
  remove: (dvar: DebugVariable) => void
}
export function getDebugVarContext() {
  return getContext('debug-vars') as DebugVarsContextType
}
