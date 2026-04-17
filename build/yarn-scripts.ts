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
  concurrently(
    ['yarn watch:vite-dev', 'yarn watch:svelte', 'yarn watch:tdmlEditorJS'],
    {
      killOthersOn: ['failure'],
      restartTries: 1,
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
!node_modules/
!node_modules/**/*
`
  )
}

function packageNamePath(packageName) {
  return path.join(...packageName.split('/'))
}

function readPackageVersion(packageRoot) {
  const packageJsonPath = path.join(packageRoot, 'package.json')
  if (!fs.existsSync(packageJsonPath)) return undefined

  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version
  } catch (err) {
    console.warn(
      `[omega-edit] Unable to read package version for ${packageRoot}: ${String(
        err
      )}`
    )
    return undefined
  }
}

function shouldPatchOmegaEditPackage(packageRoot, expectedVersion, label) {
  const version = readPackageVersion(packageRoot)
  if (version === expectedVersion) {
    return true
  }

  const versionLabel = version ?? 'unknown'
  console.warn(
    `[omega-edit] Skipping ${label} patch for ${packageRoot}; expected ${expectedVersion}, found ${versionLabel}.`
  )
  return false
}

function patchOmegaEditClientLogger(
  packageRoot = 'node_modules/@omega-edit/client'
) {
  if (!shouldPatchOmegaEditPackage(packageRoot, '2.0.0', 'client logger')) {
    return
  }

  const loggerTargets = [
    path.join(packageRoot, 'dist/cjs/logger.js'),
    path.join(packageRoot, 'dist/esm/logger.js'),
  ]
  const transportPattern =
    /setLogger\(buildLogger\(pino(?:_1\.default)?\.transport\(\{[\s\S]*?\}\)\)\);/

  loggerTargets.forEach((loggerPath) => {
    if (!fs.existsSync(loggerPath)) {
      console.warn(`[omega-edit] Client logger not found: ${loggerPath}`)
      return
    }

    const source = fs.readFileSync(loggerPath, 'utf-8')
    const patched = source.replace(
      transportPattern,
      'setLogger(buildLogger(process.stderr));'
    )

    if (patched === source) {
      if (!source.includes('setLogger(buildLogger(process.stderr));')) {
        console.warn(
          `[omega-edit] Unable to patch OmegaEdit client logger at ${loggerPath}; leaving upstream source unchanged.`
        )
      }
      return
    }

    fs.writeFileSync(loggerPath, patched, 'utf-8')
  })
}

function patchOmegaEditServerLocator(searchRoot = 'node_modules') {
  const serverTargets = glob.sync('**/@omega-edit/server/out/index.js', {
    cwd: searchRoot,
    absolute: true,
    nodir: true,
  })
  const buggyLocator = '.replace("node_modules","")'
  const knownFixedLocators = [
    '.slice(0,-"node_modules".length)',
    '.slice(0,-12)',
  ]

  if (serverTargets.length === 0) {
    return
  }

  serverTargets.forEach((serverPath) => {
    const packageRoot = path.dirname(path.dirname(serverPath))
    if (!shouldPatchOmegaEditPackage(packageRoot, '2.0.0', 'server locator')) {
      return
    }

    const source = fs.readFileSync(serverPath, 'utf-8')
    const patched = source.replaceAll(buggyLocator, knownFixedLocators[0])

    if (patched === source) {
      if (!knownFixedLocators.some((locator) => source.includes(locator))) {
        console.warn(
          `[omega-edit] Unable to patch OmegaEdit server locator at ${serverPath}; leaving upstream source unchanged.`
        )
      }
      return
    }

    fs.writeFileSync(serverPath, patched, 'utf-8')
  })
}

function patchOmegaEditRuntime(
  packageRoot = 'node_modules/@omega-edit/client',
  searchRoot = 'node_modules'
) {
  patchOmegaEditClientLogger(packageRoot)
  patchOmegaEditServerLocator(searchRoot)
}

function copyPackageRuntimeTree(
  packageName,
  sourcePackageDir,
  destinationPackageDir,
  seen = new Set()
) {
  const visitKey = `${sourcePackageDir}|${destinationPackageDir}`
  if (seen.has(visitKey)) return
  seen.add(visitKey)

  if (!fs.existsSync(sourcePackageDir)) {
    throw new Error(
      `Package source not found for ${packageName}: ${sourcePackageDir}`
    )
  }

  rmFileOrDirectory(destinationPackageDir)
  fs.mkdirSync(path.dirname(destinationPackageDir), { recursive: true })
  fs.cpSync(sourcePackageDir, destinationPackageDir, {
    recursive: true,
    force: true,
  })

  const packageJsonPath = path.join(sourcePackageDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const dependencies = Object.keys(packageJson.dependencies || {})

  if (dependencies.length === 0) return

  const destinationNodeModulesDir = path.join(
    destinationPackageDir,
    'node_modules'
  )

  dependencies.forEach((dependencyName) => {
    const sourceDependencyDirCandidates = [
      path.join(
        sourcePackageDir,
        'node_modules',
        packageNamePath(dependencyName)
      ),
      path.join('node_modules', packageNamePath(dependencyName)),
    ]
    const sourceDependencyDir = sourceDependencyDirCandidates.find(
      (candidate) => fs.existsSync(candidate)
    )

    if (!sourceDependencyDir) {
      throw new Error(
        `Unable to resolve runtime dependency ${dependencyName} for ${packageName}`
      )
    }

    copyPackageRuntimeTree(
      dependencyName,
      sourceDependencyDir,
      path.join(destinationNodeModulesDir, packageNamePath(dependencyName)),
      seen
    )
  })
}

function syncOmegaEditClientRuntime() {
  const clientPackageName = '@omega-edit/client'
  const sourceClientDir = path.join(
    'node_modules',
    packageNamePath(clientPackageName)
  )
  const destinationClientDir = path.join(
    'dist/package/node_modules',
    packageNamePath(clientPackageName)
  )

  patchOmegaEditRuntime(sourceClientDir, 'node_modules')
  copyPackageRuntimeTree(
    clientPackageName,
    sourceClientDir,
    destinationClientDir
  )
  patchOmegaEditRuntime(destinationClientDir, 'dist/package/node_modules')
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
  patchOmegaEditClientLogger: patchOmegaEditClientLogger,
  patchOmegaEditServerLocator: patchOmegaEditServerLocator,
  patchOmegaEditRuntime: patchOmegaEditRuntime,
  syncOmegaEditClientRuntime: syncOmegaEditClientRuntime,
  packageVsix: packageVsix,
  checkMissingLicenseData: checkMissingLicenseData,
  checkLicenseCompatibility: checkLicenseCompatibility,
}
