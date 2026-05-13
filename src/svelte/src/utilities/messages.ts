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
import { type MessageResponseMap } from 'ext_types'
import {
  isEditorMessageId,
  isEditorResponseId,
} from '../../../ext_types/messageIds'

export type IncomingMessage = {
  command: keyof MessageResponseMap
  id: string
  data: MessageResponseMap[keyof MessageResponseMap]
}

function isEditorResponse(msg: any): msg is IncomingMessage {
  return msg && isEditorResponseId(msg.command)
}
function dispatchEditorEvent(event: MessageEvent) {
  const msg = event.data
  if (!isEditorResponse(msg)) return

  window.dispatchEvent(
    new CustomEvent(msg.command, { detail: { id: msg.id, data: msg.data } })
  )
}
window.addEventListener('message', dispatchEditorEvent)
