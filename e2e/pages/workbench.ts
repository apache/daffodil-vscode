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

import {
  expect,
  type FrameLocator,
  type Locator,
  type Page,
} from '@playwright/test'

/**
 * Drives VS Code's own UI. Its DOM isn't a public API and can change between
 * releases, so every selector for it belongs in this file. To find a new one,
 * use Help > Toggle Developer Tools in VS Code.
 *
 * This class is a "page object": it keeps selectors out of the tests, so that
 * they can say what they do rather than how.
 *
 * A Locator describes how to find an element, and finds nothing until it's
 * used. Playwright then retries until the element is ready or the timeout runs
 * out, which is why this file has no sleeps.
 * Read more: https://playwright.dev/docs/locators
 */
export class Workbench {
  private readonly quickInput: Locator
  private readonly quickInputBox: Locator

  constructor(private readonly window: Page) {
    // The box at the top of the window, used by the command palette and by file
    // dialogs
    this.quickInput = window.locator('.quick-input-widget')
    this.quickInputBox = this.quickInput.locator('input.input')
  }

  /** Waits for the element that holds all of VS Code's UI. */
  async waitUntilReady() {
    await this.window.locator('.monaco-workbench').waitFor()
  }

  /** Opens a file from the Explorer, which also gives it the focus. */
  async openFile(fileName: string) {
    await this.window
      .getByRole('treeitem', { name: fileName, exact: true })
      .dblclick()
  }

  /** Runs a command from the command palette, by its full title. */
  async runCommand(title: string) {
    // Open the command palette
    await this.window.keyboard.press('F1')

    // Type the command's title. fill() replaces the ">" that F1 puts in the
    // box, and without a ">" the box would search for files, not commands.
    await this.quickInputBox.fill(`>${title}`)

    // Click the command in the list. Playwright won't click a locator that
    // matches several elements, so .first() picks the top row in case another
    // command's title contains this one.
    await this.quickInput
      .locator('.monaco-list-row', { hasText: title })
      .first()
      .click()
  }

  /** Answers a file dialog, which test settings show in the quick input. */
  async pickFile(filePath: string) {
    // The command palette uses the same input box. Wait for the dialog to fill
    // it with the current folder, as typing while the palette is still closing
    // sends the text to wherever VS Code returns the focus. A folder's path
    // ends in a slash, which is what this pattern looks for.
    await expect(this.quickInputBox).toHaveValue(/[\\/]$/)

    // Type the file's path and confirm it, which closes the dialog
    await this.quickInputBox.fill(filePath)
    await this.quickInputBox.press('Enter')
  }

  /** Only shown while a debug session is paused, such as on a breakpoint. */
  debugContinueButton(): Locator {
    return this.window.locator('.debug-toolbar .codicon-debug-continue')
  }

  /** Stops the session, then waits for the debug toolbar to disappear. */
  async stopDebugging() {
    await this.window.locator('.debug-toolbar .codicon-debug-stop').click()
    await this.window.locator('.debug-toolbar').waitFor({ state: 'hidden' })
  }

  /**
   * The content of the open webview, which VS Code nests two iframes deep.
   * An ordinary locator can't see into an iframe, so each one needs a
   * frameLocator. Use the result like a Page, to find elements in the webview.
   */
  webview(): FrameLocator {
    return this.window
      .frameLocator('iframe.webview')
      .frameLocator('#active-frame')
  }
}
