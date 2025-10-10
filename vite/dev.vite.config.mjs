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
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'
import unzip from 'unzip-stream'
import fs from 'node:fs'
import { builtinModules } from 'node:module'
import { parse as jsoncParse } from 'jsonc-parser'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const localModulePath = (moduleName) =>
  path.resolve(__dirname, '../', 'src', moduleName)

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
const scalaVersions = ['2.12', '2.13', '3']

function unzipAfterBuild() {
  return {
    name: 'unzip-server-package',
    apply: 'build',
    async closeBundle() {
      scalaVersions.forEach(async (scalaVersion) => {
        const serverPackage = `daffodil-debugger-${scalaVersion}-${pkg_version}`
        const jvmFolderName = `jvm-${scalaVersion}`
        const zipFilePath = path.resolve(
          `debugger/target/${jvmFolderName}/universal/${serverPackage}.zip`
        )

        const serverPackageFolder = path.join(
          path.resolve('dist/package'),
          serverPackage
        )

        // remove debugger package folder if exists
        if (fs.existsSync(serverPackageFolder)) {
          fs.rmSync(serverPackageFolder, { recursive: true, force: true })
        }

        // if the debugger package doesn't exist continue
        if (!fs.existsSync(zipFilePath)) {
          return
        }

        await new Promise((resolve, reject) => {
          const stream = fs
            .createReadStream(zipFilePath)
            // @ts-ignore types for unzip-stream
            .pipe(unzip.Extract({ path: '.' }))
          stream.on('close', () => resolve())
          stream.on('error', (err) => reject(err))
        })
      })
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
      outDir: path.resolve(__dirname, '../dist/ext'),
      emptyOutDir: true,

      rollupOptions: {
        input: {
          extension: path.resolve(__dirname, '../src/adapter/extension.ts'),
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

    plugins: [
      unzipAfterBuild(),
      // svelte({ configFile: './src/svelte/svelte.config.mjs' }),
    ],
  }
})
