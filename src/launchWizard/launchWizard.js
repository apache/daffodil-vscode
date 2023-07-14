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

// Retrieve vscode api - Doing this multiple times causes issues with the scripts
const vscode = acquireVsCodeApi()

// Function to get config index
function getConfigIndex() {
  var configSelectionBox = document.getElementById('configSelected')
  var configSelectedValue =
    configSelectionBox.options[configSelectionBox.selectedIndex].value

  if (configSelectedValue === 'New Config') {
    document.getElementById('nameLabel').style =
      'margin-top: 10px; visibility: visible;'
  } else {
    document.getElementById('nameLabel').style = 'visibility: hidden;'
  }

  return configSelectedValue === 'New Config'
    ? -1
    : configSelectionBox.selectedIndex
}

// Function get daffodil debug classpath string
function getDaffodilDebugClasspathString() {
  let childNodes = document.getElementById(
    'daffodilDebugClasspathTable'
  ).childNodes

  return Array.from(childNodes)
    .map(
      (childNode) =>
        childNode.textContent
          .replace(/\B\s+|\s+\B/g, '') // remove any un-needed whitespace. will not remove spaces between characters
          .replace('-', '') // remove initial - in front of every item
    )
    .filter((cp) => cp != '')
    .join(':')
}

// Function to call extension to open file picker
function filePicker(id, description) {
  let extraData = {}
  if (id === 'daffodilDebugClasspath') {
    extraData['daffodilDebugClasspath'] = getDaffodilDebugClasspathString()
  }

  vscode.postMessage({
    command: 'openFilePicker',
    id: id,
    description: description,
    configIndex: getConfigIndex(),
    selectFiles: description.includes('file(s)') ? true : false,
    selectFolders: description.includes('folder(s)') ? true : false,
    extraData: extraData,
  })
}

// Function to remove child node from list
async function removeDebugClasspathItem(child) {
  document.getElementById('daffodilDebugClasspathTable').removeChild(child)
}

// Function to update classpath list
async function updateDaffodilDebugClasspathList(data, delimeter) {
  let list = document.getElementById('daffodilDebugClasspathTable')
  let itemArray = data.split(delimeter)

  for (var i = 0; i < itemArray.length; i++) {
    let item = itemArray[i]
    let li = document.createElement('li')
    li.id = `debug-classpath-li-${item}`
    li.style = 'margin-left: -5px;'
    li.innerHTML = `
      <p id="debug-classpath-li-${itemArray[i]}" class="debug-classpath-item">
        <button id="remove-debug-classpath-li-${itemArray[i]}" class="minus-button" type="button">-</button>
        ${itemArray[i]}
      </p>`

    li.onclick = () => {
      list.removeChild(li)
    }

    if (!list.contains(li)) list.appendChild(li)
  }
}

// Function to remove all items from daffodil debug classpath list/table
async function clearDaffodilDebugClasspathList() {
  let list = document.getElementById('daffodilDebugClasspathTable')

  while (list.hasChildNodes()) {
    list.removeChild(list.firstChild)
  }
}

// Function to update select infoset output type
function updateInfosetOutputType() {
  var infosetSelectionBox = document.getElementById('infosetOutputType')
  var infosetSelectedValue =
    infosetSelectionBox.options[infosetSelectionBox.selectedIndex].value

  if (infosetSelectedValue === 'file') {
    document.getElementById('infosetOutputFilePathLabel').style =
      'margin-top: 10px; visibility: visible;'
  } else {
    document.getElementById('infosetOutputFilePathLabel').style =
      'visibility: hidden;'
  }
}

