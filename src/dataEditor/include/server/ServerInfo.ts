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

import * as editor_config from '../../config'
import * as fs from 'fs'
import assert from 'assert'
import { IServerInfo, getSessionCount } from '@omega-edit/client'

export class ServerInfo implements IServerInfo {
  serverHostname: string = 'unknown'
  serverProcessId: number = 0
  serverVersion: string = 'unknown'
  jvmVersion: string = 'unknown'
  jvmVendor: string = 'unknown'
  jvmPath: string = 'unknown'
  availableProcessors: number = 0
}

const OMEGA_EDIT_MAX_PORT: number = 65535
const OMEGA_EDIT_MIN_PORT: number = 1024
export function configureOmegaEditPort(configVars: editor_config.Config): void {
  let omegaEditPort = configVars.port
  if (omegaEditPort === 0) {
    if (
      omegaEditPort <= OMEGA_EDIT_MIN_PORT ||
      omegaEditPort > OMEGA_EDIT_MAX_PORT
    ) {
      const message = `Invalid port ${omegaEditPort} for Ωedit. Use a port between ${OMEGA_EDIT_MIN_PORT} and ${OMEGA_EDIT_MAX_PORT}`
      omegaEditPort = 0
      throw new Error(message)
    }
    if (!fs.existsSync(configVars.checkpointPath)) {
      fs.mkdirSync(configVars.checkpointPath, { recursive: true })
    }
    assert(
      fs.existsSync(configVars.checkpointPath),
      'checkpoint path does not exist'
    )
    assert(omegaEditPort !== 0, 'omegaEditPort is not set')
  }
}
export type ServerStopPredicate = (context?: any) => Promise<boolean>
export const NoSessionsExist: ServerStopPredicate = (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const count = await getSessionCount()
    resolve(count === 0)
  })
}
