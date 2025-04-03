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

import * as fs from 'fs'
import { parse as jsoncParse } from 'jsonc-parser'
import { DebugSession, DebugSessionCustomEvent, debug } from 'vscode'
import { SchemaData } from '../classes/schemaData'

export const dataEvent = 'daffodil.data'
export interface DaffodilData {
  bytePos1b: number
}

export const dataLeftOverEvent = 'daffodil.dataLeftOver'
export interface DaffodilDataLeftOver {
  bitPos1b: number
  bytePos1b: number
  leftOverBits: number
  message: string
}

export const parseErrorEvent = 'daffodil.parseError'
export interface DaffodilParseError {
  message: string
}

export const infosetEvent = 'daffodil.infoset'
export interface InfosetEvent {
  content: string

  /** Default to returning the full infoset XML, but enable other encodings like diffs in the future. */
  mimeType: 'text/xml' | string
}

export const configEvent = 'daffodil.config'
export interface ConfigEvent {
  launchArgs: LaunchArgs
  buildInfo: BuildInfo
}

export interface LaunchArgs {
  schema: SchemaData
  dataPath: string
  stopOnEntry: boolean
  infosetFormat: string
  infosetOutput: InfosetOutput
}

export interface InfosetOutput {
  type: string
  path: string
}

export interface BuildInfo {
  version: string
  daffodilVersion: string
  scalaVersion: string
}

export function getDaffodilVersion(filePath: fs.PathLike) {
  return jsoncParse(fs.readFileSync(filePath).toString())['daffodilVersion']
}

export interface IDaffodilEvent {
  readonly type: DaffodilEventType
  readonly body: DaffodilDataType
}

export type DaffodilEventType =
  | 'daffodil.data'
  | 'daffodil.dataLeftOver'
  | 'daffodil.parseError'
  | 'daffodil.infoset'
  | 'daffodil.config'
export type DaffodilEventData = { command: string; data: any }
export type DaffodilDataType =
  | DaffodilData
  | DaffodilDataLeftOver
  | DaffodilParseError
  | InfosetEvent
  | ConfigEvent
export type DaffodilDataTypeMap = {
  'daffodil.data': DaffodilData
  'daffodil.dataLeftOver': DaffodilDataLeftOver
  'daffodil.parseError': DaffodilParseError
  'daffodil.infoset': InfosetEvent
  'daffodil.config': ConfigEvent
}

export class DaffodilDebugEvent<
  E extends DaffodilEventType,
  B extends DaffodilDataTypeMap[E],
> implements DebugSessionCustomEvent
{
  readonly session: DebugSession

  constructor(
    readonly event: E,
    readonly body: B
  ) {
    this.session = debug.activeDebugSession!
  }

  asObject(): DaffodilEventData {
    return {
      command: this.event,
      data: this.body,
    }
  }
}

export function extractDaffodilEvent<
  E extends DaffodilEventType,
  B extends DaffodilDataTypeMap[E],
>(e: DebugSessionCustomEvent): DaffodilDebugEvent<E, B> | undefined {
  if (e.session.type !== 'dfdl') return undefined
  const eventType = e.event as E
  const body = e.body as B
  return new DaffodilDebugEvent(eventType, body)
}

export function extractDaffodilData<E extends DaffodilEventType>(message: {
  command: string
  data: any
}): DaffodilDataTypeMap[E] {
  return message.data as DaffodilDataTypeMap[E]
}
