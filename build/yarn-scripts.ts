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
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const concurrently = require('concurrently')

function rmFileOrDirectory(path) {
  if (fs.existsSync(path)) fs.rmSync(path, { recursive: true })
}

function genVersionTS() {
  const version = JSON.stringify(require('../package.json').version).replace(
    /"/g,
    "'"
  )
  fs.writeFileSync(
    './src/version.ts',
    `/*
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
`
  )
}

const nodeclean = () => {
  ;['out', 'dist'].forEach((dir) => rmFileOrDirectory(dir))
  glob('daffodil-debugger-*', { cwd: '.' }, (err, files) => {
    if (err) {
      console.log(err)
      return
    }

    files.forEach((dir) => rmFileOrDirectory(dir))
  })
}

const scalaclean = () => {
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
      'webpack --watch --devtool nosources-source-map --config ./webpack/ext-dev.webpack.config.js',
      'yarn watch:svelte',
      'yarn watch:tdmlEditorJS',
    ],
    {
      killOthers: ['failure', 'success'],
    }
  )
}

function package() {
  const pkg_dir = 'dist/package'

  // create .vscodeignore to not package all node_modules into the vsix
  fs.writeFileSync(
    path.join(pkg_dir, '.vscodeignore'),
    `# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

**/node_modules/**/*
!node_modules/@omega-edit/server/bin
!node_modules/@omega-edit/server/lib
!node_modules/@vscode/webview-ui-toolkit/**/*
`
  )
}

/* START SECTION: Update version */
// helper function to get the version passed in
function parseArgs() {
  const args = process.argv.slice(1)

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '-v' || args[i] == '--version') && i + 1 < args.length) {
      return args[i + 1]
    }
  }

  return null
}

function updatePackageJsonVersion(version) {
  const packageJsonPath = 'package.json'

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found')
    process.exit(1)
  }

  const pkgRaw = fs.readFileSync(packageJsonPath, 'utf-8')
  const pkg = JSON.parse(pkgRaw)
  pkg.version = version

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(pkg, null, 2) + '\n',
    'utf-8'
  )
  console.log(`package.json version updated to ${version}`)
}

function updateVersionFile(version) {
  fs.writeFileSync('VERSION', version + '\n', 'utf-8')
  console.log(`VERSION updated to ${version}`)
}

function updateVersion() {
  let newVersion = parseArgs()

  if (!newVersion) {
    console.error('Error: Please provide a version using -v or --version')
    process.exit(1)
  }

  if (newVersion.startsWith('v')) {
    newVersion = newVersion.slice(1)
  }

  updatePackageJsonVersion(newVersion)
  updateVersionFile(newVersion)
}
/* END SECTION: Update version */

module.exports = {
  genVersionTS: genVersionTS,
  nodeclean: nodeclean,
  scalaclean: scalaclean,
  updateVersion: updateVersion,
  watch: watch,
  package: package,
}
