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
  provideVSCodeDesignSystem,
  vsCodeDataGrid,
  vsCodeDataGridCell,
  vsCodeDataGridRow,
  vsCodeButton,
} from '@vscode/webview-ui-toolkit'
const vscode = acquireVsCodeApi()
provideVSCodeDesignSystem().register(
  vsCodeDataGrid(),
  vsCodeDataGridRow(),
  vsCodeDataGridCell(),
  vsCodeButton()
)
let currentRowData = null
;(function () {
  const grid = document.getElementById('TDML-table')

  initEditableDataGrid()

  function initEditableDataGrid() {
    grid.oncontextmenu = cellRightClick
    grid?.addEventListener('cell-focused', (e) => {
      const cell = e.target
      // Do not continue if `cell` is undefined/null or is not a grid cell
      if (!cell || cell.role !== 'gridcell') {
        return
      }

      // Do not allow data grid header cells to be editable
      if (cell.className === 'column-header') {
        return
      }

      // Note: Need named closures in order to later use removeEventListener
      // in the handleBlurClosure function
      const handleKeydownClosure = (e) => {
        handleKeydown(e, cell)
      }
      const handleClickClosure = () => {
        setCellEditable(cell)
      }
      const handleBlurClosure = () => {
        syncCellChanges(cell)
        unsetCellEditable(cell)
        // Remove the blur, keydown, and click event listener _only after_
        // the cell is no longer focused
        cell.removeEventListener('blur', handleBlurClosure)
        cell.removeEventListener('keydown', handleKeydownClosure)
        cell.removeEventListener('click', handleClickClosure)
      }

      cell.addEventListener('keydown', handleKeydownClosure)
      cell.addEventListener('click', handleClickClosure)
      cell.addEventListener('blur', handleBlurClosure)
    })
  }

  // Handle keyboard events on a given cell
  function handleKeydown(e, cell) {
    if (
      !cell.hasAttribute('contenteditable') ||
      cell.getAttribute('contenteditable') === 'false'
    ) {
      if (e.key === 'Enter') {
        e.preventDefault()
        setCellEditable(cell)
      }
    } else {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        syncCellChanges(cell)
        unsetCellEditable(cell)
      }
    }
  }

  // Make a given cell editable
  function setCellEditable(cell) {
    //We don't want to be able to edit cells currently, but possibly in the future
    //So we have this code in here, but this line disables the editing functions
    cell.setAttribute('contenteditable', 'false')
  }

  // Make a given cell non-editable
  function unsetCellEditable(cell) {
    cell.setAttribute('contenteditable', 'false')
  }

  // Syncs changes made in an editable cell with the
  // underlying data structure of a vscode-data-grid
  function syncCellChanges(cell) {
    const column = cell.columnDefinition
    const row = cell.rowData

    if (column && row) {
      const originalValue = row[column.columnDataKey]
      const newValue = cell.innerText

      if (originalValue !== newValue) {
        row[column.columnDataKey] = newValue
        sendLog(
          'Value changed...Original value: ' +
            originalValue +
            '; ' +
            'New value: ' +
            newValue
        )
        refreshTDMLData()
      }
    }
  }

  function cellRightClick(cell) {
    const sourceElement = cell.target
    currentRowData = sourceElement._rowData
  }

  window.addEventListener('message', (event) => {
    const message = event.data
    switch (message.type) {
      case 'update':
        const text = message.text
        if (text !== vscode.getState()?.text) {
          updateContent(text)
        }

        vscode.setState({ text })

        return
      case 'delete':
        sendLog('Deleting test: ' + JSON.stringify(currentRowData))
        if (currentRowData) {
          const index = grid.rowsData.indexOf(currentRowData)
          if (index > -1) {
            grid.rowsData.splice(index, 1)
            refreshTDMLData()
          }
        } else {
          vscode.postMessage({
            type: 'info',
            message: `No selected resource selected. Please select a resource to delete.`,
          })
        }
        return
      case 'add':
        sendLog(`Adding new test`)
        if (message.testCaseName) {
          const index = grid.rowsData.findIndex(
            (x) => x.testCaseName === message.testCaseName
          )
          if (index === -1) {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            grid.rowsData.push({
              TestCaseName: message.testCaseName,
              TestCaseModel: message.testCaseModel,
              TestCaseDescription: message.testCaseDescription,
              DataDocuments: message.dataDocuments,
              dfdlInfosets: message.dfdlInfosets,
            })
            refreshTDMLData()
          } else {
            // create vscode notification
            vscode.postMessage({
              type: 'error',
              message: `Key "${message.key}" already exists.`,
            })
          }
        }
        return
    }
  })

  //TODO I believe this is the function that actual takes updates and puts them into the text file
  function refreshTDMLData() {
    var obj = {}
    for (var i = 0; i < grid.rowsData.length; i++) {
      var testCaseName = grid.rowsData[i].testCaseName
      var testCaseModel = grid.rowsData[i].testCaseModel
      var testCaseDescription = grid.rowsData[i].testCaseDescription
      var testCaseDfdlInfoset = grid.rowsData[i].dfdlInfoset
      var testCaseDataDocs = grid.rowsData[i].DataDocuments
      obj[testCaseName] = {
        testCaseModel: testCaseModel,
        testCaseDescription: testCaseDescription,
        dfdlInfoset: testCaseDfdlInfoset,
        dataDocs: testCaseDataDocs,
      }
    }

    vscode.setState({ text: JSON.stringify(obj) })
    vscode.postMessage({
      type: 'update',
      json: JSON.stringify(obj),
    })
  }

  function sendLog(message) {
    vscode.postMessage({
      type: 'log',
      message: message,
    })
  }

  // Expect already parsed tdml data to be passed. Don't want to call the TS function from here
  // unless using postMessages
  async function updateContent(/** @type {string} **/ text) {
    let tdmlValues = []
    if (text) {
      let tdmlXmlParsed = text
      for (let i = 0; i < tdmlXmlParsed.testCases.length; i++) {
        if (tdmlXmlParsed.testCases[i]) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tdmlValues.push({
            TestCaseName: tdmlXmlParsed.testCases[i].testCaseName,
            TestCaseModel: tdmlXmlParsed.testCases[i].testCaseModel,
            TestCaseDescription: tdmlXmlParsed.testCases[i].testCaseDescription,
            DataDocuments: tdmlXmlParsed.testCases[i].dataDocuments,
            dfdlInfosets: tdmlXmlParsed.testCases[i].dfdlInfosets,
          })
        } else {
          console.log('node is undefined or null')
        }
      }

      grid.rowsData = tdmlValues
    } else {
      console.log('text is null')
      return
    }
  }

  const state = vscode.getState()
  if (state) {
    updateContent(state.text)
  }
})()
