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
import {
  XslLexer,
  GlobalInstructionData,
  GlobalInstructionType,
} from './xslLexer'
import {
  CharLevelState,
  TokenLevelState,
  BaseToken,
  ErrorType,
  Data,
  XPathLexer,
} from './xpLexer'
import { FunctionData, XSLTnamespaces } from './functionData'

export enum TagType {
  XSLTstart,
  XMLstart,
  XSLTvar,
  Start,
  NonStart,
}

export enum AttributeType {
  None,
  Variable,
  VariableRef,
  InstructionName,
  InstructionMode,
  UseAttributeSets,
  ExcludeResultPrefixes,
  XPath,
}

export enum CurlyBraceType {
  None,
  Map,
  Array,
}

export interface XSLTToken extends BaseToken {
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
  expectedChildElements: string[]
}
export interface XPathData {
  token: BaseToken
  variables: VariableData[]
  preXPathVariable: boolean
  xpathVariableCurrentlyBeingDefined: boolean
  function?: BaseToken
  functionArity?: number
  isRangeVar?: boolean
  awaitingMapKey?: boolean
  curlyBraceType?: CurlyBraceType
}

export interface VariableData {
  token: BaseToken
  name: string
}

enum NameValidationError {
  None,
  NamespaceError,
  NameError,
  XSLTElementNameError,
  XSLTAttributeNameError,
}

export enum ValidationType {
  XMLAttribute,
  XMLElement,
  XSLTAttribute,
  PrefixedName,
  Name,
}

export enum DiagnosticCode {
  none,
  unresolvedVariableRef,
  unresolvedGenericRef,
  parseHtmlRef,
  externalPrintRef,
  fnWithNoContextItem,
  currentWithNoContextItem,
  groupOutsideForEachGroup,
  groupOutsideMerge,
  positionWithNoContextItem,
  lastWithNoContextItem,
  rootWithNoContextItem,
  rootOnlyWithNoContextItem,
  instrWithNoContextItem,
  noContextItem,
  regexNoContextItem,
}

export class XsltTokenDiagnostics {
  public static readonly xsltStartTokenNumber =
    XslLexer.getXsltStartTokenNumber()
  public static readonly xsltCatchVariables = [
    'err:code',
    'err:description',
    'err:value',
    'err:module',
    'err:line-number',
    'err:column-number',
  ]
  public static readonly xslInclude = 'xsl:include'
  public static readonly xslImport = 'xsl:import'
  public static readonly xmlChars = ['lt', 'gt', 'quot', 'apos', 'amp']

  public static readonly xslFunction = 'xsl:function'

  public static readonly xslNameAtt = 'name'
  public static readonly xslModeAtt = 'mode'
  public static readonly useAttSet = 'use-attribute-sets'
  public static readonly xslUseAttSet = 'xsl:use-attribute-sets'
  public static readonly excludePrefixes = 'exclude-result-prefixes'
  public static readonly xslExcludePrefixes = 'xsl:exclude-result-prefixes'
  public static readonly brackets = [
    CharLevelState.lB,
    CharLevelState.lBr,
    CharLevelState.lPr,
    CharLevelState.rB,
    CharLevelState.rBr,
    CharLevelState.rPr,
  ]

  public static isBracket(charState: CharLevelState) {
    return XsltTokenDiagnostics.brackets.indexOf(charState) !== -1
  }

