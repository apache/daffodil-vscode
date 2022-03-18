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

const vscode = acquireVsCodeApi()

// Function for checking/unchecking a checkbox element
function check(elementId) {
  const element = document.getElementById(elementId)
  element.checked = element.checked ? false : true
}

function sendit(value) {
  vscode.postMessage({
    command: 'send',
    text: value,
  })
}

function saveSession() {
  vscode.postMessage({
    command: 'save',
    sessionFile: document.getElementById('sessionFile').value,
    overwrite: document.getElementById('overwriteSessionFile').checked,
  })
}

window.addEventListener('message', (event) => {
  const message = event.data

  switch (message.command) {
    case 'setSessionFile':
      document.getElementById('sessionFile').value = message.filePath
      break
    default:
      document.getElementById(message.command).innerHTML = message.text
      break
  }
})
