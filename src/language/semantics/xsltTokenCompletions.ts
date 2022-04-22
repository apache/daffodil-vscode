/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { BaseToken } from './xpLexer'

enum TagType {
  XSLTstart,
  XMLstart,
  XSLTvar,
  Start,
  NonStart,
}

interface XSLTToken extends BaseToken {
  tagType?: TagType
}

export interface ElementData {
  variables: VariableData[]
  currentVariable?: VariableData
  xpathVariableCurrentlyBeingDefined?: boolean
  identifierToken: XSLTToken
  symbolName: string
  symbolID: string
  childSymbols: vscode.DocumentSymbol[]
  namespacePrefixes: string[]
}
export interface XPathData {
  token: BaseToken
  variables: VariableData[]
  preXPathVariable: boolean
  xpathVariableCurrentlyBeingDefined: boolean
  function?: BaseToken
  functionArity?: number
  isRangeVar?: boolean
  awaitingArity: boolean
  tokenIndex?: number
}

export interface VariableData {
  token: BaseToken
  name: string
  uri?: string
  index: number
}

export interface FunctionCompletionData {
  name: string
  signature: string
  description: string
}
