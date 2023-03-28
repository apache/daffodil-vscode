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

import { writable } from 'svelte/store'

export enum ColorPalette {
  PrimaryDarker = '#02060B',
  PrimaryDark = '#101821',
  PrimaryMid = '#2F3E4F',
  PrimaryLight = '#687483',
  PrimaryLighter = '#E1E3E5',
  SecondaryDarker = '#110B02',
  SecondaryDark = '#322716',
  SecondaryMid = '#796444',
  SecondaryLight = '#C8B69B',
  SecondaryLighter = '#FFFDFA',
}

export enum ThemeType {
  Dark = 2,
  Light = 3,
}
export enum CSSThemeClass {
  Dark = 'dark',
  Light = 'light',
}

export const darkUITheme = writable(true)

export const UIThemeCSSClass = writable(CSSThemeClass.Dark)
