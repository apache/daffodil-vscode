// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { defineConfig, mergeConfig } from 'vitest/config'
import { loadEnvFile } from 'node:process'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import strip from 'rollup-plugin-strip-code'
import * as fs from 'fs'
import path from 'path'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))
const envFilePath = path.resolve(__dirname, '.env')
const projectRoot = r('.')
const distDir = path.resolve(__dirname, '../../', 'dist/views/dataEditor')

const htmlNoncePlugin = () => {
  return {
    name: 'nonce',
    transformIndexHtml(html) {
      html = html.replace(
        /<link rel="stylesheet" crossorigin href="\/style.css">/g,
        `<link rel="stylesheet" crossorigin href="/style.css" nonce="__nonce__"/> `
      )

      return html.replace(
        /<script type="module" src="\/src\/main.ts"><\/script>/g,
        `<script type="module" src="\/index.js" nonce="__nonce__"></script>`
      )
    },
  }
}

/// <reference types="vitest/config"/>
export default defineConfig(({ mode }) => {
  if (fs.existsSync(envFilePath)) loadEnvFile(envFilePath)
  const debugDataEditor =
    process.env.DEBUG_DATAEDITOR == 'on' && mode === 'development'
  return {
    base: './',
    root: projectRoot,
    build: {
      sourcemap: true,
      minify: debugDataEditor ? true : false,
      outDir: distDir,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          assetFileNames: (info) => {
            const name = info.name ?? ''
            const ext = path.extname(name).toLowerCase()
            const base = path.basename(name, ext)
            if (/\.(woff2?|ttf|otf|eot)$/.test(ext)) {
              return name.includes('material-icons')
                ? `resources/icons/${base}${ext}`
                : `resources/fonts/${base}${ext}`
            }
            return `[name][extname]`
          },
          format: 'iife', // Immediately Invoked Function Expression for a single file
          inlineDynamicImports: true, // Forces all dynamic imports to be included in the same file
          entryFileNames: 'index.js', // Name of the final output file
        },
      },
    },
    plugins: [
      htmlNoncePlugin(),
      svelte({ configFile: r('./svelte.config.mjs') }),
      !debugDataEditor &&
        strip({
          include: ['**/*.svelte', '**/*.ts', '**/*.js'],
          start_comment: 'DEBUG_ONLY_START',
          end_comment: 'DEBUG_ONLY_END',
        }),
    ],
    resolve: {
      tsconfigPaths: true,
      alias: {
        $root: debugDataEditor
          ? r('./src/App.debug.svelte')
          : r('./src/App.svelte'),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
        layout: fileURLToPath(
          new URL('./src/components/layouts', import.meta.url)
        ),
        HTMLWrappers: fileURLToPath(
          new URL('./src/components/html', import.meta.url)
        ),
        editor_components: fileURLToPath(
          new URL('./src/components', import.meta.url)
        ),
        ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
        stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      },
    },
  }
})
