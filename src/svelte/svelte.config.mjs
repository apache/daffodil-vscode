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

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  preprocess: [
    vitePreprocess(),
    sveltePreprocess({ sourceMap: true, typescript: true }),
  ],
  compilerOptions: {
    runes: undefined,
    css: 'external',
    rootDir: '.',
  },

  onwarn(w, defaultHandler) {
    if (
      ![
        'a11y_no_static_element_interactions',
        'a11y_click_events_have_key_events',
        'css_unused_selector',
      ].includes(w.code)
    ) {
      defaultHandler(w)
    }
  },
}
