/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict'

import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import * as infoset from '../infoset'
import * as launchWizard from '../launchWizard/launchWizard'
import * as dfdlLang from '../language/dfdl'
import * as dfdlExt from '../language/semantics/dfdlExt'
import * as dataEditClient from '../dataEditor'
import * as tdmlEditor from '../tdmlEditor'
import * as rootCompletion from '../rootCompletion'
import { tmpdir } from 'os'
import JSZip from 'jszip'
import { rm } from 'node:fs/promises'

import {
  CancellationToken,
  DebugConfiguration,
  ProviderResult,
  WorkspaceFolder,
} from 'vscode'
import { getDataFileFromFolder, getDebugger } from '../daffodilDebugger'
import { getConfig, getCurrentConfig, getTDMLTestCaseItems } from '../utils'
import { FileAccessor } from './daffodilRuntime'
import { TDMLConfig } from '../classes/tdmlConfig'
import { handleDebugEvent } from './daffodilEvent'
import { InlineDebugAdapterFactory } from './extension'
import {
  appendTestCase,
  readTDMLFileContents,
  getTmpTDMLFilePath,
  copyTestCase,
  TMP_TDML_FILENAME,
} from '../tdmlEditor/utilities/tdmlXmlUtils'
import xmlFormat from 'xml-formatter'
import { CommandsProvider } from '../views/commands'
import * as daffodilDebugErrors from './daffodilDebugErrors'
import { TDMLProvider } from '../tdmlEditor/TDMLProvider'
import { getTestCaseDisplayData } from '../tdmlEditor/utilities/tdmlXmlUtils'

export const outputChannel: vscode.OutputChannel =
  vscode.window.createOutputChannel('Daffodil')

async function createDirectory(directoryPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(directoryPath, { recursive: true })
    console.log(`Directory created successfully at ${directoryPath}`)
  } catch (error) {
    console.error(`Error creating directory:`, error)
    throw error
  }
}

async function copyFileAsync(src: string, dest: string): Promise<void> {
  try {
    // Ensure directory exists first
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })

    await fs.promises.copyFile(src, dest)
    console.log(`'${src}' was copied to '${dest}'`)
  } catch (err) {
    console.error('Error copying file:', err)
    // Propagate the error so callers awaiting this function observe failures
    throw err
  }
}

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

          return normalizePath(path)
        }

        return ''
      })
  }

  return file
}

// Method to normalize the drive letter in a Windows path to a capital letter
// Even when using Windows, when sending a path to the backend that will be used
// to determine the source file for breakpoints/debugging, it must be case-sensitive
function normalizePath(path: string): string {
  if (
    process.platform === 'win32' &&
    path.length > 2 &&
    path.charCodeAt(0) > 97 &&
    path.charCodeAt(0) <= 122 &&
    path.charAt(1) === ':'
  )
    return path.charAt(0).toUpperCase() + path.slice(1)

  return path
}

/**
 * Configures the file path string of an intended TDML save file if the
 * extension is malformed.
 * @param pathStr
 * @returns file path string with a valid TDML file extension.
 */
function validateTDMLFilePath(pathStr: string): string {
  // Create capture groups for the path
  // Capture Group 2 will be all valid extensions potentially chained at the end of the path
  // Capture Group 1 will be the rest of the filename (before the valid extensions)
  const matches = pathStr.match(/(^.*?)((\.tdml|\.tdml\.xml)*)$/i)
  if (matches) {
    // We want to grab the first valid extension found from the previous regex's Capture Group 2
    //    and append that to the filename with TDML extensions stripped (previous regex's Capture Group 1)
    const extMatches = matches[2].match(/^\.tdml.xml|^\.tdml/i)
    return extMatches ? matches[1] + extMatches : matches[1] + '.tdml'
  }
  return pathStr + '.tdml'
}

/** Method to show dialog to save TDML file
 * Details:
 *   Required so that the vscode api commands:
 *     - extension.dfdl-debug.getValidatedTDMLCopyPath
 *   can be sent a file instead of always opening up a prompt.
 */
async function showTDMLSaveDialog(fileRequested, label, title) {
  let file = await vscode.window.showSaveDialog({
    saveLabel: label,
    title: title,
    filters: {
      TDML: ['tdml', 'tdml.xml'],
    },
    defaultUri: fileRequested,
  })
  if (!file) {
    vscode.window.showErrorMessage('No output TDML filename provided')
    return
  }
  return validateTDMLFilePath(normalizePath(file.fsPath))
}

