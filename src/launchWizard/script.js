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
    document.getElementById('copyLaunchConfigButton').style =
      'visibility: hidden;'
  } else {
    document.getElementById('nameLabel').style = 'visibility: hidden;'
    document.getElementById('copyLaunchConfigButton').style =
      'visibility: visible;'
  }

  return configSelectedValue === 'New Config'
    ? -1
    : configSelectionBox.selectedIndex
}

function getConfigValues() {
  var configSelectionBox = document.getElementById('configSelected')
  var configSelectedValue =
    configSelectionBox.options[configSelectionBox.selectedIndex].value
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
  const tdmlPath = document.getElementById('tdmlPath').value
  const openDataEditor = document.getElementById('openDataEditor').checked
  const openInfosetDiffView = document.getElementById(
    'openInfosetDiffView'
  ).checked
  const openInfosetView = document.getElementById('openInfosetView').checked
  const schema = document.getElementById('schema').value
  const stopOnEntry = document.getElementById('stopOnEntry').checked
  const trace = document.getElementById('trace').checked
  const useExistingServer = document.getElementById('useExistingServer').checked
  const dataEditorPort = parseInt(
    document.getElementById('dataEditorPort').value
  )
  const dataEditorLogFile = document.getElementById('dataEditorLogFile').value
  const dataEditorLogLevel = document.getElementById('dataEditorLogLevel').value
  const dfdlDaffodilVersion = document.getElementById(
    'dfdlDaffodilVersion'
  ).value
  const dfdlDebuggerTimeout = document.getElementById(
    'dfdlDebuggerTimeout'
  ).value
  const dfdlDebuggerLogFile = document.getElementById(
    'dfdlDebuggerLogFile'
  ).value
  const dfdlDebuggerLogLevel = document.getElementById(
    'dfdlDebuggerLogLevel'
  ).value
  const rootName =
    document.getElementById('rootName').value == 'null'
      ? null
      : document.getElementById('rootName').value
  const rootNamespace =
    document.getElementById('rootNamespace').value == 'null'
      ? null
      : document.getElementById('rootNamespace').value

  const daffodilDebugClasspath = getDaffodilDebugClasspathArray()

  return {
    name,
    data,
    debugServer,
    infosetFormat,
    infosetOutputFilePath,
    infosetOutputType,
    tdmlAction,
    tdmlName,
    tdmlPath,
    openDataEditor,
    openInfosetDiffView,
    openInfosetView,
    schema,
    stopOnEntry,
    trace,
    useExistingServer,
    dataEditorPort,
    dataEditorLogFile,
    dataEditorLogLevel,
    dfdlDaffodilVersion,
    dfdlDebuggerTimeout,
    dfdlDebuggerLogFile,
    dfdlDebuggerLogLevel,
    daffodilDebugClasspath,
    rootName,
    rootNamespace,
  }
}

// Function get daffodil debug classpath
function getDaffodilDebugClasspathArray() {
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
}

