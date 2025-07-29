/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict'

import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import * as infoset from 'infoset'
import * as launchWizard from 'launchWizard'
import * as dfdlLang from 'language/dfdl'
import * as dfdlExt from 'language/semantics/dfdlExt'
import * as dataEditClient from 'dataEditor'
import * as tdmlEditor from 'tdmlEditor'
import * as rootCompletion from 'rootCompletion'
import { tmpdir } from 'os'

import {
  CancellationToken,
  DebugConfiguration,
  ProviderResult,
  WorkspaceFolder,
} from 'vscode'
import { getDataFileFromFolder, getDebugger } from '../daffodilDebugger'
import {
  getConfig,
  getCurrentConfig,
  getTDMLTestCaseItems,
  setCurrentConfig,
} from '../utils'
import { FileAccessor } from './daffodilRuntime'
import { TDMLConfig } from '../classes/tdmlConfig'
import { handleDebugEvent } from './daffodilEvent'
import { InlineDebugAdapterFactory } from './extension'
import {
  appendTestCase,
  getTmpTDMLFilePath,
  copyTestCase,
  TMP_TDML_FILENAME,
} from 'tdmlEditor/utilities/tdmlXmlUtils'
import xmlFormat from 'xml-formatter'
import { CommandsProvider } from '../views/commands'
import * as daffodilDebugErrors from './daffodilDebugErrors'

export const outputChannel: vscode.OutputChannel =
  vscode.window.createOutputChannel('Daffodil')

/** Method to file path for schema and data
 * Details:
 *   Required so that the vscode api commands:
 *     - extension.dfdl-debug.getSchemaName
 *     - extension.dfdl-debug.getDataName
 *   can be sent a file instead of always opening up a prompt.
 *   Always makes it so the vscode api commands above are able
 *   to be tested inside of the test suite
 */
async function getFile(fileRequested, label, title) {
  let file = ''

  if (fileRequested && fs.existsSync(fileRequested)) {
    file = fileRequested
  } else if (fileRequested && !fs.existsSync(fileRequested)) {
    file = ''
  } else {
    file = await vscode.window
      .showOpenDialog({
        canSelectMany: false,
        openLabel: label,
        canSelectFiles: true,
        canSelectFolders: false,
        title: title,
      })
      .then((fileUri) => {
        if (fileUri && fileUri[0]) {
          let path = fileUri[0].fsPath

          if (
            process.platform === 'win32' &&
            path.length > 2 &&
            path.charCodeAt(0) > 97 &&
            path.charCodeAt(0) <= 122 &&
            path.charAt(1) === ':'
          ) {
            path = path.charAt(0).toUpperCase() + path.slice(1)
          }

          return path
        }

        return ''
      })
  }

  return file
}

/** Method to show dialog to save TDML file
 * Details:
 *   Required so that the vscode api commands:
 *     - extension.dfdl-debug.getValidatedTDMLCopyPath
 *   can be sent a file instead of always opening up a prompt.
 */
async function showTDMLSaveDialog(fileRequested, label, title) {
  let file = ''

  file = await vscode.window
    .showSaveDialog({
      saveLabel: label,
      title: title,
      filters: {
        TDML: ['tdml'],
      },
    })
    .then((fileUri) => {
      if (fileUri) {
        let path = fileUri.fsPath

        if (
          process.platform === 'win32' &&
          path.length > 2 &&
          path.charCodeAt(0) > 97 &&
          path.charCodeAt(0) <= 122 &&
          path.charAt(1) === ':'
        ) {
          path = path.charAt(0).toUpperCase() + path.slice(1)
        }

        return path
      }

      return ''
    })

  return file
}

