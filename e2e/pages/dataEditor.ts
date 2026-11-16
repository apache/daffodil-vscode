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

import { type Locator } from '@playwright/test'
import { Workbench } from './workbench'

/**
 * Drives the Data Editor. It's a webview, so its elements are found through
 * workbench.webview() rather than in the main window.
 */
export class DataEditor {
  constructor(private readonly workbench: Workbench) {}

  /**
   * Opens a file. The extension then starts the Data Editor's server, and shows
   * the editor in a webview.
   */
  async open(filePath: string) {
    // The command asks which file to open
    await this.workbench.runCommand('Daffodil Debug: Data Editor')
    await this.workbench.pickFile(filePath)
  }

  /** The byte at the given offset in the physical (hex) view. */
  byte(offset: number): Locator {
    return this.workbench.webview().locator(`#physical-${offset}`)
  }

  /** Changes one byte. The new value is two hex digits, such as '41'. */
  async overwriteByte(offset: number, hexValue: string) {
    // Clicking a byte selects it and shows a box for editing it
    await this.byte(offset).click()

    // Type the new value, and press Enter to apply it
    const editBox = this.workbench.webview().locator('#binary-action-input')
    await editBox.fill(hexValue)
    await editBox.press('Enter')
  }

  /** Saving takes two clicks, as "Save..." first reveals the save options. */
  async save() {
    const webview = this.workbench.webview()
    await webview.getByTestId('save-options').click()
    await webview.getByTestId('save').click()
  }
}