// Function to call extension to open file picker
function filePicker(id, description) {
  let extraData = {}
  if (id === 'daffodilDebugClasspath') {
    extraData['daffodilDebugClasspath'] = getDaffodilDebugClasspathArray()
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
  let itemArray = delimeter !== undefined ? data.split(delimeter) : data

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
  } else {
    document.getElementById('tdmlNameLabel').style =
      'width: 0px; height: 0px; visibility: hidden;'
    document.getElementById('tdmlName').style =
      'width: 0px; height: 0px; visibility: hidden;'
  }

  if (tdmlSelectedValue === 'execute') {
    document.getElementById('tdmlPathLabel').style =
      'margin-top: 10px; visibility: visible;'
    document.getElementById('tdmlPath').style =
      'margin-top: 10px; visibility: visible;'

    // Catch case when we switch from another TDML action to execute and it shows undefined b/c path is not in tdmlConfig object
    if (document.getElementById('tdmlPath').value === 'undefined') {
      document.getElementById('tdmlPath').value = ''
    }
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

  const configValues = getConfigValues()

  var obj = {
    version: '0.2.0',
    configurations: [
      {
        request: 'launch',
        type: 'dfdl',
        name: configValues.name,
        schema: {
          path: configValues.schema,
          rootName: configValues.rootName,
          rootNamespace: configValues.rootNamespace,
        },
        data: configValues.data,
        debugServer: configValues.debugServer,
        infosetFormat: configValues.infosetFormat,
        infosetOutput: {
          type: configValues.infosetOutputType,
          path: configValues.infosetOutputFilePath,
        },
        tdmlConfig: {
          action: configValues.tdmlAction,
          // Additional fields are added below
        },
        trace: configValues.trace,
        stopOnEntry: configValues.stopOnEntry,
        useExistingServer: configValues.useExistingServer,
        openDataEditor: configValues.openDataEditor,
        openInfosetView: configValues.openInfosetView,
        openInfosetDiffView: configValues.openInfosetDiffView,
        daffodilDebugClasspath: configValues.daffodilDebugClasspath,
        dataEditor: {
          port: configValues.dataEditorPort,
          logging: {
            file: configValues.dataEditorLogFile,
            level: configValues.dataEditorLogLevel,
          },
        },
        dfdlDebugger: {
          daffodilVersion: configValues.dfdlDaffodilVersion,
          timeout: configValues.dfdlDebuggerTimeout,
          logging: {
            file: configValues.dfdlDebuggerLogFile,
            level: configValues.dfdlDebuggerLogLevel,
          },
        },
      },
    ],
  }

  // Add relevant TDML properties based on action specified
  switch (configValues.tdmlAction) {
    case 'none':
      break
    case 'execute':
      obj.configurations[0].tdmlConfig.path = configValues.tdmlPath
    case 'generate':
      obj.configurations[0].tdmlConfig.name = configValues.tdmlName
      break
    default:
      throw new Error(
        'Unable to save configuration item in launch.json. tdmlAction save actions not defined!'
      )
  }

  vscode.postMessage({
    command: 'saveConfig',
    data: JSON.stringify(obj, null, 4),
    updateOrCreate: updateOrCreate,
  })
}

// Function to copy selected config
function copyConfig() {
  const configValues = getConfigValues()

  var obj = {
    version: '0.2.0',
    configurations: [
      {
        request: 'launch',
        type: 'dfdl',
        name: `${configValues.name}`,
        schema: {
          path: configValues.schema,
          rootName: configValues.rootName,
          rootNamespace: configValues.rootNamespace,
        },
        data: configValues.data,
        debugServer: configValues.debugServer,
        infosetFormat: configValues.infosetFormat,
        infosetOutput: {
          type: configValues.infosetOutputType,
          path: configValues.infosetOutputFilePath,
        },
        tdmlConfig: {
          action: configValues.tdmlAction,
          name: configValues.tdmlName,
          path: configValues.tdmlPath,
        },
        trace: configValues.trace,
        stopOnEntry: configValues.stopOnEntry,
        useExistingServer: configValues.useExistingServer,
        openDataEditor: configValues.openDataEditor,
        openInfosetView: configValues.openInfosetView,
        openInfosetDiffView: configValues.openInfosetDiffView,
        daffodilDebugClasspath: configValues.daffodilDebugClasspath,
        dataEditor: {
          port: configValues.dataEditorPort,
          logging: {
            file: configValues.dataEditorLogFile,
            level: configValues.dataEditorLogLevel,
          },
        },
        dfdlDebugger: {
          daffodilVersion: configValues.dfdlDaffodilVersion,
          timeout: configValues.dfdlDebuggerTimeout,
          logging: {
            file: configValues.dfdlDebuggerLogFile,
            level: configValues.dfdlDebuggerLogLevel,
          },
        },
      },
    ],
  }

  vscode.postMessage({
    command: 'copyConfig',
    data: JSON.stringify(obj, null, 4),
  })
}

// Function to update config values in the webview
async function updateConfigValues(config) {
  document.getElementById('name').value = config.name
  document.getElementById('data').value = config.data
  document.getElementById('rootName').value = config.schema.rootName
  document.getElementById('rootNamespace').value = config.schema.rootNamespace
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
  document.getElementById('tdmlPath').value =
    config['tdmlConfig'] && config.tdmlConfig['path']
      ? config.tdmlConfig['path']
      : config.tdmlPath
  document.getElementById('openDataEditor').checked = config.openDataEditor
  document.getElementById('openInfosetDiffView').checked =
    config.openInfosetDiffView
  document.getElementById('openInfosetView').checked = config.openInfosetView
  document.getElementById('schema').value = config.schema.path
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

  document.getElementById('dfdlDaffodilVersion').value =
    config.dfdlDebugger.daffodilVersion
  document.getElementById('dfdlDebuggerTimeout').value =
    config.dfdlDebugger.timeout
  document.getElementById('dfdlDebuggerLogFile').value =
    config.dfdlDebugger.logging.file
  document.getElementById('dfdlDebuggerLogLevel').value =
    config.dfdlDebugger.logging.level

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
    await updateDaffodilDebugClasspathList(config.daffodilDebugClasspath)
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
      case 'schemaUpdate':
        document.getElementById('schema').value = message.value
        break
      case 'daffodilDebugClasspathUpdate':
        await updateDaffodilDebugClasspath(message)
        break
    }
  })
})()
