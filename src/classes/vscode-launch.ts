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

import { TDMLConfig } from './tdmlConfig'
import { DataEditorConfig } from './dataEditor'

export interface InfosetOutput {
  type: string
  file: string
}

export interface LoggingConfig {
  level: string
  file: string
}

export interface DFDLDebugger {
  logging: LoggingConfig
}

export interface VSCodeLaunchConfigArgs {
  name: string
  request: string
  type: string
  program: string | boolean
  data: string | boolean
  debugServer: number | boolean
  infosetFormat: string | null
  infosetOutput: InfosetOutput | null
  tdmlConfig: TDMLConfig | null
  dataEditorConfig: DataEditorConfig | null
  stopOnEntry: boolean
  useExistingServer: boolean
  trace: boolean
  openHexView: boolean
  openInfosetView: boolean
  openInfosetDiffView: boolean
  daffodilDebugClasspath: string
  dfdlDebugger: DFDLDebugger
}
