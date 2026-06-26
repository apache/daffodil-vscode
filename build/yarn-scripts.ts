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
const { glob } = require('glob')
const concurrently = require('concurrently')
const child_process = require('child_process')
const jsoncParse = require('jsonc-parser').parse

const packageData = jsoncParse(
  fs.readFileSync(path.resolve('package.json'), 'utf8')
)
const pkg_version = packageData['version']

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

const nodeclean = () => ['out', 'dist'].forEach((dir) => rmFileOrDirectory(dir))

const scalaclean = () =>
  glob('**/target', { cwd: '.' })
    .then((files) => files.forEach((dir) => rmFileOrDirectory(dir)))
    .catch((err) => console.log(err))

function watch() {
  concurrently(['yarn watch:vite-dev', 'yarn watch:tdmlEditorJS'], {
    killOthersOn: ['failure'],
    restartTries: 1,
  })
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
!node_modules/
!node_modules/**/*
`
  )
}

function packageVsix() {
  const vsceCommand =
    process.platform === 'win32'
      ? path.resolve('node_modules', '.bin', 'vsce.cmd')
      : path.resolve('node_modules', '.bin', 'vsce')

  const result = child_process.spawnSync(
    vsceCommand,
    ['package', '--out', '../../'],
    {
      cwd: 'dist/package',
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  )

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  process.exit(result.status === null ? 1 : result.status)
}

function getScalaVersions() {
  const scalaVersions = ['2.12', '2.13']

  // The scala 3 version of the debugger should only exist if JDK >= 17 is being used
  if (fs.existsSync(`debugger/target/jvm-3/universal/stage`)) {
    scalaVersions.push('3')
  }

  return scalaVersions
}

function moveDebuggers() {
  getScalaVersions().forEach(async (scalaVersion) => {
    const serverPackage = `daffodil-debugger-${scalaVersion}-${pkg_version}`
    const jvmFolderName = `jvm-${scalaVersion}`
    const stageFilePath = path.resolve(
      `debugger/target/${jvmFolderName}/universal/stage`
    )

    const serverPackageFolder = path.join('dist/debuggers', serverPackage)

    // remove debugger package folder if exists
    if (fs.existsSync(serverPackageFolder)) {
      fs.rmSync(serverPackageFolder, { recursive: true, force: true })
    }

    // Copy staged debugger files to desired location
    fs.cpSync(stageFilePath, serverPackageFolder, { recursive: true })
  })
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
  const licenseOutput = child_process
    .execSync(`yarn licenses list --json --prod`)
    .toString()

  for (const line of licenseOutput.split(/\r?\n/)) {
    if (line.trim().length === 0) continue

    const record = JSON.parse(line)
    if (record.type === 'table') {
      return record.data.body
    }
  }

  throw new Error('Failed to parse yarn licenses output: no table record found')
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
  packageVsix: packageVsix,
  checkMissingLicenseData: checkMissingLicenseData,
  checkLicenseCompatibility: checkLicenseCompatibility,
  moveDebuggers: moveDebuggers,
}
