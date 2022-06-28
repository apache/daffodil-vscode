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
const execSync = require('child_process').execSync

function prebuild() {
  fs.renameSync('LICENSE', 'tmp.LICENSE')
  fs.renameSync('NOTICE', 'tmp.NOTICE')
  fs.copyFileSync('build/bin.NOTICE', 'NOTICE')
  fs.copyFileSync('build/bin.LICENSE', 'LICENSE')
}

function postbuild() {
  fs.rmSync('LICENSE')
  fs.rmSync('NOTICE')
  fs.renameSync('tmp.LICENSE', 'LICENSE')
  fs.renameSync('tmp.NOTICE', 'NOTICE')

  // This will make sure that if the root LICENSE and NOTICE are the same as the build LICENSE
  // and NOTICE that they are reverted back to their original contents.
  if (
    fs.readFileSync('build/bin.LICENSE').toString() ===
    fs.readFileSync('LICENSE').toString()
  ) {
    execSync('git checkout LICENSE')
  }

  if (
    fs.readFileSync('build/bin.NOTICE').toString() ===
    fs.readFileSync('NOTICE').toString()
  ) {
    execSync('git checkout NOTICE')
  }
}

module.exports = {
  postbuild: postbuild,
  prebuild: prebuild,
}
