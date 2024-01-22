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
import {
  ServerPortKeyword,
  WorkspaceKeyword,
  configureIf,
} from './ConfigKeyword'
import { addToAppDataPath, rootPath } from './Extract'

const portDefault = 9000
const logFileDefault = addToAppDataPath('dataEditor-${omegaEditPort}.log')
const logLevelDefault = 'info'
const checkpointPathDefault = addToAppDataPath(`.checkpoint-${portDefault}`)

export type ConfigJSON = {
  port: number
  logging: {
    file: string
    level: string
  }
}
export interface IConfig {
  readonly port: number
  readonly logFile: string
  readonly logLevel: string
  readonly checkpointPath: string
}

export class Config implements IConfig {
  readonly port: number
  readonly logFile: string
  readonly logLevel: string
  readonly checkpointPath: string
  public static readonly Default: Config = new Config({
    port: portDefault,
    logFile: logFileDefault,
    logLevel: logLevelDefault,
    checkpointPath: checkpointPathDefault,
  })
  private constructor(configuration: Required<IConfig>) {
    const { port, logFile, logLevel, checkpointPath } = configuration
    this.port = port
    this.logFile = configureIf(logFile, [
      { keyword: WorkspaceKeyword, replacement: rootPath },
      { keyword: ServerPortKeyword, replacement: port.toString() },
    ])
    this.logLevel = logLevel
    this.checkpointPath = checkpointPath
  }
  static fromConfigJSON(json: ConfigJSON): IConfig {
    return new Config({
      port: json.port,
      logFile: json.logging.file,
      logLevel: json.logging.level,
      checkpointPath: checkpointPathDefault,
    })
  }
}
