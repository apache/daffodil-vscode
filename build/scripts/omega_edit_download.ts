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

// @ts-nocheck <-- This is needed as this file is basically a JavaScript script
//                 but with some TypeScript niceness baked in
const fs = require('fs')
const os = require('os')
const path = require('path')
const HttpClient = require('typed-rest-client/HttpClient').HttpClient
const crypto = require('crypto')
const hashSum = crypto.createHash('sha512')

/**
 * The below classes (Backend, Artifact) are defined similarly in src/classes/artifact.ts.
 * However for this script to work properly they needed to be redefined in a more JS style.
 */

class Backend {
  constructor(owner, repo) {
    this.owner = owner
    this.repo = repo
  }
}

class Artifact {
  constructor(omegaEditVersion) {
    this.omegaEditVersion = omegaEditVersion
    this.name = `omega-edit-scala-server-${this.omegaEditVersion}`
    this.archive = `${this.name}.zip`
    this.archiveUrl = (backend) =>
      `https://github.com/${backend.owner}/${backend.repo}/releases/download/v${this.omegaEditVersion}/${this.archive}`
    this.scriptName = os.platform().toLowerCase().startsWith('win32')
      ? 'example-grpc-server.bat'
      : './example-grpc-server'
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

// Method to get omega-edit version from a JSON file
function getOmegaEditPackageVersion(filePath) {
  return JSON.parse(fs.readFileSync(filePath).toString())['dependencies'][
    'omega-edit'
  ]
}

// Method to get omegaEditServerHash from a JSON file
function getOmegaEditServerHash(filePath) {
  return JSON.parse(fs.readFileSync(filePath).toString())['omegaEditServerHash']
}

async function downloadServer() {
  // Get omegaEditVersion
  const omegaEditVersion = getOmegaEditPackageVersion('./package.json')
  const artifact = new Artifact(omegaEditVersion)
  const backend = new Backend('ctc-oss', 'omega-edit')

  let filePath = path.join('src/omega_edit', artifact.archive).toString()

  // Download and setup omega-edit server files
  if (!fs.existsSync(filePath)) {
    // Get omega-edit server of version entered using http client
    const client = new HttpClient('client')
    const artifactUrl = artifact.archiveUrl(backend)
    const response = await client.get(artifactUrl)

    if (response.message.statusCode !== 200) {
      const err = new Error(
        `Couldn't download the Ωedit sever backend from ${artifactUrl}.`
      )
      err['httpStatusCode'] = response.message.statusCode
      throw err
    }

    // Create zip from rest call
    const file = fs.createWriteStream(filePath)

    await new Promise((resolve, reject) => {
      file.on(
        'error',
        (err) =>
          function () {
            throw err
          }
      )
      const stream = response.message.pipe(file)

      stream.on('close', () => {
        try {
          resolve(filePath)
        } catch (err) {
          reject(err)
        }
      })
    })

    hashSum.update(fs.readFileSync(filePath))
    if (
      hashSum.digest('hex').toString() !==
      getOmegaEditServerHash('./package.json')
    ) {
      fs.unlinkSync(filePath)
      throw new Error("[ERROR] omega-edit Scala server hashes didn't match")
    }
  }
}

module.exports = {
  downloadServer: downloadServer,
}
