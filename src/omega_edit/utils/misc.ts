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

import { randomId } from './settings'
import * as vscode from 'vscode'

export async function getFilePath(
  sessionFile: string,
  overwrite: boolean,
  newFile: boolean
): Promise<string | undefined> {
  // Get file path for saved file
  let filePath: string | undefined

  if (overwrite) {
    filePath = sessionFile
  } else if (newFile) {
    let fileName = sessionFile.split('/')[sessionFile.split('/').length - 1]
    let path = sessionFile.replace(`/${fileName}`, '')
    let fileNameStart = fileName
      .split('.')
      .slice(0, fileName.split('.').length - 1)
      .join('')
    let fileNameEnd = fileName.split('.')[fileName.split('.').length - 1]
    filePath = `${path}/${fileNameStart}-${randomId().toString()}.${fileNameEnd}`
  } else {
    filePath = await vscode.window.showInputBox({
      placeHolder: 'Save session as:',
    })
  }

  return filePath
}