// Function to update select TDML action
// tdml items need 0 height and width when hidden so there is no large empty space
function updateTDMLAction() {
  var tdmlSelectionBox = document.getElementById('tdmlAction')

  var tdmlSelectedValue =
    tdmlSelectionBox.value == ''
      ? 'none'
      : tdmlSelectionBox.options[tdmlSelectionBox.selectedIndex].value

  if (tdmlSelectedValue !== 'none') {
    document.getElementById('tdmlNameLabel').style =
      'margin-top: 10px; visibility: visible;'
    document.getElementById('tdmlName').style =
      'margin-top: 10px; visibility: visible;'
    document.getElementById('tdmlDescriptionLabel').style =
      'margin-top: 10px; visibility: visible;'
    document.getElementById('tdmlDescription').style =
      'margin-top: 10px; visibility: visible;'
  } else {
    document.getElementById('tdmlNameLabel').style =
      'width: 0px; height: 0px; visibility: hidden;'
    document.getElementById('tdmlName').style =
      'width: 0px; height: 0px; visibility: hidden;'
    document.getElementById('tdmlDescriptionLabel').style =
      'width: 0px; height: 0px; visibility: hidden;'
    document.getElementById('tdmlDescription').style =
      'width: 0px; height: 0px; visibility: hidden;'
  }

  if (tdmlSelectedValue === 'generate') {
    document.getElementById('tdmlPathLabel').style =
      'margin-top: 10px; visibility: visible;'
    document.getElementById('tdmlPath').style =
      'margin-top: 10px; visibility: visible;'
  } else {
    document.getElementById('tdmlPathLabel').style =
      'width: 0px; height: 0px; visibility: hidden;'
    document.getElementById('tdmlPath').style =
      'width: 0px; height: 0px; visibility: hidden;'
  }
}

// Function to update config selected, also display name input box if 'New Config' selected
function updateSelectedConfig() {
  vscode.postMessage({
    command: 'updateConfigValue',
    configIndex: getConfigIndex(),
  })
}

// Function for checking/unchecking a checkbox element
function check(elementId) {
  const element = document.getElementById(elementId)
  element.checked = element.checked ? false : true
}

// Function for saving the settings to a launch.json
function save() {
  var configSelectionBox = document.getElementById('configSelected')
  var configSelectedValue =
    configSelectionBox.options[configSelectionBox.selectedIndex].value
  var updateOrCreate =
    configSelectedValue === 'New Config' ? 'create' : 'update'
  const name =
    configSelectedValue === 'New Config'
      ? document.getElementById('name').value
      : configSelectedValue
  const data = document.getElementById('data').value
  const debugServer = parseInt(document.getElementById('debugServer').value)
  const infosetFormat = document.getElementById('infosetFormat').value
  const infosetOutputFilePath = document.getElementById(
    'infosetOutputFilePath'
  ).value
  const infosetOutputType = document.getElementById('infosetOutputType').value
  const tdmlAction = document.getElementById('tdmlAction').value
  const tdmlName = document.getElementById('tdmlName').value
  const tdmlDescription = document.getElementById('tdmlDescription').value
  const tdmlPath = document.getElementById('tdmlPath').value
  const openHexView = document.getElementById('openHexView').checked
  const openInfosetDiffView = document.getElementById(
    'openInfosetDiffView'
  ).checked
  const openInfosetView = document.getElementById('openInfosetView').checked
  const program = document.getElementById('program').value
  const stopOnEntry = document.getElementById('stopOnEntry').checked
  const trace = document.getElementById('trace').checked
  const useExistingServer = document.getElementById('useExistingServer').checked
  const dataEditorPort = parseInt(
    document.getElementById('dataEditorPort').value
  )
  const dataEditorLogFile = document.getElementById('dataEditorLogFile').value
  const dataEditorLogLevel = document.getElementById('dataEditorLogLevel').value
  const dfdlDebuggerLogFile = document.getElementById(
    'dfdlDebuggerLogFile'
  ).value
  const dfdlDebuggerLogLevel = document.getElementById(
    'dfdlDebuggerLogLevel'
  ).value

  const daffodilDebugClasspath = getDaffodilDebugClasspathString()

  var obj = {
    version: '0.2.0',
    configurations: [
      {
        request: 'launch',
        type: 'dfdl',
        name: name,
        program: program,
        data: data,
        debugServer: debugServer,
        infosetFormat: infosetFormat,
        infosetOutput: {
          type: infosetOutputType,
          path: infosetOutputFilePath,
        },
        tdmlConfig: {
          action: tdmlAction,
          name: tdmlName,
          description: tdmlDescription,
          path: tdmlPath,
        },
        trace: trace,
        stopOnEntry: stopOnEntry,
        useExistingServer: useExistingServer,
        openHexView: openHexView,
        openInfosetView: openInfosetView,
        openInfosetDiffView: openInfosetDiffView,
        daffodilDebugClasspath: daffodilDebugClasspath,
        dataEditor: {
          port: dataEditorPort,
          logging: {
            file: dataEditorLogFile,
            level: dataEditorLogLevel,
          },
        },
        dfdlDebugger: {
          logging: {
            file: dfdlDebuggerLogFile,
            level: dfdlDebuggerLogLevel,
          },
        },
      },
    ],
  }

  vscode.postMessage({
    command: 'saveConfig',
    data: JSON.stringify(obj, null, 4),
    updateOrCreate: updateOrCreate,
  })
}