// Function for setting up the commands for Run and Debug file
async function createDebugRunFileConfigs(
  resource: vscode.Uri,
  runOrDebug: String,
  tdmlAction: string | undefined,
  runLast = false
) {
  let targetResource: vscode.Uri | undefined = resource
  let noDebug = runOrDebug === 'run'

  if (!targetResource) {
    if (vscode.window.activeTextEditor) {
      targetResource = vscode.window.activeTextEditor.document.uri
    } else {
      const tdmlUri = TDMLProvider.getDocumentUri()
      if (tdmlUri) {
        targetResource = tdmlUri
      }
    }
  }

  if (targetResource) {
    const normalizedResource = normalizePath(targetResource.fsPath)

    let infosetFile = `${
      path.basename(normalizedResource).split('.')[0]
    }-infoset.xml`
    vscode.window.showInformationMessage(infosetFile)

    let currentConfig = getCurrentConfig()

    if (runLast && currentConfig) {
      vscode.debug.startDebugging(undefined, currentConfig, {
        noDebug: noDebug,
      })
    } else {
      var tdmlConfig: TDMLConfig | undefined = undefined
      var newData: string | undefined = undefined
      var newSchema: string | undefined = normalizedResource

      if (tdmlAction) {
        tdmlConfig = { action: tdmlAction }

        if (tdmlAction === 'execute') {
          tdmlConfig.path = normalizedResource
          newData = undefined
          newSchema = undefined
        }
      }

      const config = getConfig({
        name: 'Run File',
        request: 'launch',
        type: 'dfdl',
        schema: {
          path: newSchema,
          rootName: null,
          rootNamespace: null,
        },
        data: newData,
        infosetFormat: 'xml',
        infosetOutput: {
          type: 'file',
          path: '${workspaceFolder}/' + infosetFile,
        },
        ...(tdmlConfig && { tdmlConfig: tdmlConfig }),
      })

      vscode.debug.startDebugging(undefined, config, { noDebug: noDebug })
    }
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
    vscode.commands.registerCommand('getContext', () => context)
  )
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

        if (!targetResource) {
          if (vscode.window.activeTextEditor) {
            targetResource = vscode.window.activeTextEditor.document.uri
          } else {
            const tdmlUri = TDMLProvider.getDocumentUri()
            if (tdmlUri) {
              targetResource = tdmlUri
            }
          }
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
        createDebugRunFileConfigs(resource, 'debug', 'execute')
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.createTDML',
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
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.zipTDML',
      async (resource: vscode.Uri) => {
        let targetResource: vscode.Uri | undefined = resource
        if (vscode.window.activeTextEditor) {
          targetResource = vscode.window.activeTextEditor.document.uri
        } else {
          const tdmlUri = TDMLProvider.getDocumentUri()
          if (tdmlUri) {
            targetResource = tdmlUri
          }
        }

        const resolvedResource = targetResource

        // create temp zip folder
        let tmpDir = path.dirname(getTmpTDMLFilePath())
        const zipDir = path.posix.join(tmpDir, '_zipdir')
        await createDirectory(zipDir)

        // copy TDML file to zip folder
        await copyFileAsync(
          resolvedResource.fsPath,
          path.posix.join(zipDir, path.basename(resolvedResource.fsPath))
        )

        // read TDML file to see what files are required...
        await readTDMLFileContents(
          path.posix.join(zipDir, path.basename(resolvedResource.fsPath))
        ).then(async (xmlBuffer) => {
          await getTestCaseDisplayData(xmlBuffer).then(
            async (testSuiteData) => {
              // Use for..of so we can await async operations (createDirectory, copies, etc.)
              for (const testCase of testSuiteData.testCases) {
                // create subdir for testcase and wait for it to complete
                const testCaseDir = path.posix.join(
                  zipDir,
                  testCase.testCaseName
                )
                await createDirectory(testCaseDir)
                // copy schema file
                let xsdFile = testCase.testCaseModel
                let xsdFileSrc = path.posix.join(
                  path.dirname(resolvedResource.fsPath),
                  xsdFile
                )
                let xsdFileDest = path.posix.join(
                  testCaseDir,
                  path.basename(xsdFile)
                )
                await copyFileAsync(xsdFileSrc, xsdFileDest)

                // edit path in copied TDML file
                let updatedBuffer = xmlBuffer.replace(
                  `model="${xsdFile}"`,
                  `model="${path.posix.join(testCase.testCaseName, path.basename(xsdFile))}"`
                )
                xmlBuffer = updatedBuffer

                // copy data file
                for (const dataDocuments of testCase.dataDocuments) {
                  const dataFile = path.basename(dataDocuments.trim())
                  const dataFileSrc = path.posix.join(
                    path.dirname(resolvedResource.fsPath),
                    dataDocuments.trim()
                  )
                  const dataFileDest = path.posix.join(
                    testCaseDir,
                    path.basename(dataFile)
                  )
                  await copyFileAsync(dataFileSrc, dataFileDest)

                  // edit path in copied TDML file
                  xmlBuffer = xmlBuffer.replace(
                    dataDocuments.trim(),
                    path.posix.join(testCase.testCaseName, dataFile)
                  )
                }
                // copy infoset files (await each copy)
                for (const dfdlInfosets of testCase.dfdlInfosets) {
                  const infoFile = path.basename(dfdlInfosets.trim())
                  const infoSrc = path.posix.join(
                    path.dirname(resolvedResource.fsPath),
                    dfdlInfosets.trim()
                  )
                  const infoDest = path.posix.join(
                    testCaseDir,
                    path.basename(dfdlInfosets.trim())
                  )
                  await copyFileAsync(infoSrc, infoDest)

                  // edit path in copied TDML file
                  xmlBuffer = xmlBuffer.replace(
                    dfdlInfosets.trim(),
                    path.posix.join(testCase.testCaseName, infoFile)
                  )
                }
              }
            }
          )
          // write updated info back to TDML file
          try {
            // Synchronously writes data to a file, replacing it if it already exists
            fs.writeFileSync(
              path.posix.join(zipDir, path.basename(resolvedResource.fsPath)),
              xmlBuffer,
              { encoding: 'utf8' }
            )
            console.log('Updated schema file written successfully')
          } catch (err) {
            console.error('Error writing updated schema file:', err)
          }
        })

        // zip folders
        const zip = new JSZip()

        // Add the folder content recursively
        console.log('adding folder to zip')
        addFolderToZip(zipDir, zip)

        // Generate, save, and then clean up
        let targetZip = targetResource.fsPath.replace(/tdml$/, 'tdml.zip')
        try {
          const content = await zip.generateAsync({ type: 'nodebuffer' })
          fs.writeFileSync(targetZip, content)
          console.log(`Zip file written successfully: '${targetZip}'`)
          vscode.window.showInformationMessage(
            `Zip file successfully created: '${targetZip}'`
          )
          await rm(zipDir, { recursive: true, force: true })
          console.log(`Temp directory successfully removed: '${zipDir}'`)
        } catch (err) {
          console.error(
            `Error while creating zip file '${targetZip}' or deleting temp directory '${zipDir}': ${err}`
          )
          vscode.window.showErrorMessage(
            `Failed to create zip file: '${targetZip}'`
          )
        }
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
        const retVal = await getFile(
          fileRequested,
          'Select DFDL schema to debug',
          'Select DFDL schema to debug'
        )

        if (!retVal)
          vscode.window.showInformationMessage(
            'Invalid DFDL schema path selected'
          )

        return retVal
      }
    ),
    vscode.commands.registerCommand(
      'extension.dfdl-debug.getDataName',
      async (fileRequested = null) => {
        // Open native file explorer to allow user to select data file from anywhere on their machine
        const retVal = await getFile(
          fileRequested,
          'Select input data file to debug',
          'Select input data file to debug'
        )

        if (!retVal)
          vscode.window.showInformationMessage(
            'Invalid data file path selected'
          )

        return retVal
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
        const retVal = await getFile(
          fileRequested,
          'Select TDML File',
          'Select TDML File'
        )

        if (!retVal)
          vscode.window.showInformationMessage('Invalid TDML Path selected')

        return retVal
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
      async (tdmlConfigPath) => {
        // get test case name options for dropdown
        const test_case_names: string[] = getTDMLTestCaseItems(tdmlConfigPath)

        if (test_case_names.length == 0) {
          vscode.window.showInformationMessage(
            'No test cases found in TDML file.'
          )
          return
        }

        // Await showQuickPick directly and return the result
        const retVal = await vscode.window.showQuickPick(test_case_names, {
          placeHolder: 'Test Case Name',
        })

        if (!retVal)
          vscode.window.showInformationMessage('Invalid TDML Name selected')

        return retVal
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

    // default schema path and data paths to ask for file prompts if they are null, undefined, or '' in launch.json config
    config = {
      ...config,
      schema: {
        ...config.schema,
        path: config.schema?.path || '${command:AskForSchemaName}',
      },
      data: config.data || '${command:AskForDataName}',
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
      config.tdmlConfig?.action !== 'execute' &&
      vscode.workspace.workspaceFolders &&
      dataFolder !== vscode.workspace.workspaceFolders[0].uri.fsPath &&
      dataFolder.split('.').length === 1 &&
      fs.lstatSync(dataFolder).isDirectory()
    ) {
      return getDataFileFromFolder(dataFolder).then((dataFile) => {
        config.data = dataFile
        return getDebugger(this.context, config).then((_) => {
          return getCurrentConfig()
        })
      })
    }

    return getDebugger(this.context, config).then((_) => {
      return getCurrentConfig()
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

/**
 * Recursively adds files and folders to a JSZip instance.
 * @param dirPath The folder to add
 * @param zip The JSZip instance
 */
function addFolderToZip(dirPath: string, zip: JSZip) {
  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.posix.join(dirPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      // Create a subfolder in the ZIP and recurse
      const subFolder = zip.folder(file)
      if (subFolder) {
        addFolderToZip(filePath, subFolder)
      }
    } else {
      // Read file data and add to current zip/folder
      const fileData = fs.readFileSync(filePath)
      zip.file(file, fileData)
    }
  }
}
