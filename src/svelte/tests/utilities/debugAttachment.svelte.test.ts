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

import { afterEach, describe, expect, it, vi } from 'vitest'
import * as vscode from 'vscode'
import {
  getSvelteWebviewInitializer,
  startSvelteWebviewInitializer,
} from '../../../dataEditor/ui/svelteWebviewInitializer'
import { isUIDebugAttached } from 'stores/states.svelte'

vi.mock('vscode', () => ({
  debug: { activeDebugSession: undefined },
  window: {},
  ViewColumn: { Active: -1, Two: 2 },
}))

const debug = vscode.debug as unknown as {
  activeDebugSession:
    | { type: string; configuration: { data: string } }
    | undefined
}
startSvelteWebviewInitializer({} as vscode.ExtensionContext)
const initializer = getSvelteWebviewInitializer()
const dataFile = '/test/input data.bin'

afterEach(() => {
  debug.activeDebugSession = undefined
})

describe('Data editor debugger attachment', () => {
  it('enables the viewport bytePos1b listener for the DFDL input file', () => {
    debug.activeDebugSession = {
      type: 'dfdl',
      configuration: { data: dataFile },
    }
    const attributes = initializer.getAttributes(dataFile)

    expect(isUIDebugAttached(attributes.msgId)).toBe(true)
    expect(attributes.column).toBe(vscode.ViewColumn.Two)
    expect(attributes.title).toBe('input data.bin')
  })

  it.each([
    undefined,
    { type: 'dfdl', configuration: { data: '/test/other.bin' } },
    { type: 'other', configuration: { data: dataFile } },
  ])('does not attach an unrelated editor for session %j', (session) => {
    debug.activeDebugSession = session
    const attributes = initializer.getAttributes(dataFile)

    expect(isUIDebugAttached(attributes.msgId)).toBe(false)
    expect(attributes.column).toBe(vscode.ViewColumn.Active)
  })
})
