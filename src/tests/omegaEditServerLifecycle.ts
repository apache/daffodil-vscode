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

import * as assert from 'assert'
import * as net from 'net'
import * as path from 'path'
import fs from 'fs'
import {
  createSession,
  getClient,
  resetClient,
  startServer,
  stopProcessUsingPID,
} from '@omega-edit/client'
import { TEST_SCHEMA } from './suite/common'
import XDGAppPaths from 'xdg-app-paths'
import { writeLogbackConfigFile } from '../dataEditor/include/server/LogbackConfig'

const reapPort = 9010
const logLevel = 'debug'
const OMEGA_EDIT_HOST = '127.0.0.1'
const APP_DATA_PATH = XDGAppPaths({ name: 'omega_edit' }).data()

function getTestPidFile(serverPort: number) {
  return path.join(APP_DATA_PATH, `test-serv-${serverPort}.pid`)
}

function isServerListening(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(500)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, host)
  })
}

async function waitForServerListeningState(
  port: number,
  host: string,
  expected: boolean,
  timeoutMs: number
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if ((await isServerListening(port, host)) === expected) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(
    `Timed out waiting for server on ${host}:${port} to become ${expected ? 'available' : 'unavailable'}`
  )
}

async function cleanupArtifacts(
  pidFile: string,
  logConfigFile: string,
  serverLogFile: string,
  checkpointDir: string
): Promise<void> {
  resetClient()

  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile).toString())
    if (!Number.isNaN(pid)) {
      await stopProcessUsingPID(pid)
    }
    fs.rmSync(pidFile, { force: true })
  }

  if (fs.existsSync(logConfigFile)) {
    fs.rmSync(logConfigFile, { force: true })
  }
  if (fs.existsSync(serverLogFile)) {
    fs.rmSync(serverLogFile, { force: true })
  }
  if (fs.existsSync(checkpointDir)) {
    fs.rmSync(checkpointDir, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  const pidFile = getTestPidFile(reapPort)
  const serverLogFile = path.join(APP_DATA_PATH, `test-serv-${reapPort}.log`)
  const logConfigFile = writeLogbackConfigFile(
    path.join(APP_DATA_PATH, `test-serv-${reapPort}.logconf.xml`),
    serverLogFile,
    logLevel
  )
  const checkpointDir = path.join(APP_DATA_PATH, `.checkpoint-${reapPort}`)

  resetClient()

  try {
    const serverPid = await startServer(reapPort, OMEGA_EDIT_HOST, pidFile, {
      sessionTimeoutMs: 1000,
      cleanupIntervalMs: 250,
      shutdownWhenNoSessions: true,
      logConfigFile,
    })

    assert.ok(serverPid)
    await waitForServerListeningState(reapPort, OMEGA_EDIT_HOST, true, 5000)

    await getClient(reapPort, OMEGA_EDIT_HOST)
    const createSessionResponse = await createSession(
      TEST_SCHEMA,
      undefined,
      checkpointDir
    )
    assert.ok(createSessionResponse.getSessionId().length > 0)

    await waitForServerListeningState(reapPort, OMEGA_EDIT_HOST, false, 10000)
  } finally {
    await cleanupArtifacts(pidFile, logConfigFile, serverLogFile, checkpointDir)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
