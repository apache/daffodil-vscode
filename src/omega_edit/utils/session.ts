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

import * as vscode from 'vscode'
import { client } from './settings'
import {
  CreateSessionRequest,
  ObjectId,
  SaveSessionRequest,
} from 'omega-edit/omega_edit_pb'

export function createSession(path: string | undefined): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let request = new CreateSessionRequest()
    if (path) request.setFilePath(path)
    client.createSession(request, (err, r) => {
      if (err) {
        console.log(err.message)
        return reject('createSession error: ' + err.message)
      }

      let id = r?.getSessionId()
      if (!id) {
        return reject('undefined version')
      }

      return resolve(id)
    })
  })
}

export function deleteSession(id: string): Promise<ObjectId> {
  return new Promise<ObjectId>((resolve, reject) => {
    client.destroySession(new ObjectId().setId(id), (err, r) => {
      if (err) {
        return reject('deleteSession error: ' + err.message)
      }

      return resolve(r)
    })
  })
}

export function saveSession(
  sessionId: string,
  filePath: string,
  overwrite: boolean
) {
  return new Promise<string>((resolve, reject) => {
    let saveSessionReq = new SaveSessionRequest()
    saveSessionReq.setSessionId(sessionId)
    saveSessionReq.setFilePath(filePath)
    saveSessionReq.setAllowOverwrite(overwrite)

    client.saveSession(saveSessionReq, (err, r) => {
      if (err) {
        vscode.window.showInformationMessage(
          'saveSession error: ' + err.message
        )
        return reject('saveSession error: ' + err.message)
      }

      return resolve(r.getFilePath())
    })
  })
}
