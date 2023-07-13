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
const glob = require('glob')
const nodemon = require('nodemon')
const concurrently = require('concurrently')

function rmFileOrDirectory(path) {
  if (fs.existsSync(path))
    fs.rmSync(path, { recursive: true })
}

function genVersionTS() {
  const version = JSON.stringify(require('../../package.json').version).replace(/"/g, "'")
  fs.writeFileSync('./src/version.ts', `/*
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

export const LIB_VERSION = ${version}
`)
}

const nodeclean = () =>
  ['out', 'dist'].forEach((dir) => rmFileOrDirectory(dir))

function scalaclean() {
  glob('**/target', { cwd: '.' }, (err, files) => {
    if (err) {
      console.log(err)
      return
    }

    files.forEach((dir) => rmFileOrDirectory(dir))
  })
}

function watch() {
  concurrently(
    [
      "yarn scalawatch",
      "webpack --watch --devtool nosources-source-map --config ./build/extension.webpack.config.js",
      "yarn watch:svelte"
    ],
    {
      killOthers: ['failure', 'success'],
    }
  )
}

module.exports = {
  genVersionTS: genVersionTS,
  nodeclean: nodeclean,
  scalaclean: scalaclean,
  watch: watch,
}
