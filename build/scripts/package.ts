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
const path = require('path')
const glob = require('glob')
const execSync = require('child_process').execSync
const pkg_dir = 'dist/package'

async function copyGlob(pattern, dir = '.') {
  glob(pattern, { cwd: dir }, (error, files) => {
    for (var i = 0; i < files.length; i++) {
      let src = path.join(dir, files[i])
      let dst = path.join(pkg_dir, files[i])
      let dstDir = path.dirname(dst)

      fs.mkdirSync(dstDir, { recursive: true })

      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst)
      }
    }
  })
}

// Setup package directory
function setup() {
  if (fs.existsSync(pkg_dir)) {
    fs.rmSync(pkg_dir, { recursive: true })
  }

  fs.mkdirSync(pkg_dir)

  let lines = fs
    .readFileSync('build/package/.vscodeignore')
    .toString()
    .split('\n')

  // Copy all files listed in the .vscodeignore
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]

    if (!line.startsWith('!')) continue

    let pattern = line.substring(1).trim()

    copyGlob(pattern)
  }

  // Copy required package files into package directory
  copyGlob('{.,}*', 'build/package') // include hidden files

  fs.copyFileSync('yarn.lock', `${pkg_dir}/yarn.lock`)
}

// Create VSIX package
function create() {
  execSync('yarn install', { cwd: pkg_dir })
  execSync('yarn vsce package --out ../../', { cwd: pkg_dir })
}

module.exports = {
  setup: setup,
  create: create,
}
