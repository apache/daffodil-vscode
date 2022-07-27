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
  element.checked = !element.checked

  if (elementId == 'overwriteSessionFile') {
    const newFileElement = document.getElementById('saveNewSessionFile')

    if (newFileElement.checked && element.checked) {
      newFileElement.checked = false
    }
  } else if (elementId == 'saveNewSessionFile') {
    const overwriteElement = document.getElementById('overwriteSessionFile')

    if (overwriteElement.checked && element.checked) {
      overwriteElement.checked = false
    }
  }
}

function deleteByte(value, offset, len) {
  vscode.postMessage({
    command: 'deleteByte',
    data: value,
    offset: offset,
    len: len,
  })
}

function insertByte(value, offset, len) {
  vscode.postMessage({
    command: 'insertByte',
    data: value,
    offset: offset,
    len: len,
  })
}

function overwriteByte(data, offset, len) {
  vscode.postMessage({
    command: 'overwriteByte',
    data: data,
    offset: offset,
    len: len,
  })
}

function undoChange() {
  vscode.postMessage({
    command: 'undoChange',
  })
}

function redoChange() {
  vscode.postMessage({
    command: 'redoChange',
  })
}

function saveSession() {
  vscode.postMessage({
    command: 'save',
    sessionFile: document.getElementById('sessionFile').value,
    overwrite: document.getElementById('overwriteSessionFile').checked,
    newFile: document.getElementById('saveNewSessionFile').checked,
  })
}

function replace(data, offset, len) {
  vscode.postMessage({
    command: 'replace',
    data: data,
    offset: offset,
    len: len,
  })
}

function search(searchPattern, caseInsensitive) {
  vscode.postMessage({
    command: 'search',
    searchPattern: searchPattern,
    caseInsensitive: caseInsensitive,
  })
}

function searchAndReplace(searchPattern, replaceText, caseInsensitive) {
  vscode.postMessage({
    command: 'searchAndReplace',
    searchPattern: searchPattern,
    replaceText: replaceText,
    caseInsensitive: caseInsensitive,
  })
}

function setupViewport(viewportId) {
  viewportElement = document.getElementById(viewportId)
  viewportElement.addEventListener('keydown', (event) => {
    key = event.key
    keyLower = key.toLowerCase()

    if (keyLower === 'enter') {
      key = '\n'
    }

    // ignore arrow, shift, meta (mac command), ctrl, alt, escape, tab and CapsLock keys
    if (
      keyLower.includes('arrow') ||
      keyLower.includes('shift') ||
      keyLower.includes('meta') ||
      keyLower.includes('control') ||
      keyLower.includes('alt') ||
      keyLower.includes('escape') ||
      keyLower.includes('tab') ||
      keyLower.includes('capslock')
    ) {
      return
    }

    if (keyLower === 'backspace' || keyLower === 'delete') {
      deleteByte(
        viewportElement.value,
        viewportElement.selectionStart === viewportElement.selectionEnd
          ? viewportElement.selectionStart - 1
          : viewportElement.selectionStart,
        viewportElement.selectionStart === viewportElement.selectionEnd
          ? 1
          : viewportElement.selectionEnd - viewportElement.selectionStart
      )
    } else if ((event.ctrlKey || event.metaKey) && keyLower === 'v') {
      if (viewportElement.selectionStart !== viewportElement.selectionEnd) {
        deleteByte(
          viewportElement.value,
          viewportElement.selectionStart,
          viewportElement.selectionEnd - viewportElement.selectionStart
        )
      }
      insertByte('clipboard', viewportElement.selectionStart, 0)
    } else if ((event.ctrlKey || event.metaKey) && keyLower === 'z') {
      if (event.shiftKey) {
        redoChange()
      } else {
        undoChange()
      }
    } else if (!event.ctrlKey && !event.metaKey) {
      if (viewportElement.selectionStart !== viewportElement.selectionEnd) {
        replace(
          key,
          viewportElement.selectionStart,
          viewportElement.selectionEnd - viewportElement.selectionStart
        )
      } else {
        insertByte(key, viewportElement.selectionStart, 1)
      }
    }
  })
}

function replaceCkBoxClicked() {
  var isChecked = document.getElementById('replaceText').checked

  if (isChecked) {
    document.getElementById('replaceLabel').style.visibility = 'visible'
    document.getElementById('searchReplaceButton').textContent = 'Replace'
  } else {
    document.getElementById('replaceLabel').style.visibility = 'hidden'
    document.getElementById('searchReplaceButton').textContent = 'Search'
  }
}

function executeSearchOrReplace() {
  var isReplace = document.getElementById('replaceText').checked

  if (isReplace) {
    searchAndReplace(
      document.getElementById('searchInput').value,
      document.getElementById('replaceInput').value,
      document.getElementById('caseInsensitive').checked
    )
  } else {
    search(
      document.getElementById('searchInput').value,
      document.getElementById('caseInsensitive').checked
    )
  }
}

;(function main() {
  window.addEventListener('message', (event) => {
    const message = event.data

    switch (message.command) {
      case 'setSessionFile':
        document.getElementById('sessionFile').value = message.filePath
        break
      default:
        document.getElementById(message.command).innerHTML = message.text
        if (message.offsetText) {
          document.getElementById('offset').innerHTML = message.offsetText
        }
        break
    }
  })

  window.addEventListener('load', (_) => {
    setupViewport('viewport1')
    setupViewport('viewport2')
    setupViewport('viewport3')
    setupViewport('vpAll')
  })
})()
