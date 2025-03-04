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
import { destroySession } from '@omega-edit/client'
import { updateHeartbeatInterval } from './heartbeat'

let activeSessions: string[] = []

export function addActiveSession(sessionId: string): void {
  if (!activeSessions.includes(sessionId)) {
    activeSessions.push(sessionId)
    // scale the heartbeat interval based on the number of active sessions to reduce load on the server
    updateHeartbeatInterval(activeSessions)
  }
}
export async function removeActiveSession(sessionId: string) {
  const index = activeSessions.indexOf(sessionId)
  activeSessions.splice(index, 1)
  updateHeartbeatInterval(activeSessions)
  await destroySession(sessionId)
}
