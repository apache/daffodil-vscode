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

export const dataEvent = 'daffodil.data'
export interface DaffodilData {
  bytePos1b: number
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
  schemaPath: string
  dataPath: string
  stopOnEntry: boolean
  infosetFormat: string
  infosetOutput: InfosetOutput
}

export interface InfosetOutput {
  type: string
}

export interface BuildInfo {
  version: string
  daffodilVersion: string
  scalaVersion: string
}

export function getDaffodilVersion(filePath: fs.PathLike) {
  return JSON.parse(fs.readFileSync(filePath).toString())['daffodilVersion']
}
