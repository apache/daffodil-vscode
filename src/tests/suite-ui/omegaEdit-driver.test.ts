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

import { expect } from 'chai'
import { before, beforeEach } from 'mocha'
import {
  BottomBarPanel,
  By,
  EditorView,
  InputBox,
  Key,
  WebView,
  Workbench,
} from 'vscode-extension-tester'
import * as fs from 'fs'
import path from 'path'

async function close_notifications() {
  try {
    const notifications = await new Workbench().getNotifications()
    await notifications.forEach((n) => n.dismiss())
  } catch (StaleElementReferenceError) {
    // no notifications were found
  }
}

describe('omega-edit Test Suite', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..')
  const testResourcesDir = path.resolve(repoRoot, 'test-resources')
  const screenshotsDir = path.resolve(testResourcesDir, 'screenshots')

  before(async () => {
    fs.mkdirSync(screenshotsDir, {
      recursive: true,
    })
    await new Promise((res) => {
      setTimeout(res, 1000)
    })
    await close_notifications()
  })

  beforeEach(async () => {
    await close_notifications()
  })

  after(async function () {
    await new EditorView().closeAllEditors()
  })

  it('toggles experimental features', async () => {
    // open the command prompt and search for experimental features
    let cmdInput = await new Workbench().openCommandPrompt()
    expect(cmdInput).to.be.ok

    // first check to see if the experimental features are disabled
    await cmdInput.clear()
    await cmdInput.setText('>Ena')
    let pick = await cmdInput.findQuickPick('Enable Experimental Features')
    expect(pick).to.not.be.undefined

    // ensure that the experimental features are disabled
    await cmdInput.clear()
    await cmdInput.setText('>ome')
    pick = await cmdInput.findQuickPick('Omega Edit Version Info')
    expect(pick).to.be.undefined

    await cmdInput.clear()
    await cmdInput.setText('>dat')
    pick = await cmdInput.findQuickPick('Data Editor')
    expect(pick).to.be.undefined
    await cmdInput.cancel()

    // enable experimental features
    await new Workbench().executeCommand('Enable Experimental Features')
    await new Promise((res) => {
      setTimeout(res, 1000)
    })

    // open the command prompt again and search for experimental features
    cmdInput = await new Workbench().openCommandPrompt()
    expect(cmdInput).to.be.ok

    // ensure that the experimental features are now enabled
    await cmdInput.clear()
    await cmdInput.setText('>ome')
    pick = await cmdInput.findQuickPick('Omega Edit Version Info')
    expect(pick).to.not.be.undefined

    await cmdInput.clear()
    await cmdInput.setText('>dat')
    pick = await cmdInput.findQuickPick('Data Editor')
    expect(pick).to.not.be.undefined

    await cmdInput.cancel()
  })

  it('gets the omega edit version', async () => {
    // ensure that we can get the version of Ωedit
    await new Workbench().executeCommand('Omega Edit Version Info')
    await new Promise((res) => {
      setTimeout(res, 10000)
    })

    // hit enter on input box for omega-edit port
    await new Workbench()
      .findElement(By.className('quick-input-box'))
      .findElement(By.className('input'))
      .sendKeys(Key.ENTER)

    const notifications = await new Workbench().getNotifications()
    expect(notifications.length).to.equal(1)
    expect(await notifications[0].getText()).contains('Ωedit')
  })

  it('opens a data editor', async () => {
    // ensure that we can open a data editor
    await new Workbench().executeCommand('Data Editor')
    await new Promise((res) => {
      setTimeout(res, 10000)
    })

    // hit enter on input box for omega-edit port
    await new Workbench()
      .findElement(By.className('quick-input-box'))
      .findElement(By.className('input'))
      .sendKeys(Key.ENTER)

    // open package.json as sample data
    const fileInput = await InputBox.create()
    await fileInput.setText(path.resolve(repoRoot, 'package.json'))
    await fileInput.confirm()
    await new Promise((res) => {
      setTimeout(res, 10000)
    })

    // hide the bottom bar panel to see the whole editor
    await new BottomBarPanel().toggle(false)

    // take a screenshot of the workbench
    fs.writeFileSync(
      path.resolve(screenshotsDir, 'data_editor-Workbench.png'),
      await new Workbench().takeScreenshot(),
      'base64'
    )
  })

  it('finds elements in the webview', async () => {
    const webView = new WebView()

    // switch the underlying webdriver context to the webview iframe
    await webView.switchToFrame()

    // find the element with the class name 'inspector-text' and get its text,
    // then check that it is equal to 'Data Inspector'
    const element = await webView.findWebElement(By.className('inspector-text'))
    expect(await element.getText()).to.equal('Data Inspector')

    // switch the underlying webdriver back to the original window
    await webView.switchBack()
  })

  it('inspects the terminal text', async () => {
    // show the bottom bar panel
    await new BottomBarPanel().toggle(true)
    await new Promise((res) => {
      setTimeout(res, 10000)
    })

    // select the terminal view
    const terminalView = await new BottomBarPanel().openTerminalView()
    expect(terminalView).is.ok
    await new Promise((res) => {
      setTimeout(res, 10000)
    })

    // the channel name should be the application name
    expect(await terminalView.getCurrentChannel()).to.contain('omega-edit')

    // getting the terminal text times out for some reason
    //fs.writeFileSync(path.resolve(repoRoot, 'terminal_text.txt'), await terminalView.getText())
  })
})