  private static nameStartCharRgx = new RegExp(
    /[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]/
  )
  private static nameCharRgx = new RegExp(
    /-|\.|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]|[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]/
  )

  private static validateName(
    name: string,
    type: ValidationType,
    xmlnsPrefixes: string[],
    elementStack?: ElementData[],
    expectedAttributes?: string[]
  ): NameValidationError {
    let valid = NameValidationError.None
    if (name.trim().length === 0) {
      return NameValidationError.NameError
    }
    if (
      type === ValidationType.XMLAttribute ||
      type === ValidationType.XSLTAttribute
    ) {
      if (
        name === 'xml:space' ||
        name === 'xml:lang' ||
        name === 'xml:base' ||
        name === 'xml:id'
      ) {
        return NameValidationError.None
      }
    }
    let nameParts = name.split(':')
    if (nameParts.length > 2) {
      return NameValidationError.NameError
    } else {
      if (nameParts.length === 2) {
        let prefix = nameParts[0]
        if (type === ValidationType.XMLElement) {
          // TODO: when within literal result element, iterate up stack until we get to an XSLT instruction:
          const expectedNames: string[] =
            elementStack && elementStack.length > 0
              ? elementStack[elementStack.length - 1].expectedChildElements
              : ['xsl:transform', 'xsl:stylesheet', 'xsl:package']
          if (prefix === 'xsl' || prefix === 'ixsl') {
            if (expectedNames.length === 0 && elementStack) {
              const withinNextIteration =
                elementStack[elementStack.length - 1].symbolName ===
                'xsl:next-iteration'
              valid =
                name === 'xsl:with-param' && withinNextIteration
                  ? NameValidationError.None
                  : NameValidationError.XSLTElementNameError
            } else {
              valid =
                expectedNames.indexOf(name) > -1
                  ? NameValidationError.None
                  : NameValidationError.XSLTElementNameError
              if (
                valid !== NameValidationError.None &&
                (name === 'xsl:next-iteration' || name === 'xsl:break')
              ) {
                const withinIterarator = elementStack?.find(
                  (item) => item.symbolName === 'xsl:iterate'
                )
                if (withinIterarator) {
                  valid = NameValidationError.None
                }
              }
            }
            return valid
          } else {
            valid =
              xmlnsPrefixes.indexOf(prefix) > -1
                ? NameValidationError.None
                : NameValidationError.NamespaceError
          }
        } else if (prefix === 'xsl' && type === ValidationType.XSLTAttribute) {
          // TODO: for attributes on non-xsl instructions, check that name is in the attributeGroup: xsl:literal-result-element-attributes (e.g. xsl:expand-text)
          //valid = xmlnsPrefixes.indexOf(prefix) > -1? NameValidationError.None: NameValidationError.NamespaceError;
        } else {
          valid =
            xmlnsPrefixes.indexOf(prefix) > -1
              ? NameValidationError.None
              : NameValidationError.NamespaceError
        }
      } else if (
        (type === ValidationType.XSLTAttribute ||
          type === ValidationType.XMLAttribute) &&
        expectedAttributes
      ) {
        valid =
          expectedAttributes.indexOf(name) > -1
            ? NameValidationError.None
            : NameValidationError.XSLTAttributeNameError
        return valid
      }
      if (valid === NameValidationError.None) {
        nameParts.forEach((namePart) => {
          if (valid === NameValidationError.None) {
            let charsOK = true
            let firstChar = true
            let charExists = false
            for (let s of namePart) {
              if (firstChar) {
                firstChar = false
                charExists = true
                charsOK = XsltTokenDiagnostics.nameStartCharRgx.test(s)
                if (!charsOK) {
                  break
                }
              } else {
                charsOK = XsltTokenDiagnostics.nameCharRgx.test(s)
                if (!charsOK) {
                  break
                }
              }
            }
            valid =
              charExists && charsOK
                ? NameValidationError.None
                : NameValidationError.NameError
          }
        })
      }
    }
    return valid
  }

  public static validateSimpleName(name: string) {
    let valid = false
    const nameParts = name.split(':')
    if (nameParts.length > 2) {
      return false
    }
    nameParts.forEach((namePart) => {
      let charsOK = true
      let firstChar = true
      let charExists = false
      for (let s of namePart) {
        if (firstChar) {
          firstChar = false
          charExists = true
          charsOK = XsltTokenDiagnostics.nameStartCharRgx.test(s)
          if (!charsOK) {
            break
          }
        } else {
          charsOK = XsltTokenDiagnostics.nameCharRgx.test(s)
          if (!charsOK) {
            break
          }
        }
      }
      valid = charExists && charsOK
    })
    return valid
  }

  public static calculateDiagnostics = (
    document: vscode.TextDocument,
    allTokens: BaseToken[],
    globalInstructionData: GlobalInstructionData[],
    importedInstructionData: GlobalInstructionData[],
    symbols: vscode.DocumentSymbol[],
    globalVariables: string[]
  ): vscode.Diagnostic[] => {
    let inScopeVariablesList: VariableData[] = []
    let xpathVariableCurrentlyBeingDefined: boolean
    let elementStack: ElementData[] = []
    let inScopeXPathVariablesList: VariableData[] = []
    let anonymousFunctionParamList: VariableData[] = []
    let xpathStack: XPathData[] = []
    let tagType = TagType.NonStart
    let preXPathVariable = false
    let anonymousFunctionParams = false
    let xsltVariableDeclarations: BaseToken[] = []
    let unresolvedXsltVariableReferences: BaseToken[] = []
    let prevToken: BaseToken | null = null
    let includeOrImport = false
    let problemTokens: BaseToken[] = []
    let topLevelSymbols: vscode.DocumentSymbol[] = symbols
    let tagIdentifierName: string = ''
    let lastTokenIndex = allTokens.length - 1
    let inheritedPrefixes: string[] = []
    let globalVariableData: VariableData[] = []
    let checkedGlobalVarNames: string[] = []
    let checkedGlobalFnNames: string[] = []
    let importedGlobalVarNames: string[] = globalVariables
    let importedGlobalFnNames: string[] = []
    let incrementFunctionArity = false
    let xsltPrefixesToURIs = new Map<string, XSLTnamespaces>()
    let dtdStarted = false
    let dtdEnded = false
    let namedTemplates: Map<string, string[]> = new Map()
    let globalModes: string[] = ['#current', '#default']
    let globalKeys: string[] = []
    let globalAccumulatorNames: string[] = []
    let globalAttributeSetNames: string[] = []
    let ifThenStack: BaseToken[] = []
    if (dtdStarted) {
    }

    globalInstructionData.forEach((instruction) => {
      switch (instruction.type) {
        case GlobalInstructionType.Variable:
        case GlobalInstructionType.Parameter:
          if (checkedGlobalVarNames.indexOf(instruction.name) < 0) {
            checkedGlobalVarNames.push(instruction.name)
          } else {
            instruction.token['error'] = ErrorType.DuplicateVarName
            instruction.token.value = instruction.name
            problemTokens.push(instruction.token)
          }
          globalVariableData.push({
            token: instruction.token,
            name: instruction.name,
          })
          xsltVariableDeclarations.push(instruction.token)
          break
        case GlobalInstructionType.Function:
          let functionNameWithArity =
            instruction.name + '#' + instruction.idNumber
          if (checkedGlobalFnNames.indexOf(functionNameWithArity) < 0) {
            checkedGlobalFnNames.push(functionNameWithArity)
          } else {
            instruction.token['error'] = ErrorType.DuplicateFnName
            instruction.token.value = functionNameWithArity
            problemTokens.push(instruction.token)
          }
          break
        case GlobalInstructionType.Template:
          if (namedTemplates.get(instruction.name)) {
            instruction.token['error'] = ErrorType.DuplicateTemplateName
            instruction.token.value = instruction.name
            problemTokens.push(instruction.token)
          } else {
            let members = instruction.memberNames ? instruction.memberNames : []
            namedTemplates.set(instruction.name, members)
          }
          break
        case GlobalInstructionType.Mode:
          let modes = instruction.name.split(/\s+/)
          globalModes = globalModes.concat(modes)
          break
        case GlobalInstructionType.Key:
          globalKeys.push(instruction.name)
          break
        case GlobalInstructionType.Accumulator:
          if (globalAccumulatorNames.indexOf(instruction.name) < 0) {
            globalAccumulatorNames.push(instruction.name)
          } else {
            instruction.token['error'] = ErrorType.DuplicateAccumulatorName
            instruction.token.value = instruction.name
            problemTokens.push(instruction.token)
          }
          break
        case GlobalInstructionType.AttributeSet:
          globalAttributeSetNames.push(instruction.name)
          break
        case GlobalInstructionType.RootXMLNS:
          inheritedPrefixes.push(instruction.name)
          break
      }
    })

    importedInstructionData.forEach((instruction) => {
      switch (instruction.type) {
        case GlobalInstructionType.Variable:
        case GlobalInstructionType.Parameter:
          if (checkedGlobalVarNames.indexOf(instruction.name) < 0) {
            checkedGlobalVarNames.push(instruction.name)
            importedGlobalVarNames.push(instruction.name)
          }
          break
        case GlobalInstructionType.Function:
          let functionNameWithArity =
            instruction.name + '#' + instruction.idNumber
          if (checkedGlobalFnNames.indexOf(functionNameWithArity) < 0) {
            checkedGlobalFnNames.push(functionNameWithArity)
            importedGlobalFnNames.push(functionNameWithArity)
          }
          break
        case GlobalInstructionType.Template:
          let members = instruction.memberNames ? instruction.memberNames : []
          namedTemplates.set(instruction.name, members)
          break
        case GlobalInstructionType.Mode:
          let modes = instruction.name.split(/\s+/)
          globalModes = globalModes.concat(modes)
          break
        case GlobalInstructionType.Key:
          globalKeys.push(instruction.name)
          break
        case GlobalInstructionType.Accumulator:
          globalAccumulatorNames.push(instruction.name)
          break
        case GlobalInstructionType.AttributeSet:
          globalAttributeSetNames.push(instruction.name)
          break
      }
    })

    xsltPrefixesToURIs.set('array', XSLTnamespaces.Array)
    xsltPrefixesToURIs.set('map', XSLTnamespaces.Map)
    xsltPrefixesToURIs.set('math', XSLTnamespaces.Map)
    xsltPrefixesToURIs.set('xs', XSLTnamespaces.XMLSchema)
    xsltPrefixesToURIs.set('fn', XSLTnamespaces.XPath)
    xsltPrefixesToURIs.set('xsl', XSLTnamespaces.XSLT)
    xsltPrefixesToURIs.set('ixsl', XSLTnamespaces.IXSL)
    xsltPrefixesToURIs.set('dfdl', XSLTnamespaces.dfdl)
    inheritedPrefixes = inheritedPrefixes.concat([
      'array',
      'map',
      'math',
      'xs',
      'fn',
      'xsl',
      'ixsl',
      'dfdl',
    ])

    allTokens.forEach((token, index) => {
      let xpathCharType = <CharLevelState>token.charType
      let xpathTokenType = <TokenLevelState>token.tokenType
      if (xpathStack.length > 0) {
        const tv = xpathStack[xpathStack.length - 1].token.value
        if (
          prevToken?.charType === CharLevelState.sep &&
          prevToken.value === ',' &&
          (tv === 'for' || tv === 'let' || tv === 'every')
        ) {
          if (xpathTokenType !== TokenLevelState.variable) {
            token['error'] = ErrorType.ExpectedDollarAfterComma
            problemTokens.push(token)
          }
        }
      }

      switch (xpathTokenType) {
        case TokenLevelState.string:
          if (token.error) {
            problemTokens.push(token)
          }
          XsltTokenDiagnostics.checkTokenIsExpected(
            prevToken,
            token,
            problemTokens
          )
          if (xpathStack.length > 0) {
            let xp = xpathStack[xpathStack.length - 1]
            if (
              xp.functionArity === 0 &&
              (xp.function?.value === 'key' ||
                xp.function?.value.startsWith('accumulator-'))
            ) {
              let keyVal = token.value.substring(1, token.value.length - 1)
              if (xp.function.value === 'key') {
                if (globalKeys.indexOf(keyVal) < 0) {
                  token['error'] = ErrorType.XSLTKeyUnresolved
                  problemTokens.push(token)
                }
              } else if (globalAccumulatorNames.indexOf(keyVal) < 0) {
                token['error'] = ErrorType.AccumulatorNameUnresolved
                problemTokens.push(token)
              }
            }
          }
          break
        case TokenLevelState.axisName:
          if (token.error) {
            problemTokens.push(token)
          }
          XsltTokenDiagnostics.checkTokenIsExpected(
            prevToken,
            token,
            problemTokens
          )
          break
        case TokenLevelState.variable:
          if (
            (preXPathVariable && !xpathVariableCurrentlyBeingDefined) ||
            anonymousFunctionParams
          ) {
            let fullVariableName = token.value
            let currentVariable = {
              token: token,
              name: fullVariableName.substring(1),
            }
            if (anonymousFunctionParams) {
              anonymousFunctionParamList.push(currentVariable)
              xsltVariableDeclarations.push(token)
            } else {
              inScopeXPathVariablesList.push(currentVariable)
              xpathVariableCurrentlyBeingDefined = true
              xsltVariableDeclarations.push(token)
            }
          } else {
            let prefixEnd = token.value.indexOf(':')
            if (prefixEnd !== -1) {
              let prefix = token.value.substring(1, prefixEnd)
              if (inheritedPrefixes.indexOf(prefix) === -1) {
                token['error'] = ErrorType.XPathPrefix
                problemTokens.push(token)
              }
            }
            // don't include any current pending variable declarations when resolving
            let globalVarName: string | null = null
            if (tagType === TagType.XSLTvar && elementStack.length === 1) {
              globalVarName = tagIdentifierName
            }
            let unResolvedToken =
              XsltTokenDiagnostics.resolveXPathVariableReference(
                globalVarName,
                document,
                importedGlobalVarNames,
                token,
                xpathVariableCurrentlyBeingDefined,
                inScopeXPathVariablesList,
                xpathStack,
                inScopeVariablesList,
                elementStack
              )
            if (unResolvedToken !== null) {
              unresolvedXsltVariableReferences.push(unResolvedToken)
            }
            XsltTokenDiagnostics.checkTokenIsExpected(
              prevToken,
              token,
              problemTokens
            )
          }
          break
        case TokenLevelState.complexExpression:
          let valueText = token.value
          switch (valueText) {
            case 'if':
              ifThenStack.push(token)
              break
            case 'every':
            case 'for':
            case 'let':
            case 'some':
              if (allTokens.length > index + 2) {
                const opToken = allTokens[index + 2]
                const expectedOp = valueText === 'let' ? ':=' : 'in'
                if (opToken.value !== expectedOp) {
                  opToken['error'] = ErrorType.XPathExpectedComplex
                  problemTokens.push(opToken)
                }
              }
              if (index > 0) {
                XsltTokenDiagnostics.checkTokenIsExpected(
                  prevToken,
                  allTokens[index - 1],
                  problemTokens,
                  TokenLevelState.Unset
                )
              }
              preXPathVariable = true
              xpathVariableCurrentlyBeingDefined = false
              xpathStack.push({
                token: token,
                variables: inScopeXPathVariablesList.slice(),
                preXPathVariable: preXPathVariable,
                xpathVariableCurrentlyBeingDefined:
                  xpathVariableCurrentlyBeingDefined,
                isRangeVar: true,
              })
              break
            case 'then':
              if (ifThenStack.length > 0) {
                ifThenStack.pop()
              } else {
                token.error = ErrorType.XPathUnexpected
                problemTokens.push(token)
              }
              xpathStack.push({
                token: token,
                variables: inScopeXPathVariablesList.slice(),
                preXPathVariable: preXPathVariable,
                xpathVariableCurrentlyBeingDefined:
                  xpathVariableCurrentlyBeingDefined,
              })
              inScopeXPathVariablesList = []
              break
            case 'return':
            case 'satisfies':
            case 'else':
              let tokenValBeforeDelete =
                xpathStack.length > 0
                  ? xpathStack[xpathStack.length - 1].token.value
                  : ''
              if (xpathStack.length > 1) {
                let deleteCount = 0
                for (let i = xpathStack.length - 1; i > -1; i--) {
                  const sv = xpathStack[i].token.value
                  if (sv === 'return' || sv === 'else' || sv === 'satisfies') {
                    deleteCount++
                  } else {
                    break
                  }
                }
                if (deleteCount > 0) {
                  xpathStack.splice(xpathStack.length - deleteCount)
                }
              }

              if (xpathStack.length > 0) {
                let peekedStack = xpathStack[xpathStack.length - 1]
                if (peekedStack) {
                  if (valueText === 'else') {
                    preXPathVariable = peekedStack.preXPathVariable
                  } else {
                    // todo: if after a return AND a ',' prePathVariable = true; see $pos := $c.
                    preXPathVariable = false
                  }
                  xpathVariableCurrentlyBeingDefined =
                    peekedStack.xpathVariableCurrentlyBeingDefined
                  let matchingToken: string =
                    XsltTokenDiagnostics.getMatchingToken(
                      peekedStack.token.value
                    )
                  if (!token.error && matchingToken !== token.value) {
                    token['error'] = ErrorType.BracketNesting
                    problemTokens.push(token)
                  } else {
                    peekedStack.token = token
                  }
                } else {
                  inScopeXPathVariablesList = []
                  preXPathVariable = false
                  xpathVariableCurrentlyBeingDefined = false
                }
              } else if (tokenValBeforeDelete !== '') {
                let matchingToken: string =
                  XsltTokenDiagnostics.getMatchingToken(tokenValBeforeDelete)
                if (!token.error && matchingToken !== token.value) {
                  token['error'] = ErrorType.BracketNesting
                  problemTokens.push(token)
                }
              }
              break
          }
          break
        case TokenLevelState.mapKey:
          if (
            !(
              prevToken &&
              prevToken.tokenType === TokenLevelState.operator &&
              (prevToken.value === ',' || prevToken.value === '{')
            )
          ) {
            token['error'] = ErrorType.XPathUnexpected
            problemTokens.push(token)
          }
          break
        case TokenLevelState.operator:
          let isXPathError = false
          let tv = token.value

          // start checks
          let stackItem: XPathData | undefined =
            xpathStack.length > 0
              ? xpathStack[xpathStack.length - 1]
              : undefined
          const sv = stackItem?.token.value
          const tokenIsComma = tv === ','
          const popStackLaterForComma =
            sv &&
            tokenIsComma &&
            (sv === 'return' || sv === 'else' || sv === 'satisfies')
          if (popStackLaterForComma && xpathStack.length > 1) {
            stackItem = xpathStack[xpathStack.length - 2]
          }
          if (stackItem && stackItem.curlyBraceType === CurlyBraceType.Map) {
            if (tokenIsComma) {
              if (stackItem.awaitingMapKey) {
                isXPathError = true
              } else {
                stackItem.awaitingMapKey = true
              }
            } else if (tv === '}' && stackItem.awaitingMapKey) {
              isXPathError = true
            }
          }
          if (prevToken?.tokenType === TokenLevelState.complexExpression) {
            let currCharType = <CharLevelState>token.charType
            if (
              currCharType === CharLevelState.rB ||
              currCharType === CharLevelState.rBr ||
              currCharType === CharLevelState.rPr
            ) {
              if (
                prevToken.value === 'return' ||
                prevToken.value === 'satisfies' ||
                prevToken.value === 'else' ||
                prevToken.value === 'then'
              ) {
                prevToken['error'] = ErrorType.XPathAwaiting
                problemTokens.push(prevToken)
              }
            } else if (tokenIsComma) {
              prevToken['error'] = ErrorType.XPathAwaiting
              problemTokens.push(prevToken)
            }
          } else if (prevToken?.tokenType === TokenLevelState.uriLiteral) {
            token['error'] = ErrorType.XPathUnexpected
            problemTokens.push(token)
          } else if (
            prevToken &&
            tv !== '/' &&
            prevToken.value !== '/' &&
            !prevToken.error
          ) {
            let currCharType = <CharLevelState>token.charType
            let nextToken =
              index + 1 < allTokens.length ? allTokens[index + 1] : undefined
            if (tv === ':') {
              if (
                stackItem &&
                stackItem.curlyBraceType === CurlyBraceType.Map
              ) {
                if (stackItem.awaitingMapKey) {
                  stackItem.awaitingMapKey = false
                } else {
                  isXPathError = true
                }
              } else if (
                prevToken.tokenType === TokenLevelState.nodeNameTest ||
                prevToken.tokenType === TokenLevelState.attributeNameTest
              ) {
                isXPathError = !(
                  prevToken.startCharacter + prevToken.length ===
                    token.startCharacter && nextToken?.value === '*'
                )
              } else {
                isXPathError = true
              }
            }
            if (tv === 'map' || tv === 'array') {
              XsltTokenDiagnostics.checkTokenIsExpected(
                prevToken,
                token,
                problemTokens,
                TokenLevelState.function
              )
            } else if (
              (tv === '+' || tv === '-') &&
              nextToken &&
              nextToken.tokenType !== TokenLevelState.string
            ) {
              // either a number of an operator so show no error
            } else if (prevToken.tokenType === TokenLevelState.operator) {
              // current type is operator and previous type is operator
              let prevCharType = <CharLevelState>prevToken.charType
              let pv = prevToken.value

              switch (currCharType) {
                case CharLevelState.rB:
                case CharLevelState.rBr:
                case CharLevelState.rPr:
                  if (!XsltTokenDiagnostics.isBracket(prevCharType)) {
                    // +) is not ok but )) or ( ) is ok
                    if (
                      !(
                        (prevToken.charType === CharLevelState.sep &&
                          pv === '?' &&
                          tv === ')') ||
                        (prevToken.charType === CharLevelState.dSep &&
                          (pv === '{}' || pv === '()' || pv === '[]'))
                      )
                    ) {
                      isXPathError = true
                    }
                  }
                  break
                case CharLevelState.dSep:
                  if (
                    prevCharType === CharLevelState.rB ||
                    prevCharType === CharLevelState.rPr ||
                    prevCharType === CharLevelState.rBr ||
                    (prevCharType === CharLevelState.dSep &&
                      (pv === '()' || pv === '[]' || pv === '{}'))
                  ) {
                    // allow: ) !=
                    isXPathError = tv === '*:'
                  } else if (tv === '*:' || tv === '//') {
                    // no error
                  } else if (
                    !(
                      (tv === '{}' && (pv === 'map' || pv === 'array')) ||
                      tv === '()' ||
                      tv === '[]'
                    )
                  ) {
                    isXPathError = true
                  }
                  break
                case CharLevelState.lB:
                case CharLevelState.lBr:
                case CharLevelState.lPr:
                  // +( is ok
                  break
                default:
                  switch (prevCharType) {
                    case CharLevelState.rB:
                    case CharLevelState.rBr:
                    case CharLevelState.rPr:
                      // ), or )+ are ok
                      break
                    case CharLevelState.dSep:
                      if (!(pv === '()' || pv === '{}' || pv === '[]')) {
                        isXPathError = true
                      }
                      break
                    default:
                      // (+ or ++ are not ok
                      if (
                        (pv === '&gt;' && tv === '&gt;') ||
                        (pv === '&lt;' && (tv === '&lt;' || tv === '&gt;'))
                      ) {
                        // allow << <> or >>
                      } else if (tv === 'as') {
                        isXPathError =
                          pv !== 'castable' && pv !== 'cast' && pv !== 'treat'
                      } else if (tv === 'of') {
                        isXPathError = pv !== 'instance'
                      } else if (
                        !(
                          (pv === '?' && (tv === ',' || tv === ')')) ||
                          (tv === '?' &&
                            (pv === '(' || pv === ')' || pv === ',')) ||
                          (pv === '!' && tv === '?') ||
                          (pv === '[' && tv === '?')
                        )
                      ) {
                        isXPathError = true
                      }
                      break
                  }
              }
            }
            if (isXPathError) {
              token['error'] = ErrorType.XPathUnexpected
              problemTokens.push(token)
              // token is pushed onto problemTokens later
            }
          }
          // end checks
          let functionToken: BaseToken | null = null
          switch (xpathCharType) {
            case CharLevelState.lBr:
              let curlyBraceType = CurlyBraceType.None
              if (
                prevToken &&
                prevToken.tokenType === TokenLevelState.operator
              ) {
                if (prevToken.value === 'map') {
                  curlyBraceType = CurlyBraceType.Map
                } else if (prevToken.value === 'array') {
                  curlyBraceType = CurlyBraceType.Array
                }
              }
              const stackItem: XPathData = {
                token: token,
                variables: inScopeXPathVariablesList,
                preXPathVariable: preXPathVariable,
                xpathVariableCurrentlyBeingDefined:
                  xpathVariableCurrentlyBeingDefined,
                curlyBraceType,
              }
              if (curlyBraceType === CurlyBraceType.Map) {
                stackItem.awaitingMapKey = true
              }
              xpathStack.push(stackItem)
              if (anonymousFunctionParams) {
                // handle case: function($a) {$a + 8} pass params to inside '{...}'
                inScopeXPathVariablesList = anonymousFunctionParamList
                anonymousFunctionParamList = []
                anonymousFunctionParams = false
              } else {
                inScopeXPathVariablesList = []
              }
              preXPathVariable = false
              xpathVariableCurrentlyBeingDefined = false
              break
            case CharLevelState.lB:
              // handle case: function($a)
              if (
                !anonymousFunctionParams &&
                prevToken?.tokenType !== TokenLevelState.nodeType
              ) {
                anonymousFunctionParams =
                  prevToken?.tokenType === TokenLevelState.anonymousFunction
              }
              if (prevToken?.tokenType === TokenLevelState.function) {
                functionToken = prevToken
              } else if (prevToken?.tokenType === TokenLevelState.variable) {
                // TODO: check arity of variables of type 'function'
                incrementFunctionArity = false
              }
            // intentionally no-break;
            case CharLevelState.lPr:
              let xpathItem: XPathData = {
                token: token,
                variables: inScopeXPathVariablesList,
                preXPathVariable: preXPathVariable,
                xpathVariableCurrentlyBeingDefined:
                  xpathVariableCurrentlyBeingDefined,
              }
              if (functionToken) {
                xpathItem.function = functionToken
                if (incrementFunctionArity) {
                  xpathItem.functionArity = 1
                  incrementFunctionArity = false
                } else {
                  xpathItem.functionArity = 0
                }
              }
              xpathStack.push(xpathItem)
              preXPathVariable = false
              inScopeXPathVariablesList = []
              xpathVariableCurrentlyBeingDefined = false
              break
            case CharLevelState.rB:
            case CharLevelState.rPr:
            case CharLevelState.rBr:
              if (xpathStack.length > 1) {
                let deleteCount = 0
                for (let i = xpathStack.length - 1; i > -1; i--) {
                  const sv = xpathStack[i].token.value
                  if (sv === 'return' || sv === 'else' || sv === 'satisfies') {
                    deleteCount++
                  } else {
                    break
                  }
                }
                if (deleteCount > 0) {
                  xpathStack.splice(xpathStack.length - deleteCount)
                }
              }

              if (xpathStack.length > 0) {
                let poppedData = xpathStack.pop()
                if (poppedData) {
                  if (poppedData.token.value === 'then') {
                    poppedData.token['error'] = ErrorType.BracketNesting
                    problemTokens.push(poppedData.token)
                  }
                  inScopeXPathVariablesList = poppedData.variables
                  preXPathVariable = poppedData.preXPathVariable
                  xpathVariableCurrentlyBeingDefined =
                    poppedData.xpathVariableCurrentlyBeingDefined
                  if (
                    poppedData.function &&
                    poppedData.functionArity !== undefined
                  ) {
                    if (prevToken?.charType !== CharLevelState.lB) {
                      if (poppedData.functionArity !== undefined) {
                        poppedData.functionArity++
                      }
                    }
                    let { isValid, qFunctionName, fErrorType } =
                      XsltTokenDiagnostics.isValidFunctionName(
                        inheritedPrefixes,
                        xsltPrefixesToURIs,
                        poppedData.function,
                        checkedGlobalFnNames,
                        poppedData.functionArity
                      )
                    if (!isValid) {
                      poppedData.function['error'] = fErrorType
                      poppedData.function['value'] = qFunctionName
                      problemTokens.push(poppedData.function)
                    }
                  }
                } else {
                  inScopeXPathVariablesList = []
                  preXPathVariable = false
                  xpathVariableCurrentlyBeingDefined = false
                }
              }
              if (token.error && !isXPathError) {
                // any error should already have been added by lexer:
                problemTokens.push(token)
              }
              break
            case CharLevelState.sep:
              if (token.value === ',') {
                if (xpathStack.length > 0) {
                  let xp = xpathStack[xpathStack.length - 1]
                  if (xp.functionArity !== undefined) {
                    xp.functionArity++
                  }
                  if (xp.isRangeVar) {
                    preXPathVariable = xp.preXPathVariable
                  }
                  let nonBracketedThen = -1
                  for (let i = xpathStack.length - 1; i > -1; i--) {
                    const xpathItem = xpathStack[i].token
                    const val = xpathItem.value
                    if (
                      !(
                        val === 'return' ||
                        val === 'else' ||
                        val === 'satisfies' ||
                        val === 'then'
                      )
                    ) {
                      break
                    } else if (val === 'then') {
                      nonBracketedThen = i
                    }
                  }
                  if (nonBracketedThen > -1) {
                    //xpathStack.splice(nonBracketedThen, 1);
                    token['error'] = ErrorType.ExpectedElseAfterThen
                    problemTokens.push(token)
                  }
                  const sv = xp.token.value
                  if (sv === 'return' || sv === 'else' || sv === 'satisfies') {
                    let poppedData = xpathStack.pop()
                    if (poppedData) {
                      inScopeXPathVariablesList = poppedData.variables
                      if (sv === 'else') {
                        preXPathVariable = poppedData.preXPathVariable
                      } else {
                        // todo: if after a return AND a ',' prePathVariable = true; see $pos := $c.
                        preXPathVariable = false
                      }
                      xpathVariableCurrentlyBeingDefined = false
                    }
                  }
                }
                xpathVariableCurrentlyBeingDefined = false
              }
              break
            case CharLevelState.dSep:
              const isEmptyBracketsToken = token.value === '()'
              if (
                isEmptyBracketsToken &&
                prevToken?.tokenType === TokenLevelState.function
              ) {
                const fnArity = incrementFunctionArity ? 1 : 0
                incrementFunctionArity = false
                let { isValid, qFunctionName, fErrorType } =
                  XsltTokenDiagnostics.isValidFunctionName(
                    inheritedPrefixes,
                    xsltPrefixesToURIs,
                    prevToken,
                    checkedGlobalFnNames,
                    fnArity
                  )
                if (!isValid) {
                  prevToken['error'] = fErrorType
                  prevToken['value'] = qFunctionName
                  problemTokens.push(prevToken)
                  prevToken.tokenType = TokenLevelState.Unset
                }
              } else if (
                isEmptyBracketsToken &&
                prevToken?.tokenType === TokenLevelState.variable
              ) {
                // TODO: check arity of variable of type 'function'
                incrementFunctionArity = false
              } else if (token.value === '=>') {
                incrementFunctionArity = true
              }
              break
          }
          break
        case TokenLevelState.nodeType:
          if (token.value === ':*' && prevToken && !prevToken.error) {
            let pfx =
              prevToken.tokenType === TokenLevelState.attributeNameTest
                ? prevToken.value.substring(1)
                : prevToken.value
            if (inheritedPrefixes.indexOf(pfx) === -1 && pfx !== 'xml') {
              prevToken['error'] = ErrorType.XPathPrefix
              problemTokens.push(prevToken)
            }
          }
          break
        case TokenLevelState.attributeNameTest:
        case TokenLevelState.nodeNameTest:
          if (token.error) {
            problemTokens.push(token)
          } else {
            let tokenValue
            let validationType
            let skipValidation = false
            if (xpathTokenType === TokenLevelState.nodeNameTest) {
              tokenValue = token.value
              validationType = ValidationType.PrefixedName
            } else {
              tokenValue = token.value.substr(1)
              validationType = ValidationType.XMLAttribute
              skipValidation = token.value === '@xml'
              if (!skipValidation && token.value === '@') {
                let nextToken =
                  allTokens.length > index + 1 ? allTokens[index + 1] : null
                skipValidation = nextToken
                  ? token.value === '@' &&
                    (nextToken.value === '*' || nextToken.value === '*:')
                  : false
              }
            }
            if (!skipValidation) {
              let validateResult = XsltTokenDiagnostics.validateName(
                tokenValue,
                validationType,
                inheritedPrefixes
              )
              if (validateResult !== NameValidationError.None) {
                token['error'] =
                  validateResult === NameValidationError.NameError
                    ? ErrorType.XPathName
                    : ErrorType.XPathPrefix
                token['value'] = token.value
                problemTokens.push(token)
              }
            }
          }
          XsltTokenDiagnostics.checkTokenIsExpected(
            prevToken,
            token,
            problemTokens
          )
          break
        case TokenLevelState.functionNameTest:
          let { isValid, qFunctionName, fErrorType } =
            XsltTokenDiagnostics.isValidFunctionName(
              inheritedPrefixes,
              xsltPrefixesToURIs,
              token,
              checkedGlobalFnNames
            )
          if (!isValid) {
            token['error'] = fErrorType
            token['value'] = qFunctionName
            problemTokens.push(token)
          }
          break
        case TokenLevelState.function:
        case TokenLevelState.number:
          XsltTokenDiagnostics.checkTokenIsExpected(
            prevToken,
            token,
            problemTokens
          )
          break
        case TokenLevelState.simpleType:
          let tValue = token.value
          let tParts = tValue.split(':')
          let isValidType = false
          if (tValue === '*' || tValue === '?' || tValue === '+') {
            // e.g. xs:integer* don't check name
            isValidType = true
          } else if (tParts.length === 1) {
            let nextToken =
              allTokens.length > index + 1 ? allTokens[index + 1] : null

            if (
              nextToken &&
              (nextToken.charType === CharLevelState.lB ||
                (nextToken.charType === CharLevelState.dSep &&
                  nextToken.value === '()'))
            ) {
              isValidType = Data.nodeTypes.indexOf(tParts[0]) > -1
              if (!isValidType) {
                isValidType = Data.nonFunctionTypes.indexOf(tParts[0]) > -1
              }
            }
          } else if (tParts.length === 2) {
            let nsType = xsltPrefixesToURIs.get(tParts[0])
            if (nsType !== undefined) {
              if (nsType === XSLTnamespaces.XMLSchema) {
                if (tParts[1] === 'numeric') {
                  isValidType = true
                } else {
                  isValidType =
                    FunctionData.schema.indexOf(tParts[1] + '#1') > -1
                }
              }
            }
          }
          if (!isValidType) {
            token['error'] = ErrorType.XPathTypeName
            problemTokens.push(token)
          }
          break
        case TokenLevelState.entityRef:
          if (token.error) {
            problemTokens.push(token)
          } else {
            let validationResult, entityName
            ;({ validationResult, entityName } =
              XsltTokenDiagnostics.validateEntityRef(
                token.value,
                dtdEnded,
                inheritedPrefixes
              ))
            if (validationResult !== NameValidationError.None) {
              token['error'] = ErrorType.EntityName
              token['value'] = entityName
              problemTokens.push(token)
            }
          }
          break
      }
      if (index === lastTokenIndex && !token.error) {
        if (token.tokenType === TokenLevelState.operator) {
          XsltTokenDiagnostics.checkFinalXPathToken(
            token,
            allTokens,
            index,
            problemTokens
          )
        }
        if (xpathStack.length > 0 && !token.error) {
          let disallowedStackItem: BaseToken | undefined
          for (let index = xpathStack.length - 1; index > -1; index--) {
            const trailingToken = xpathStack[index].token
            const tv = trailingToken.value
            const allowedToken =
              tv === 'return' || tv === 'else' || tv === 'satisfies'
            if (!allowedToken) {
              disallowedStackItem = trailingToken
              break
            }
          }
          if (disallowedStackItem) {
            disallowedStackItem['error'] = ErrorType.BracketNesting
            problemTokens.push(disallowedStackItem)
          }
        }
        if (token.tokenType === TokenLevelState.string && !token.error) {
          XPathLexer.checkStringLiteralEnd(token)
          if (token.error) {
            problemTokens.push(token)
          }
        }
      }
      prevToken =
        token.tokenType === TokenLevelState.comment ? prevToken : token
      if (index === lastTokenIndex) {
        // xml is not well-nested if items still on the stack at the end
        // but report errors and try to keep some part of the tree:
        if (token.tokenType === TokenLevelState.complexExpression) {
          token['error'] = ErrorType.XPathAwaiting
          problemTokens.push(token)
        }
        if (elementStack.length > 0) {
          let usedtoken = false
          while (elementStack.length > 0) {
            let poppedData = elementStack.pop()
            let endToken: BaseToken
            if (poppedData) {
              if (usedtoken) {
                // use final token as we don't know what the end token is
                // but reduce lendth by one on each iteration - so its well nested
                endToken = token
                endToken.length = endToken.length - 1
              } else {
                endToken = token
                usedtoken = true
              }
              let errorToken = Object.assign({}, poppedData.identifierToken)
              errorToken['error'] = ErrorType.ElementNesting
              problemTokens.push(errorToken)
              let symbol = XsltTokenDiagnostics.createSymbolFromElementTokens(
                poppedData.symbolName,
                poppedData.symbolID,
                poppedData.identifierToken,
                endToken
              )
              if (symbol !== null) {
                if (elementStack.length > 0) {
                  elementStack[elementStack.length - 1].childSymbols.push(
                    symbol
                  )
                } else {
                  topLevelSymbols.push(symbol)
                }
              }
            }
          }
        }
      }
    })
    let variableRefDiagnostics =
      XsltTokenDiagnostics.getDiagnosticsFromUnusedVariableTokens(
        xsltVariableDeclarations,
        unresolvedXsltVariableReferences,
        includeOrImport
      )
    let allDiagnostics =
      XsltTokenDiagnostics.appendDiagnosticsFromProblemTokens(
        variableRefDiagnostics,
        problemTokens
      )
    return allDiagnostics
  }

  public static checkFinalXPathToken(
    prevToken: BaseToken,
    allTokens: BaseToken[],
    index: number,
    problemTokens: BaseToken[]
  ) {
    let isValid = false
    switch (prevToken.charType) {
      case CharLevelState.rB:
      case CharLevelState.rBr:
      case CharLevelState.rPr:
        isValid = true
        break
      case CharLevelState.dSep:
        isValid =
          prevToken.value === '()' ||
          prevToken.value === '[]' ||
          prevToken.value === '{}'
        break
      default:
        if (prevToken.value === '%') {
          isValid = true
        } else if (prevToken.value === '/' || prevToken.value === '.') {
          // these are ok provided that the previous token was XSLT or previous token was ,;
          let prevToken2 = allTokens[index - 2]
          let tokenBeforePrevWasXSLT =
            prevToken2.tokenType >= XsltTokenDiagnostics.xsltStartTokenNumber
          isValid =
            tokenBeforePrevWasXSLT ||
            (prevToken2.tokenType === TokenLevelState.operator &&
              prevToken2.charType !== CharLevelState.rB &&
              prevToken2.charType !== CharLevelState.rBr &&
              prevToken2.charType !== CharLevelState.rPr)
        }
        break
    }
    if (!isValid) {
      prevToken['error'] = ErrorType.XPathOperatorUnexpected
      problemTokens.push(prevToken)
    }
  }

  private static validateEntityRef(
    entityName: string,
    dtdEnded: boolean,
    inheritedPrefixes: string[]
  ) {
    let validationResult = NameValidationError.None
    if (entityName.length > 2 && entityName.endsWith(';')) {
      entityName = entityName.substring(1, entityName.length - 1)
      if (entityName.length > 1 && entityName.charAt(0) === '#') {
        let validNumber
        if (entityName.charAt(1).toLocaleLowerCase() === 'x') {
          validNumber = /^#[Xx][0-9a-fA-F]+$/.test(entityName)
        } else {
          validNumber = /^#[0-9]+$/.test(entityName)
        }
        validationResult = validNumber
          ? NameValidationError.None
          : NameValidationError.NameError
      } else if (!dtdEnded) {
        let isXmlChar = XsltTokenDiagnostics.xmlChars.indexOf(entityName) > -1
        validationResult = isXmlChar
          ? NameValidationError.None
          : NameValidationError.NameError
      } else {
        validationResult = XsltTokenDiagnostics.validateName(
          entityName,
          ValidationType.Name,
          inheritedPrefixes
        )
      }
    } else {
      validationResult = NameValidationError.NameError
    }
    return { validationResult, entityName }
  }

  private static checkTokenIsExpected(
    prevToken: BaseToken | null,
    token: BaseToken,
    problemTokens: BaseToken[],
    overridType?: TokenLevelState
  ) {
    if (token.error) {
      return
    }
    let tokenType = overridType ? overridType : token.tokenType
    let errorSingleSeparators: string[]
    if (tokenType === TokenLevelState.number) {
      errorSingleSeparators = ['|']
    } else if (tokenType === TokenLevelState.string) {
      errorSingleSeparators = ['|', '+', '-', '*']
    } else {
      errorSingleSeparators = []
    }
    let errDoubleSeparators
    if (tokenType === TokenLevelState.nodeNameTest) {
      errDoubleSeparators = ['{}', '[]', '()']
    } else if (
      tokenType === TokenLevelState.number ||
      tokenType === TokenLevelState.string
    ) {
      errDoubleSeparators = ['{}', '[]', '()', '*:', '::', '//']
    } else {
      errDoubleSeparators = ['{}', '[]', '()', '*:', '::']
    }
    if (prevToken) {
      let isXPathError = false
      if (
        prevToken.tokenType === TokenLevelState.complexExpression ||
        prevToken.tokenType === TokenLevelState.entityRef
      ) {
        // no error
      } else if (
        prevToken.tokenType === TokenLevelState.uriLiteral &&
        tokenType !== TokenLevelState.nodeNameTest
      ) {
        isXPathError = true
      } else if (prevToken.tokenType === TokenLevelState.operator) {
        if (
          prevToken.charType === CharLevelState.rB ||
          prevToken.charType === CharLevelState.rPr ||
          prevToken.charType === CharLevelState.rPr
        ) {
          isXPathError = true
        } else if (prevToken.charType === CharLevelState.dSep) {
          if (errDoubleSeparators.indexOf(prevToken.value) !== -1) {
            isXPathError = true
          }
        } else if (prevToken.charType === CharLevelState.sep) {
          if (errorSingleSeparators.indexOf(prevToken.value) !== -1) {
            isXPathError = true
          }
        }
      } else if (
        tokenType === TokenLevelState.nodeNameTest &&
        prevToken.tokenType === TokenLevelState.uriLiteral
      ) {
        // no error
      } else if (
        tokenType === TokenLevelState.string &&
        prevToken.tokenType === TokenLevelState.string
      ) {
        const currentTokenFirstChar = token.value.charAt(0)
        if (currentTokenFirstChar === '"' || currentTokenFirstChar === "'") {
          isXPathError = true
        }
      } else {
        isXPathError = true
      }
      if (isXPathError) {
        let errType: ErrorType =
          tokenType === TokenLevelState.function
            ? ErrorType.XPathFunctionUnexpected
            : ErrorType.XPathUnexpected
        token.error = errType
        problemTokens.push(token)
      }
    }
  }

  public static isValidFunctionName(
    xmlnsPrefixes: string[],
    xmlnsData: Map<string, XSLTnamespaces>,
    token: BaseToken,
    checkedGlobalFnNames: string[],
    arity?: number
  ) {
    let tokenValue
    if (arity === undefined) {
      let parts = token.value.split('#')
      arity = Number.parseInt(parts[1])
      tokenValue = parts[0]
    } else {
      tokenValue = token.value
    }
    let qFunctionName = tokenValue + '#' + arity
    let fNameParts = qFunctionName.split(':')
    let isValid = false
    let fErrorType = ErrorType.XPathFunction
    if (fNameParts.length === 1) {
      if (tokenValue === 'concat' || tokenValue === 'codepoints-to-string') {
        isValid = arity > 0
      } else {
        isValid = FunctionData.xpath.indexOf(fNameParts[0]) > -1
      }
    } else {
      let xsltType = xmlnsData.get(fNameParts[0])
      if (xmlnsPrefixes.indexOf(fNameParts[0]) < 0) {
        // prefix is not declared
        fErrorType = ErrorType.XPathFunctionNamespace
        isValid = false
      } else if (
        xsltType === XSLTnamespaces.NotDefined ||
        xsltType === undefined
      ) {
        isValid = checkedGlobalFnNames.indexOf(qFunctionName) > -1
      } else {
        switch (xsltType) {
          case XSLTnamespaces.XPath:
            isValid = FunctionData.xpath.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.Array:
            isValid = FunctionData.array.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.Map:
            isValid = FunctionData.map.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.Math:
            isValid = FunctionData.math.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.XMLSchema:
            isValid = FunctionData.schema.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.IXSL:
            isValid = FunctionData.ixsl.indexOf(fNameParts[1]) > -1
            break
          case XSLTnamespaces.Saxon:
          case XSLTnamespaces.ExpathArchive:
          case XSLTnamespaces.ExpathBinary:
          case XSLTnamespaces.ExpathFile:
          case XSLTnamespaces.Exslt:
          case XSLTnamespaces.ExsltMath:
          case XSLTnamespaces.ExsltRegex:
          case XSLTnamespaces.ExsltSets:
          case XSLTnamespaces.ExsltStrings:
            isValid = true
            break
          case XSLTnamespaces.dfdl:
            isValid = true
            break
        }
      }
    }
    fErrorType = isValid ? ErrorType.None : fErrorType
    return { isValid, qFunctionName, fErrorType }
  }

  public static getTextForToken(
    lineNumber: number,
    token: BaseToken,
    document: vscode.TextDocument
  ) {
    let start = token.startCharacter
    if (start < 0) {
      console.error(
        'ERROR: Found illegal token for document: ' + document.fileName
      )
      console.error(
        'token.startCharacter less than zero: ' + token.startCharacter
      )
      console.error(token)
      start = 0
    }

    let startPos = new vscode.Position(lineNumber, start)
    let endPos = new vscode.Position(lineNumber, start + token.length)
    const currentLine = document.lineAt(lineNumber)
    let valueRange = currentLine.range.with(startPos, endPos)
    let valueText = document.getText(valueRange)
    return valueText
  }

  public static resolveXPathVariableReference(
    globalVarName: string | null,
    document: vscode.TextDocument,
    importedVariables: string[],
    token: BaseToken,
    xpathVariableCurrentlyBeingDefined: boolean,
    inScopeXPathVariablesList: VariableData[],
    xpathStack: XPathData[],
    inScopeVariablesList: VariableData[],
    elementStack: ElementData[]
  ): BaseToken | null {
    let fullVarName = XsltTokenDiagnostics.getTextForToken(
      token.line,
      token,
      document
    )
    let varName = fullVarName.startsWith('$')
      ? fullVarName.substring(1)
      : fullVarName.substring(1, fullVarName.length - 1)
    let result: BaseToken | null = null
    let globalVariable = null

    let resolved = this.resolveVariableName(
      inScopeXPathVariablesList,
      varName,
      xpathVariableCurrentlyBeingDefined,
      globalVariable
    )
    if (!resolved) {
      resolved = this.resolveStackVariableName(xpathStack, varName)
    }
    if (!resolved) {
      resolved = this.resolveVariableName(
        inScopeVariablesList,
        varName,
        false,
        globalVariable
      )
    }
    if (!resolved) {
      if (elementStack.length === 1 && globalVarName === varName) {
        // don't asign
      } else {
        resolved = this.resolveStackVariableName(elementStack, varName)
      }
    }
    let importedResolved = false
    if (!resolved) {
      importedResolved =
        globalVarName !== varName && importedVariables.indexOf(varName) > -1
    }
    if (!resolved && !importedResolved) {
      result = token
    }
    return result
  }

  private static createSymbolFromElementTokens(
    name: string,
    id: string,
    fullStartToken: XSLTToken,
    fullEndToken: BaseToken,
    innerToken?: BaseToken
  ) {
    // innerToken to be used if its an attribute-value for example
    let kind: vscode.SymbolKind
    if (name.trim().length === 0) {
      return null
    }
    switch (fullStartToken.tagType) {
      case TagType.XSLTvar:
        kind = vscode.SymbolKind.Enum
        break
      case TagType.XSLTstart:
        switch (name) {
          case 'xsl:package':
          case 'xsl:stylesheet':
          case 'xsl:transform':
            kind = vscode.SymbolKind.Package
            break
          case 'xsl:function':
            kind = vscode.SymbolKind.Function
            break
          case 'xsl:template':
            kind = vscode.SymbolKind.Interface
            break
          case 'xsl:if':
          case 'xsl:when':
          case 'xsl:otherwise':
            kind = vscode.SymbolKind.Namespace
            break
          case 'xsl:key':
            kind = vscode.SymbolKind.Key
            break
          case 'xsl:sequence':
            kind = vscode.SymbolKind.Module
            break
          case 'xsl:value-of':
          case 'xsl:text':
            kind = vscode.SymbolKind.String
            break
          case 'xsl:for-each':
          case 'xsl:for-each-group':
          case 'xsl:apply-templates':
          case 'xsl:iterate':
            kind = vscode.SymbolKind.EnumMember
            break
          case 'xsl:import':
          case 'xsl:include':
            kind = vscode.SymbolKind.File
            break
          case 'xsl:choose':
            kind = vscode.SymbolKind.TypeParameter
            break
          default:
            kind = vscode.SymbolKind.Object
            break
        }
        break
      case TagType.XMLstart:
        kind = vscode.SymbolKind.Object
        break
      default:
        kind = vscode.SymbolKind.Null
        break
    }
    let startCharPos =
      fullStartToken.startCharacter > 0 ? fullStartToken.startCharacter - 1 : 0
    let startPos = new vscode.Position(fullStartToken.line, startCharPos)
    let endPos = new vscode.Position(
      fullEndToken.line,
      fullEndToken.startCharacter + fullEndToken.length + 1
    )
    let innerStartPos
    let innerEndPos
    if (innerToken) {
      innerStartPos = new vscode.Position(
        innerToken.line,
        innerToken.startCharacter
      )
      innerEndPos = new vscode.Position(
        innerToken.line,
        innerToken.startCharacter + innerToken.length
      )
    } else {
      innerStartPos = new vscode.Position(
        fullStartToken.line,
        fullStartToken.startCharacter
      )
      innerEndPos = new vscode.Position(
        fullEndToken.line,
        fullStartToken.startCharacter + fullStartToken.length
      )
    }
    let fullRange = new vscode.Range(startPos, endPos)
    let innerRange = new vscode.Range(innerStartPos, innerEndPos)
    // check for error!
    if (!fullRange.contains(innerRange)) {
      innerStartPos = new vscode.Position(
        fullStartToken.line,
        fullStartToken.startCharacter
      )
      innerEndPos = new vscode.Position(
        fullStartToken.line,
        fullStartToken.startCharacter + fullStartToken.length
      )
      innerRange = new vscode.Range(innerStartPos, innerEndPos)
    }
    let detail = ''
    let fullSymbolName = id.length > 0 ? name + ' \u203A ' + id : name

    if (fullRange.contains(innerRange)) {
      return new vscode.DocumentSymbol(
        fullSymbolName,
        detail,
        kind,
        fullRange,
        innerRange
      )
    } else {
      return null
    }
  }

  public static resolveVariableName(
    variableList: VariableData[],
    varName: string,
    xpathVariableCurrentlyBeingDefined: boolean,
    globalXsltVariable: VariableData | null
  ) {
    let resolved = false
    if (resolved) {
    }
    let decrementedLength = variableList.length - 1
    let globalVariableName = globalXsltVariable?.name
    let defnData: VariableData | undefined = undefined
    // last items in list of declared parameters must be resolved first:
    for (let i = decrementedLength; i > -1; i--) {
      let data = variableList[i]
      if (xpathVariableCurrentlyBeingDefined && i === decrementedLength) {
        // do nothing: we skip last item in list as it's currently being defined
      } else if (data.name === varName && globalVariableName !== data.name) {
        defnData = data
        data.token['referenced'] = true
        break
      }
    }
    return defnData?.token
  }

  public static resolveStackVariableName(
    elementStack: ElementData[] | XPathData[],
    varName: string
  ) {
    let resolvedDefnToken: BaseToken | undefined
    let globalXsltVariable: VariableData | null = null

    for (let i = elementStack.length - 1; i > -1; i--) {
      let inheritedVariables = elementStack[i].variables
      let xpathBeingDefinedInit =
        elementStack[i].xpathVariableCurrentlyBeingDefined
      let xpathBeingDefined = !(
        xpathBeingDefinedInit === undefined || xpathBeingDefinedInit === false
      )
      if (i === 1) {
        // at the level of a global variable declaration
        let elementData: ElementData = <ElementData>elementStack[i]
        let currentVar = elementData.currentVariable
        if (currentVar) {
          // must be inside a global variable declaration - keep this:
          globalXsltVariable = currentVar
        }
      }
      resolvedDefnToken = this.resolveVariableName(
        inheritedVariables,
        varName,
        xpathBeingDefined,
        globalXsltVariable
      )
      if (resolvedDefnToken) {
        break
      }
    }
    return resolvedDefnToken
  }

  private static getDiagnosticsFromUnusedVariableTokens(
    unusedVariableTokens: BaseToken[],
    unresolvedVariableTokens: BaseToken[],
    includeOrImport: boolean
  ): vscode.Diagnostic[] {
    let result: any[] = []
    for (let token of unusedVariableTokens) {
      if (token.referenced === undefined) {
        result.push(this.createUnusedVarDiagnostic(token))
      }
    }
    for (let token of unresolvedVariableTokens) {
      result.push(this.createUnresolvedVarDiagnostic(token, includeOrImport))
    }
    return result
  }

  private static appendDiagnosticsFromProblemTokens(
    variableRefDiagnostics: vscode.Diagnostic[],
    tokens: BaseToken[]
  ): vscode.Diagnostic[] {
    tokens.forEach((token) => {
      let line = token.line
      let endChar = token.startCharacter + token.length
      let tokenValue = token.value
      let msg: string
      let errCode = DiagnosticCode.none
      let diagnosticMetadata: vscode.DiagnosticTag[] = []
      let severity = vscode.DiagnosticSeverity.Error
      switch (token.error) {
        case ErrorType.AxisName:
          msg = `XPath: Invalid axis name: '${tokenValue}`
          break
        case ErrorType.BracketNesting:
          let matchingChar: any =
            XsltTokenDiagnostics.getMatchingSymbol(tokenValue)
          msg =
            matchingChar.length === 0
              ? `XPath: No match found for '${tokenValue}'`
              : `'${tokenValue}' has no matching '${matchingChar}'`
          diagnosticMetadata = [vscode.DiagnosticTag.Unnecessary]
          break
        case ErrorType.ElementNesting:
          msg = `XML: Start tag '${tokenValue}' has no matching close tag`
          break
        case ErrorType.ExpectedElseAfterThen:
          msg = `XML: Expected 'else' but found '${tokenValue}'`
          break
        case ErrorType.ExpectedDollarAfterComma:
          msg = `XML: Expected '$' but found '${tokenValue}'`
          break
        case ErrorType.EntityName:
          msg = `XML: Invalid entity name '${tokenValue}'`
          break
        case ErrorType.XPathKeyword:
          msg = `XPath: Found: '${tokenValue}' expected keyword or operator`
          break
        case ErrorType.DuplicateParameterName:
          msg = `XSLT: Duplicate parameter name: '${tokenValue}'`
          break
        case ErrorType.XSLTKeyUnresolved:
          msg = `XSLT: xsl:key declaration with name '${tokenValue}' not found`
          break
        case ErrorType.AccumulatorNameUnresolved:
          msg = `XSLT: xsl:accumulator with name '${tokenValue}' not found`
          break
        case ErrorType.XPathUnexpected:
          msg = `XPath: Expression context - unexpected token here: ${tokenValue} `
          break
        case ErrorType.XPathFunctionUnexpected:
          msg = `XPath: Unexpected function after expression: '${tokenValue}()' `
          break
        case ErrorType.XPathName:
          msg = `XPath: Invalid name: '${tokenValue}'`
          break
        case ErrorType.XPathOperatorUnexpected:
          msg = `XPath: Operator unexpected at this position: '${tokenValue}'`
          break
        case ErrorType.XPathAwaiting:
          msg = `XPath: Expected expression following: '${tokenValue}'`
          break
        case ErrorType.XPathStringLiteral:
          msg = `String literal not terminated properly: ${tokenValue}`
          break
        case ErrorType.XPathFunction:
          let parts = tokenValue.split('#')
          msg = `XPath: Function: '${parts[0]}' with ${parts[1]} arguments not found`
          break
        case ErrorType.XPathTypeName:
          msg = `XPath: Invalid type: '${tokenValue}'`
          break
        case ErrorType.XPathFunctionNamespace:
          let partsNs = tokenValue.split('#')
          msg = `XPath: Undeclared prefix in function: '${partsNs[0]}'`
          break
        case ErrorType.XPathExpectedComplex:
          const expected = tokenValue === ':=' ? 'in' : ':='
          msg = `XPath: '${tokenValue}' is invalid here, expected  '${expected}'`
          break
        case ErrorType.XPathPrefix:
          msg = `XPath: Undeclared prefix in name: '${tokenValue}'`
          break
        case ErrorType.DuplicateVarName:
          msg = `XSLT: Duplicate global variable/parameter name: '${tokenValue}'`
          break
        case ErrorType.DuplicateFnName:
          msg = `XSLT: Duplicate function name and arity: '${tokenValue}'`
          break
        case ErrorType.DuplicateTemplateName:
          msg = `XSLT: Duplicate xsl:template name '${tokenValue}'`
          break
        case ErrorType.DuplicateAccumulatorName:
          msg = `XSLT: Duplicate xsl:accumulator name '${tokenValue}'`
          break
        default:
          msg = 'Unexepected Error'
          break
      }
      if (token.startCharacter > -1 && endChar > -1) {
        variableRefDiagnostics.push({
          code: errCode,
          message: msg,
          range: new vscode.Range(
            new vscode.Position(line, token.startCharacter),
            new vscode.Position(line, endChar)
          ),
          severity: severity,
          tags: diagnosticMetadata,
          source: '',
        })
      }
    })
    return variableRefDiagnostics
  }

  private static getMatchingSymbol(text: string) {
    let r = ''
    switch (text) {
      case '(':
        r = ')'
        break
      case '[':
        r = ']'
        break
      case '{':
        r = '}'
        break
      case ')':
        r = '('
        break
      case ']':
        r = '['
        break
      case '}':
        r = '{'
        break
      case 'if':
        r = 'then'
        break
      case 'then':
        r = 'else'
        break
      case 'let':
      case 'for':
        r = 'return'
        break
      case 'every':
      case 'some':
        r = 'satisfies'
        break
      case 'else':
        r = 'then'
        break
      default:
        r = ''
        break
    }
    return r
  }

  private static getMatchingToken(text: string) {
    let r = ''
    switch (text) {
      case 'let':
      case 'for':
        r = 'return'
        break
      case 'every':
      case 'some':
        r = 'satisfies'
        break
      case 'then':
        r = 'else'
    }
    return r
  }

  private static createUnusedVarDiagnostic(
    token: BaseToken
  ): vscode.Diagnostic {
    let line = token.line
    let endChar = token.startCharacter + token.length
    return {
      code: '',
      message: 'variable is unused',
      range: new vscode.Range(
        new vscode.Position(line, token.startCharacter),
        new vscode.Position(line, endChar)
      ),
      severity: vscode.DiagnosticSeverity.Hint,
      tags: [vscode.DiagnosticTag.Unnecessary],
      source: '',
    }
  }

  private static createUnresolvedVarDiagnostic(
    token: BaseToken,
    includeOrImport: boolean
  ): vscode.Diagnostic {
    let line = token.line
    let endChar = token.startCharacter + token.length
    if (includeOrImport) {
      return {
        code: '',
        message: `XPath: The variable/parameter: ${token.value} cannot be resolved here, but it may be defined in an external module.`,
        range: new vscode.Range(
          new vscode.Position(line, token.startCharacter),
          new vscode.Position(line, endChar)
        ),
        severity: vscode.DiagnosticSeverity.Warning,
      }
    } else {
      return {
        code: '',
        message: `XPath: The variable/parameter ${token.value} cannot be resolved`,
        range: new vscode.Range(
          new vscode.Position(line, token.startCharacter),
          new vscode.Position(line, endChar)
        ),
        severity: vscode.DiagnosticSeverity.Error,
      }
    }
  }
}
