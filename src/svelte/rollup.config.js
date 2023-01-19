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

import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import multiInput from 'rollup-plugin-multi-input'
import scss from 'rollup-plugin-scss'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-terser'
import sveltePreprocess from 'svelte-preprocess'

const production = !process.env.ROLLUP_WATCH

export default {
  input: ['src/views/*/index.ts'],
  output: {
    sourcemap: !production,
    format: 'esm',
    dir: '../../dist',
  },
  plugins: [
    multiInput.default(),
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
        sourcemap: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    scss({
      sourceMap: !production,
      failOnError: true,
      fileName: 'styles.css',
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      exportConditions: ['svelte'],
      extensions: ['.svelte'],
      dedupe: ['svelte'],
    }),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
      module: 'ESNext',
      compilerOptions: {
        rootDir: 'src',
        outDir: '../../dist',
      },
    }),

    // // If we're building for production (npm run build
    // // instead of npm run dev), minify
    production && terser({ sourceMap: !production }),
  ],
  watch: {
    clearScreen: false,
  },
}
