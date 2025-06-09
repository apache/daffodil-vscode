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
const child_process = require('child_process')

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

/* START SECTION: LICENSE related methods */
function getLicenseData() {
  return JSON.parse(
    child_process
      .execSync(
        `yarn licenses list --json --prod | jq 'select(.type == "table").data.body'`
      )
      .toString()
  )
}

function checkMissingLicenseData() {
  const licenses = getLicenseData()

  const packageLicenseData = fs.readFileSync('build/package/LICENSE', 'utf-8')
  const packageLicenseLines = packageLicenseData.split('\n')

  const packageNoticeData = fs.readFileSync('build/package/NOTICE', 'utf-8')
  const packageNoticeLines = packageNoticeData.split('\n')

  const packageNoNoticeData = fs.readFileSync('build/package/NONOTICE', 'utf-8')
  const packageNoNoticeLines = packageNoNoticeData.split('\n')

  const missingLicenseData = []

  licenses.forEach((license) => {
    if (
      packageLicenseLines
        .map((line) => line.startsWith('-') && line.includes(license[0]))
        .some(Boolean) ||
      packageNoticeLines
        .map((line) => line.startsWith('-') && line.includes(license[0]))
        .some(Boolean) ||
      packageNoNoticeLines
        .map((line) => line.startsWith('-') && line.includes(license[0]))
        .some(Boolean)
    )
      return

    missingLicenseData.push(license[0])
  })

  if (missingLicenseData.length > 0) {
    console.log('Missing LICENSE data for the following dependencies')
    missingLicenseData.forEach((licenseName) =>
      console.log(`  - ${licenseName}`)
    )
    process.exit(1)
  } else {
    console.log('No missing LICENSE data!')
  }
}

function checkLicenseCompatibility() {
  const licenses = getLicenseData()

  const licenseDataFileData = JSON.parse(
    fs.readFileSync('build/license_data.json', 'utf-8')
  )

  const allowedLicenseTypes = licenseDataFileData.allowedLiceneseTypes
  const allowedLicenses = licenseDataFileData.packages
    .filter((data) => data.allowed)
    .map((data) => data.name)

  const badLicenses = []

  licenses.forEach((license) => {
    const licenseCompatibile =
      allowedLicenseTypes.filter((licenseType) =>
        license[2].includes(licenseType)
      ).length > 0
        ? true
        : false

    if (!licenseCompatibile && !allowedLicenses.includes(license[0])) {
      badLicenses.push(license)
    }
  })

  if (badLicenses.length > 0) {
    console.log('The follow dependencies have not ASF approved LICENCES:')
    badLicenses.forEach((license) =>
      console.log(`  - ${license[0]} -> ${license[2]}`)
    )
    process.exit(1)
  } else {
    console.log('All dependency LICENSES are compatibile!')
  }
}
/* END SECTION: LICENSE related methods */

module.exports = {
  genVersionTS: genVersionTS,
  nodeclean: nodeclean,
  scalaclean: scalaclean,
  updateVersion: updateVersion,
  watch: watch,
  package: package,
  checkMissingLicenseData: checkMissingLicenseData,
  checkLicenseCompatibility: checkLicenseCompatibility,
}
