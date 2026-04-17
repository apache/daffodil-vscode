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
  IServerHeartbeat,
  type ServerHeartbeatLoop,
  startServerHeartbeatLoop,
} from '@omega-edit/client'
import { HeartbeatInfo } from './HeartBeatInfo'

const HEARTBEAT_INTERVAL_MS: number = 1000 // 1 second (1000 ms)
let heartbeatInfo: IServerHeartbeat = new HeartbeatInfo()
let heartbeatLoop: ServerHeartbeatLoop | undefined = undefined

export function updateHeartbeatInterval(activeSessions: string[]) {
  heartbeatLoop?.stop()
  heartbeatLoop = undefined

  if (activeSessions.length === 0) {
    heartbeatInfo = new HeartbeatInfo()
    return
  }

  heartbeatLoop = startServerHeartbeatLoop({
    intervalMs: HEARTBEAT_INTERVAL_MS * activeSessions.length,
    getSessionIds: () => [...activeSessions],
    onHeartbeat: (nextHeartbeatInfo) => {
      heartbeatInfo = nextHeartbeatInfo
    },
    onError: () => {
      heartbeatInfo = new HeartbeatInfo()
    },
  })
}

export function getCurrentHeartbeatInfo() {
  return heartbeatInfo
}
