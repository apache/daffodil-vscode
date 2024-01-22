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
import { Uri, workspace } from 'vscode'
import { Config, ConfigJSON, IConfig } from './Config'
import XDGAppPaths from 'xdg-app-paths'
import path from 'path'

export const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()
export function addToAppDataPath(filename: string): string {
  return path.join(APP_DATA_PATH, filename)
}
export const rootPath: string = workspace.workspaceFolders
  ? workspace.workspaceFolders[0].uri.fsPath
  : Uri.parse('').fsPath

function queryConfigurationsArray(): Array<Object> | undefined {
  return workspace
    .getConfiguration('launch')
    .get<Array<Object>>('configurations')
}

function extractDataEditorConfigFromQuery(
  configurationsQuery: Array<Object>
): ConfigJSON {
  return configurationsQuery[0]['dataEditor'] as ConfigJSON
}

export function extractConfigurationVariables(): IConfig {
  const configObjArray = queryConfigurationsArray()
  if (configObjArray === undefined || configObjArray.length === 0)
    return Config.Default

  return configObjArray[0]['dataEditor'] === undefined
    ? Config.Default
    : Config.fromConfigJSON(extractDataEditorConfigFromQuery(configObjArray))
}

export default { addToAppDataPath, rootPath, extractConfigurationVariables }
