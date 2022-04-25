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
import * as hexy from 'hexy'
import { EditorClient } from 'omega-edit/omega_edit_grpc_pb'
import { Empty } from 'google-protobuf/google/protobuf/empty_pb'
import * as grpc from '@grpc/grpc-js'
import {
  CreateSessionRequest,
  CreateViewportRequest,
  ObjectId,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'

export const uri = '127.0.0.1:9000'
export const client = new EditorClient(uri, grpc.credentials.createInsecure())

export var randomId = () => Math.floor(Math.random() * (1000 - 0 + 1))

export function getVersion(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    client.getOmegaVersion(new Empty(), (err, v) => {
      if (err) {
        return reject('getVersion error: ' + err.message)
      }

      if (!v) {
        return reject('undefined version')
      }

      return resolve(`v${v.getMajor()}.${v.getMinor()}.${v.getPatch()}`)
    })
  })
}

export function newSession(path: string | undefined): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let request = new CreateSessionRequest()
    if (path) request.setFilePath(path)
    client.createSession(request, (err, r) => {
      if (err) {
        console.log(err.message)
        return reject('newSession error: ' + err.message)
      }

      let id = r?.getSessionId()
      if (!id) {
        return reject('undefined version')
      }

      return resolve(id)
    })
  })
}

export function newViewport(
  id: string,
  sid: string,
  offset: number,
  capacity: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let request = new CreateViewportRequest()
    request.setViewportIdDesired(id)
    request.setSessionId(sid)
    request.setOffset(offset)
    request.setCapacity(capacity)
    client.createViewport(request, (err, r) => {
      if (err) {
        console.log(err.message)
        return reject('newViewport error: ' + err.message)
      }

      let id = r?.getViewportId()
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

export function deleteViewport(id: string): Promise<ObjectId> {
  return new Promise<ObjectId>((resolve, reject) => {
    client.destroyViewport(new ObjectId().setId(id), (err, r) => {
      if (err) {
        return reject('deleteViewport error: ' + err.message)
      }

      return resolve(r)
    })
  })
}

export function viewportSubscribe(
  panel: vscode.WebviewPanel,
  vp1: string,
  vp2: string,
  commandViewport: string,
  commandHex: string | null
) {
  client.subscribeToViewportEvents(new ObjectId().setId(vp1)).on('data', () => {
    client.getViewportData(
      new ViewportDataRequest().setViewportId(vp2),
      (err, r) => {
        let data = r?.getData_asB64()

        if (data) {
          let txt = Buffer.from(data, 'base64').toString('binary')
          panel.webview.postMessage({ command: commandViewport, text: txt })

          if (commandHex) {
            let hxt = hexy.hexy(txt)
            panel.webview.postMessage({ command: commandHex, text: hxt })
          }
        }
      }
    )
  })
}
