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

export class HeartbeatInfo implements IServerHeartbeat {
  latency: number = 0 // latency in ms
  serverCpuCount: number = 0 // cpu count
  serverCpuLoadAverage?: number = 0 // cpu load average
  serverPeakResidentMemoryBytes?: number = 0 // peak resident memory in bytes
  serverResidentMemoryBytes?: number = 0 // resident memory in bytes
  serverTimestamp: number = 0 // timestamp in ms
  serverUptime: number = 0 // uptime in ms
  serverVirtualMemoryBytes?: number = 0 // virtual memory in bytes
  sessionCount: number = 0 // session count
  
// export type ServerHeartbeat = IServerHeartbeat & { serverInfo: IServerInfo }

// export class HeartbeatInfo {
//   serverHeartbeat: ServerHeartbeat = {
//     latency: 0,
//     sessionCount: 0,
//     serverTimestamp: 0,
//     serverUptime: 0,
//     serverCpuCount: 0,
//     serverCpuLoadAverage: 0,
//     serverMaxMemory: 0,
//     serverCommittedMemory: 0,
//     serverUsedMemory: 0,
//     serverInfo: {
//       serverHostname: '',
//       serverProcessId: 0,
//       serverVersion: '',
//       jvmVersion: '',
//       jvmVendor: '',
//       jvmPath: '',
//       availableProcessors: 0,
//     },
//   }
}
