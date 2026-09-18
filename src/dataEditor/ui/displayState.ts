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
import * as vscode from 'vscode'

interface DisplayStateAttributes {
  title: string
  encoding: BufferEncoding
  colorTheme: vscode.ColorThemeKind
}

export class DisplayState {
  private attributes: DisplayStateAttributes = {
    title: '',
    encoding: 'hex',
    colorTheme: vscode.window.activeColorTheme.kind,
  }

  constructor() {}

  update<K extends keyof DisplayStateAttributes>(
    attribute: K,
    value: DisplayStateAttributes[K]
  ): void {
    this.attributes[attribute] = value
  }

  get<K extends keyof DisplayStateAttributes>(
    attribute: K
  ): DisplayStateAttributes[K] {
    return this.attributes[attribute]
  }

  onColorThemeChanged(
    listener: (theme: DisplayStateAttributes['colorTheme']) => any
  ) {
    listener(this.attributes.colorTheme)

    vscode.window.onDidChangeActiveColorTheme((newTheme) => {
      this.attributes.colorTheme = newTheme.kind
      listener(newTheme.kind)
    })
  }
}
