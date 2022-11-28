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
import * as hexy from 'hexy'
import {
  EventSubscriptionRequest,
  // ObjectId,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'
import { getClient, ALL_EVENTS } from 'omega-edit/settings'

const client = getClient()

export var randomId = () => Math.floor(Math.random() * (1000 - 0 + 1))

export async function getFilePath(
  sessionFile: string,
  overwrite: boolean,
  newFile: boolean
): Promise<string | undefined> {
  // Get file path for saved file
  let filePath: string | undefined

  if (overwrite) {
    filePath = sessionFile
  } else if (newFile) {
    let fileName = sessionFile.split('/')[sessionFile.split('/').length - 1]
    let path = sessionFile.replace(`/${fileName}`, '')
    let fileNameStart = fileName
      .split('.')
      .slice(0, fileName.split('.').length - 1)
      .join('')
    let fileNameEnd = fileName.split('.')[fileName.split('.').length - 1]
    filePath = `${path}/${fileNameStart}-${randomId().toString()}.${fileNameEnd}`
  } else {
    filePath = await vscode.window.showInputBox({
      placeHolder: 'Save session as:',
    })
  }

  return filePath
}

export async function setViewportDataForPanel(
  panel: vscode.WebviewPanel,
  vp: string,
  commandViewport: string,
  commandHex: string | null
) {
  client.getViewportData(
    new ViewportDataRequest().setViewportId(vp),
    (err, r) => {
      let data = r?.getData_asB64()

      if (data) {
        let txt = Buffer.from(data, 'base64').toString('binary')
        panel.webview.postMessage({ command: commandViewport, text: txt })

        if (commandHex === 'hexAll') {
          let hex = hexy.hexy(txt)
          let offsetLines = ''
          let encodedData = ''

          let hexLines = hex.split('\n')

          // Format hex code to make the file look nicer
          hexLines.forEach((h) => {
            if (h) {
              let splitHex = h.split(':')
              let dataLocations = splitHex[1].split(' ')

              offsetLines += splitHex[0] + '<br/>'
              if (dataLocations.length > 9) {
                for (var i = 1; i < 9; i++) {
                  let middle = Math.floor(dataLocations[i].length / 2)
                  encodedData +=
                    dataLocations[i].substring(0, middle).toUpperCase() +
                    '' +
                    dataLocations[i].substring(middle).toUpperCase() +
                    ' '
                }
              }

              encodedData += '<br/>'
            }
          })

          panel.webview.postMessage({
            command: commandHex,
            text: encodedData,
            offsetText: offsetLines,
          })
        } else if (commandHex) {
          let hxt = hexy.hexy(txt)
          panel.webview.postMessage({ command: commandHex, text: hxt })
        }
      }
    }
  )
}

export async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  vp1: string,
  vp2: string,
  commandViewport: string,
  commandHex: string | null
) {
  var request = new EventSubscriptionRequest()
    .setId(vp1)
    .setInterest(ALL_EVENTS)

  client.subscribeToViewportEvents(request).on('data', async (ve) => {
    await setViewportDataForPanel(panel, vp2, commandViewport, commandHex)
  })

  // data request not ran right away, so this ensures the views are populated
  await setViewportDataForPanel(panel, vp2, commandViewport, commandHex)
}