// Function for setting up the commands for Run and Debug file
async function createDebugRunFileConfigs(
  resource: vscode.Uri,
  runOrDebug: String,
  tdmlAction: String | undefined,
  runLast = false
) {
  let targetResource = resource
  let noDebug = runOrDebug === 'run'

  if (!targetResource && vscode.window.activeTextEditor) {
    targetResource = vscode.window.activeTextEditor.document.uri
  }
  if (targetResource) {
    let infosetFile = `${
      path.basename(targetResource.fsPath).split('.')[0]
    }-infoset.xml`
    vscode.window.showInformationMessage(infosetFile)

    let currentConfig = getCurrentConfig()

    if (runLast && currentConfig) {
      vscode.debug.startDebugging(undefined, currentConfig, {
        noDebug: noDebug,
      })
    } else {
      var tdmlConfig = <TDMLConfig>{}

      if (tdmlAction) {
        tdmlConfig.action = tdmlAction

        if (tdmlAction === 'execute') {
          tdmlConfig.path = targetResource.fsPath
        }
      }

      const config = getConfig({
        name: 'Run File',
        request: 'launch',
        type: 'dfdl',
        schema: {
          path: tdmlConfig.action === 'execute' ? '' : targetResource.fsPath,
          rootName: null,
          rootNamespace: null,
        },
        data:
          tdmlConfig.action === 'execute' ? '' : '${command:AskForDataName}',
        debugServer: false,
        infosetFormat: 'xml',
        infosetOutput: {
          type: 'file',
          path: '${workspaceFolder}/' + infosetFile,
        },
        tdmlConfig: tdmlConfig,
      })

      // If we're calling execute TDML from a .tdml file
      // set the name and the description of the TDML test case we want
      // before running the debugger
      if (
        typeof config.tdmlConfig?.path === 'string' &&
        path.extname(config.tdmlConfig?.path).toLowerCase() == '.tdml' &&
        typeof config.tdmlConfig?.action === 'string' &&
        config.tdmlConfig?.action.toLowerCase() == 'execute'
      ) {
        config.tdmlConfig.name = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getTDMLName',
          config
        )

        config.tdmlConfig.description = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getTDMLDescription',
          config
        )
      }
      vscode.debug.startDebugging(undefined, config, { noDebug: noDebug })
    }

    vscode.debug.onDidTerminateDebugSession(async () => {
      if (!vscode.workspace.workspaceFolders) {
        return
      }

      vscode.workspace
        .openTextDocument(
          `${vscode.workspace.workspaceFolders[0].uri.fsPath}/${infosetFile}`
        )
        .then((doc) => {
          vscode.window.showTextDocument(doc)
        })
    })
  }
}

