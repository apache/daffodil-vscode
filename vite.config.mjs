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

import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { builtinModules } from 'node:module'
import { parse as jsoncParse } from 'jsonc-parser'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pkg_dir = 'dist/package'

const localModulePath = (moduleName) =>
  path.resolve(__dirname, 'src', moduleName)

const localModuleAliases = {
  dataEditor: localModulePath('dataEditor'),
  tdmlEditor: localModulePath('tdmlEditor'),
  language: localModulePath('language'),
  launchWizard: localModulePath('launchWizard/launchWizard'),
  infoset: localModulePath('infoset'),
  rootCompletion: localModulePath('rootCompletion'),
}

const packageData = jsoncParse(
  fs.readFileSync(path.resolve('package.json'), 'utf8')
)
const pkg_version = packageData['version']

function getScalaVersions() {
  const scalaVersions = ['2.12', '2.13']

  // The scala 3 version of the debugger should only exist if JDK >= 17 is being used
  if (fs.existsSync(`debugger/target/jvm-3/universal/stage`)) {
    scalaVersions.push('3')
  }

  return scalaVersions
}

function copyDebuggerOutAfterBuild() {
  return {
    name: 'copy-debugger-package',
    apply: 'build',
    async buildStart() {
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
    },
  }
}

async function copyToPkgDirPlugin() {
  const patterns = [
    { from: 'README.md', to: `${pkg_dir}/README.md` },
    { from: 'build/package/LICENSE', to: `${pkg_dir}/LICENSE` },
    { from: 'build/package/NOTICE', to: `${pkg_dir}/NOTICE` },
    { from: 'dist/views/', to: `${pkg_dir}/dist/views/` },
    { from: 'images', to: `${pkg_dir}/images` },
    { from: 'language', to: `${pkg_dir}/language` },
    { from: 'package.json', to: `${pkg_dir}/package.json` },
    { from: 'yarn.lock', to: `${pkg_dir}/yarn.lock` },
    {
      from: 'node_modules/@omega-edit/server/out/bin',
      to: `${pkg_dir}/node_modules/@omega-edit/server/out/bin`,
    },
    {
      from: 'node_modules/@omega-edit/server/out/lib',
      to: `${pkg_dir}/node_modules/@omega-edit/server/out/lib`,
    },
    {
      from: 'node_modules/@vscode/webview-ui-toolkit',
      to: `${pkg_dir}/node_modules/@vscode/webview-ui-toolkit`,
    },
    {
      from: 'src/language/providers/intellisense/DFDLGeneralFormat.dfdl.xsd',
      to: `${pkg_dir}/src/language/providers/intellisense/DFDLGeneralFormat.dfdl.xsd`,
    },
    {
      from: 'src/launchWizard/script.js',
      to: `${pkg_dir}/src/launchWizard/script.js`,
    },
    { from: 'src/styles/styles.css', to: `${pkg_dir}/src/styles/styles.css` },
    { from: 'src/tdmlEditor/', to: `${pkg_dir}/src/tdmlEditor` },
    { from: 'dist/debuggers', to: `${pkg_dir}/dist/debuggers` },
  ]

  return {
    name: 'copy-patterns-plugin',
    apply: 'build',
    async buildStart(opts) {
      ;[
        pkg_dir + '/dist',
        pkg_dir + '/src/language',
        pkg_dir + '/src/language/providers',
        pkg_dir + '/src/language/providers/intellisense/',
        pkg_dir + '/src/launchWizard',
        pkg_dir + '/src/styles',
        pkg_dir + '/src/tdmlEditor',
      ].forEach((folder) => {
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true })
        }
      })

      for (const { from, to } of patterns) {
        fs.statSync(from).isFile()
          ? fs.copyFileSync(from, to)
          : fs.cpSync(from, to, { recursive: true })
      }
    },
  }
}

const shouldMinify = process.env.MINIFY === '1'

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      preserveSymlinks: true,
      alias: {
        ...localModuleAliases,
      },
      extensions: ['.ts', '.js'],
    },

    build: {
      sourcemap: true,

      minify: shouldMinify ? 'esbuild' : false,
      outDir: path.resolve(
        __dirname,
        mode == 'production' ? `${pkg_dir}/dist/ext` : 'dist/ext'
      ),
      emptyOutDir: true,

      rollupOptions: {
        input: {
          extension: path.resolve(__dirname, 'src/adapter/extension.ts'),
        },
        external: ['vscode', ...builtinModules, /^node:.*/],
        output: {
          entryFileNames: 'extension.js',
          format: 'cjs',
          exports: 'auto',
        },
        preserveEntrySignatures: 'strict',
      },

      target: 'node18',
    },

    plugins:
      mode == 'production'
        ? [copyDebuggerOutAfterBuild(), copyToPkgDirPlugin()]
        : [copyDebuggerOutAfterBuild()],
  }
})