// Function to update config values in the webview
async function updateConfigValues(config) {
  document.getElementById('name').value = config.name
  document.getElementById('data').value = config.data
  document.getElementById('debugServer').value = parseInt(config.debugServer)
  document.getElementById('infosetFormat').value = config.infosetFormat
    ? config.infosetFormat
    : 'xml'
  document.getElementById('infosetOutputFilePath').value = config.infosetOutput[
    'path'
  ]
    ? config.infosetOutput['path']
    : config.infosetOutputFilePath
  document.getElementById('infosetOutputType').value = config.infosetOutput[
    'type'
  ]
    ? config.infosetOutput['type']
    : config.infosetOutputType
  document.getElementById('tdmlAction').value =
    config['tdmlConfig'] && config.tdmlConfig['action']
      ? config.tdmlConfig['action']
      : config.tdmlAction
  document.getElementById('tdmlName').value =
    config['tdmlConfig'] && config.tdmlConfig['name']
      ? config.tdmlConfig['name']
      : config.tdmlName
  document.getElementById('tdmlDescription').value =
    config['tdmlConfig'] && config.tdmlConfig['description']
      ? config.tdmlConfig['description']
      : config.tdmlDescription
  document.getElementById('tdmlPath').value =
    config['tdmlConfig'] && config.tdmlConfig['path']
      ? config.tdmlConfig['path']
      : config.tdmlPath
  document.getElementById('openHexView').checked = config.openHexView
  document.getElementById('openInfosetDiffView').checked =
    config.openInfosetDiffView
  document.getElementById('openInfosetView').checked = config.openInfosetView
  document.getElementById('program').value = config.program
  document.getElementById('stopOnEntry').checked = config.stopOnEntry
  document.getElementById('trace').checked = config.trace
  document.getElementById('useExistingServer').checked =
    config.useExistingServer
  document.getElementById('dataEditorPort').value = parseInt(
    config.dataEditor.port
  )
  document.getElementById('dataEditorLogFile').value =
    config.dataEditor.logging.file
  document.getElementById('dataEditorLogLevel').value =
    config.dataEditor.logging.level

  document.getElementById('dfdlDebuggerLogFile').value =
    config.dfdlDebugger.file
  document.getElementById('dfdlDebuggerLogLevel').value =
    config.dfdlDebugger.level

  updateInfosetOutputType()
  updateTDMLAction()

  /*
   * Remove all items from the daffodil debug classpath list/table.
   * This ensures that the list/table will only have the items for that
   * config. Also, ensures that the daffodil debug classpath list/table
   * is empty for a new config.
   */
  await clearDaffodilDebugClasspathList()
  if (config.daffodilDebugClasspath !== '') {
    await updateDaffodilDebugClasspathList(config.daffodilDebugClasspath, ':')
  }

  updateInfosetOutputType()
}

// Function for updating the classpath input box
async function updateDaffodilDebugClasspath(message) {
  await updateDaffodilDebugClasspathList(message.value, ',')
}

// Function that gets called by default to create and update the hex web view
;(function main() {
  // Listener for getting messages/data from the extension
  window.addEventListener('message', async (event) => {
    const message = event.data

    switch (message.command) {
      case 'updateConfValues':
        await updateConfigValues(message.configValues)
        break
      case 'dataUpdate':
        document.getElementById('data').value = message.value
        break
      case 'programUpdate':
        document.getElementById('program').value = message.value
        break
      case 'daffodilDebugClasspathUpdate':
        await updateDaffodilDebugClasspath(message)
        break
    }
  })
})()