function setupViews(context: vscode.ExtensionContext) {
  new CommandsProvider().register(context)
}
export function activateDaffodilDebug(
  context: vscode.ExtensionContext,
  factory?: vscode.DebugAdapterDescriptorFactory
) {
  setupViews(context)

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.runEditorContents',
      (resource: vscode.Uri) => {
        createDebugRunFileConfigs(resource, 'run', undefined)
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.debugEditorContents',
      (resource: vscode.Uri) => {
        createDebugRunFileConfigs(resource, 'debug', undefined)
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.debugLastEditorContents',
      (resource: vscode.Uri) => {
        createDebugRunFileConfigs(resource, 'debug', undefined, true)
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.appendTDML',
      async (resource: vscode.Uri) => {
        if (!fs.existsSync(getTmpTDMLFilePath())) {
          vscode.window.showErrorMessage(
            `TDML ERROR: Test suite not found. Ensure that the TDML action is set to "generate" for your DFDL debugging launch configuration before appending.`
          )
          console.error(
            `TDML ERROR: Test suite not found. ${TMP_TDML_FILENAME} was not found in ${tmpdir()} for Append TDML operation.`
          )
          return
        }

        let targetResource = resource

        if (!targetResource && vscode.window.activeTextEditor) {
          targetResource = vscode.window.activeTextEditor.document.uri
        }
        if (targetResource) {
          appendTestCase(getTmpTDMLFilePath(), targetResource.fsPath)
            .then((appendedBuffer) => {
              fs.writeFileSync(targetResource.fsPath, xmlFormat(appendedBuffer))
            })
            .catch((reason) => {
              // Not sure if we need to do something different/more here
              console.log(reason)
            })
        }
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.executeTDML',
      (resource: vscode.Uri) => {
        createDebugRunFileConfigs(resource, 'run', 'execute')
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.copyTDML',
      async (_) => {
        if (!fs.existsSync(getTmpTDMLFilePath())) {
          vscode.window.showErrorMessage(
            `TDML ERROR: Test suite not found. Ensure that the TDML action is set to "generate" for your DFDL debugging launch configuration before copying.`
          )
          console.error(
            `TDML ERROR: Test suite not found. ${TMP_TDML_FILENAME} was not found in ${tmpdir()} for Copy TDML operation.`
          )
          return
        }

        // Ask for destination path
        // Copy file in /tmp to destination path
        // TDMLConfig.path should not be used here because that only matters when sending to the server
        // We could make it so that if someone wants to specify the path and set the action to 'copy', but
        //   that doesn't make a whole lot of sense.
        let targetResource = await vscode.commands.executeCommand(
          'extension.dfdl-debug.getValidatedTDMLCopyPath'
        )

        // Is there a better way of error checking this?
        if (targetResource) {
          copyTestCase(
            getTmpTDMLFilePath(),
            targetResource as unknown as string
          )
            .then((copiedBuffer) => {
              fs.writeFileSync(
                targetResource as unknown as string,
                xmlFormat(copiedBuffer)
              )
            })
            .catch((reason) => {
              // Not sure if we need to do something different/more here
              console.log(reason)
            })
        }

        // fs.copyFile(
        //   getTmpTDMLFilePath(),
        //   targetResource as unknown as string,
        //   (_) => {}
        // )
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.toggleFormatting',
      (_) => {
        const ds = vscode.debug.activeDebugSession
        if (ds) {
          ds.customRequest('toggleFormatting')
        }
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getSchemaName',
      async (fileRequested = null) => {
        // Open native file explorer to allow user to select data file from anywhere on their machine
        return await getFile(
          fileRequested,
          'Select DFDL schema to debug',
          'Select DFDL schema to debug'
        )
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getDataName',
      async (fileRequested = null) => {
        // Open native file explorer to allow user to select data file from anywhere on their machine
        return await getFile(
          fileRequested,
          'Select input data file to debug',
          'Select input data file to debug'
        )
      }
    ),
    vscode.commands.registerCommand('extension.dfdl-debug.showLogs', () => {
      outputChannel.show(true)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getValidatedTDMLPath',
      async (fileRequested = null) => {
        // Open native file explorer to allow user to select data file from anywhere on their machine
        return await getFile(
          fileRequested,
          'Select TDML File',
          'Select TDML File'
        )
      }
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getValidatedTDMLCopyPath',
      async (fileRequested = null) => {
        // Open native file explorer to allow user to select data file from anywhere on their machine
        if (fileRequested && fs.existsSync(fileRequested)) {
          return fileRequested
        } else if (fileRequested && !fs.existsSync(fileRequested)) {
          return ''
        } else {
          return await showTDMLSaveDialog(
            fileRequested,
            'Save TDML File',
            'Save TDML File'
          )
        }
      }
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getTDMLName',
      async (config) => {
        // Config item gets passed

        // get test case name options for dropdown
        const test_case_names: string[] = getTDMLTestCaseItems(
          config?.tdmlConfig?.path
        )
          .filter((obj) => typeof obj.name == 'string')
          .map((obj) => obj.name) as string[]

        // dropdown
        // Await showQuickPick directly and return the result
        const selection = await vscode.window.showQuickPick(test_case_names, {
          placeHolder: 'Test Case Name',
        })

        return selection
      }
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getTDMLDescription',
      async (config) => {
        // Config item gets passed

        // get unique test case description options for dropdown as it may be possible for overlapping description
        const test_case_unique_descriptions: string[] = [
          ...new Set(
            getTDMLTestCaseItems(config?.tdmlConfig?.path)
              .filter((obj) => typeof obj.description == 'string')
              .map((obj) => obj.description)
          ),
        ] as string[]

        // Await showQuickPick directly and return the result
        const selection = await vscode.window.showQuickPick(
          test_case_unique_descriptions,
          {
            placeHolder: 'Test Case Description',
          }
        )

        return selection
      }
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getTDMLPath',
      async (_) => {
        return await vscode.window
          .showInputBox({
            prompt: 'TDML File: ',
            value: '${workspaceFolder}/infoset.tdml',
          })
          .then((value) => {
            return value
          })
      }
    )
  )

  // register a configuration provider for 'dfdl' debug type
  const provider = new DaffodilConfigurationProvider(context)
  context.subscriptions.push(
    // register a configuration provider for 'dfdl' debug type
    vscode.debug.registerDebugConfigurationProvider('dfdl', provider),
    // register a dynamic configuration provider for 'dfdl' debug type
    vscode.debug.registerDebugConfigurationProvider(
      'dfdl',
      {
        provideDebugConfigurations(
          folder: WorkspaceFolder | undefined
        ): ProviderResult<DebugConfiguration[]> {
          if (!vscode.workspace.workspaceFolders) {
            return [
              getConfig({
                name: 'Daffodil Launch',
                request: 'launch',
                type: 'dfdl',
                schema: {
                  path: '${file}',
                  rootName: null,
                  rootNamespace: null,
                },
                data: '${command:AskForDataName}',
                debugServer: false,
                infosetFormat: 'xml',
                infosetOutput: {
                  type: 'file',
                  path: '${file}-infoset.xml',
                },
              }),
            ]
          }

          let targetResource = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.document.uri
            : vscode.workspace.workspaceFolders[0].uri
          let infosetFile = `${
            path.basename(targetResource.fsPath).split('.')[0]
          }-infoset.xml`

          return [
            getConfig({
              name: 'Daffodil Launch',
              request: 'launch',
              type: 'dfdl',
              schema: {
                path: '${file}',
                rootName: null,
                rootNamespace: null,
              },
              data: '${command:AskForDataName}',
              debugServer: false,
              infosetFormat: 'xml',
              infosetOutput: {
                type: 'file',
                path: '${workspaceFolder}/' + infosetFile,
              },
            }),
          ]
        },
      },
      vscode.DebugConfigurationProviderTriggerKind.Dynamic
    )
  )

  if (!factory) {
    factory = new InlineDebugAdapterFactory(context)
  }
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory('dfdl', factory)
  )
  if ('dispose' in factory) {
    context.subscriptions.push(factory as vscode.Disposable)
  }

  context.subscriptions.push(
    // override VS Code's default implementation of the debug hover
    vscode.languages.registerEvaluatableExpressionProvider('xml', {
      provideEvaluatableExpression(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.EvaluatableExpression> {
        const wordRange = document.getWordRangeAtPosition(position)
        return wordRange
          ? new vscode.EvaluatableExpression(wordRange)
          : undefined
      },
    }),
    // override VS Code's default implementation of the "inline values" feature"
    vscode.languages.registerInlineValuesProvider('xml', {
      provideInlineValues(
        document: vscode.TextDocument,
        viewport: vscode.Range,
        context: vscode.InlineValueContext
      ): vscode.ProviderResult<vscode.InlineValue[]> {
        const allValues: vscode.InlineValue[] = []

        for (
          let l = viewport.start.line;
          l <= context.stoppedLocation.end.line;
          l++
        ) {
          const line = document.lineAt(l)
          var regExp = /local_[ifso]/gi // match variables of the form local_i, local_f, Local_i, LOCAL_S...
          do {
            var m = regExp.exec(line.text)
            if (m) {
              const varName = m[0]
              const varRange = new vscode.Range(
                l,
                m.index,
                l,
                m.index + varName.length
              )

              // value found via variable lookup
              allValues.push(
                new vscode.InlineValueVariableLookup(varRange, varName, false)
              )
            }
          } while (m)
        }

        return allValues
      },
    })
  )

  context.subscriptions.push(
    vscode.debug.onDidReceiveDebugSessionCustomEvent(handleDebugEvent)
  )

  dfdlLang.activate(context)
  dfdlExt.activate(context)
  infoset.activate(context)
  dataEditClient.activate(context)
  launchWizard.activate(context)
  tdmlEditor.activate(context)
  rootCompletion.activate(context)

  daffodilDebugErrors.activate()
}

class DaffodilConfigurationProvider
  implements vscode.DebugConfigurationProvider
{
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    token?: CancellationToken
  ): ProviderResult<DebugConfiguration> {
    // if launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      config = getConfig({ name: 'Launch', request: 'launch', type: 'dfdl' })
    }

    if (!config.debugServer) {
      config.debugServer = 4711
    }

    if (!config.schema) {
      return vscode.window
        .showInformationMessage('Cannot find a schema to debug')
        .then((_) => {
          return undefined // abort launch
        })
    }

    let dataFolder = config.data

    if (
      dataFolder.includes('${workspaceFolder}') &&
      vscode.workspace.workspaceFolders &&
      dataFolder.split('.').length === 1
    ) {
      dataFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
    }

    if (
      !dataFolder.includes('${command:AskForSchemaName}') &&
      !dataFolder.includes('${command:AskForDataName}') &&
      !dataFolder.includes('${workspaceFolder}') &&
      config.tdmlConfig.action !== 'execute' &&
      vscode.workspace.workspaceFolders &&
      dataFolder !== vscode.workspace.workspaceFolders[0].uri.fsPath &&
      dataFolder.split('.').length === 1 &&
      fs.lstatSync(dataFolder).isDirectory()
    ) {
      return getDataFileFromFolder(dataFolder).then((dataFile) => {
        config.data = dataFile
        return getDebugger(this.context, config).then((updatedConfig) => {
          return setCurrentConfig(updatedConfig ?? config)
        })
      })
    }

    return getDebugger(this.context, config).then((updatedConfig) => {
      return setCurrentConfig(updatedConfig ?? config)
    })
  }
}

export const workspaceFileAccessor: FileAccessor = {
  async readFile(path: string) {
    try {
      const uri = vscode.Uri.file(path)
      const bytes = await vscode.workspace.fs.readFile(uri)
      const contents = Buffer.from(bytes).toString('utf8')
      return contents
    } catch (e) {
      try {
        const uri = vscode.Uri.parse(path)
        const bytes = await vscode.workspace.fs.readFile(uri)
        const contents = Buffer.from(bytes).toString('utf8')
        return contents
      } catch (e) {
        return `cannot read '${path}'`
      }
    }
  },
}
