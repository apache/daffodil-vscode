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
import { InfosetOutput } from '../daffodilDebugger'
import { DFDLDebugger } from './dfdlDebugger'
import { SchemaData } from './schemaData'

export interface VSCodeLaunchConfigArgs {
  name: string
  request: string
  type: string
  schema: SchemaData
  data: string | boolean
  debugServer: number | boolean
  infosetFormat: string | null
  infosetOutput: InfosetOutput | null
  tdmlConfig: TDMLConfig | null
  dataEditor: DataEditorConfig | null
  stopOnEntry: boolean
  useExistingServer: boolean
  trace: boolean
  openDataEditor: boolean
  openInfosetView: boolean
  openInfosetDiffView: boolean
  daffodilDebugClasspath: Array<string>
  dfdlDebugger: DFDLDebugger
}
