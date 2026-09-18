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

import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/// <reference types="vitest/config"/>
export default defineConfig(({ mode }) => {
  return {
    root: fileURLToPath(new URL('./', import.meta.url)),
    plugins: [svelte({ configFile: './svelte.config.mjs' })],
    resolve: {
      tsconfigPaths: true,
      alias: {
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
    test: {
      environment: 'jsdom',
      root: fileURLToPath(new URL('.', import.meta.url)),
      globals: true,
      include: ['./tests/**/*.svelte.test.ts', './tests/**/*.ts'],
      exclude: ['node_modules/**', 'out/**'],
      tsconfig: './tsconfig.json',
      typecheck: {
        enabled: true,
        tsconfig: './src/svelte/tsconfig.json',
        include: ['./src/svelte/tests/**/*.svelte.test.ts'],
        ignoreSourceErrors: true,
      },
    },
  }
})
