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
import { IServerHeartbeat, IServerInfo } from '@omega-edit/client'
import { ServerInfo } from '../ServerInfo'

export interface IHeartbeatInfo extends IServerHeartbeat {
  omegaEditPort: number // Ωedit server port
  serverInfo: IServerInfo // server info that remains constant
}
export class HeartbeatInfo {
  omegaEditPort: number = 0 // Ωedit server port
  latency: number = 0 // latency in ms
  serverCommittedMemory: number = 0 // committed memory in bytes
  serverCpuCount: number = 0 // cpu count
  serverCpuLoadAverage: number = 0 // cpu load average
  serverMaxMemory: number = 0 // max memory in bytes
  serverTimestamp: number = 0 // timestamp in ms
  serverUptime: number = 0 // uptime in ms
  serverUsedMemory: number = 0 // used memory in bytes
  sessionCount: number = 0 // session count
  serverInfo: IServerInfo = new ServerInfo()
}
