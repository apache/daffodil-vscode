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

import { LIB_VERSION } from '../version'
import * as os from 'os'

export class Backend {
  constructor(readonly owner: string, readonly repo: string) {}
}

export class Artifact {
  name: string
  archive: string
  scriptName: string

  constructor(
    readonly type: string,
    readonly version: string,
    readonly baseScriptName
  ) {
    this.name = type.includes('daffodil')
      ? `${type}-${this.version}-${LIB_VERSION}`
      : `${type}-${this.version}`
    this.archive = `${this.name}.zip`
    this.scriptName =
      os.platform() === 'win32'
        ? `${baseScriptName}.bat`
        : `./${baseScriptName}`
  }

  archiveUrl = (backend: Backend) => {
    if (this.type === 'omega-edit') {
      return `https://github.com/${backend.owner}/${backend.repo}/releases/download/v${this.version}/${this.archive}`
    } else {
      return ''
    }
  }

  getOsFolder() {
    if (os.platform().toLowerCase().startsWith('win')) {
      return 'windows'
    } else if (os.platform().toLowerCase().startsWith('darwin')) {
      return 'macos'
    } else {
      return 'linux'
    }
  }
}
