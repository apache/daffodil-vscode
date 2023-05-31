/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import {
  XPathLexer,
  ExitCondition,
  LexPosition,
  Token,
  BaseToken,
} from './xpLexer'
import {
  XslLexer,
  GlobalInstructionData,
  GlobalInstructionType,
} from './xslLexer'
import { XsltTokenDiagnostics } from './xsltTokenDiagnostics'
import { DocumentChangeHandler } from './documentChangeHandler'
import { Match, PartialMatch } from '../interfaces/interfaces'
// import { jumpToMatchingTag, selectPairContents } from '../interfaces/commands'
import config from '../interfaces/configuration'
import {
  findMatchingTag,
  getTagForPosition,
  getTagsForPosition,
} from '../interfaces/tagMatcher'
import { parseTags } from '../interfaces/tagParser'
import TagStyler from '../interfaces/tagStyler'

const tokenModifiers = new Map<string, number>()
const startList: vscode.Position[] = []
const endList: vscode.Position[] = []

const legend = (function () {
  const tokenTypesLegend = XslLexer.getTextmateTypeLegend()

  const tokenModifiersLegend = [
    'declaration',
    'documentation',
    'member',
    'static',
    'abstract',
    'deprecated',
    'modification',
    'async',
  ]
  tokenModifiersLegend.forEach((tokenModifier, index) =>
    tokenModifiers.set(tokenModifier, index)
  )

  return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend)
})()

export class XPathSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
  private xpLexer = new XPathLexer()
  private collection: vscode.DiagnosticCollection
  private diagnosticList = new Array<vscode.Diagnostic>()
  public constructor(collection: vscode.DiagnosticCollection) {
    this.collection = collection
  }

  private static globalInstructionData: GlobalInstructionData[] = []

  public static getGlobalInstructionData() {
    return XPathSemanticTokensProvider.globalInstructionData
  }

  public static setVariableNames = (names: string[]) => {
    const data: GlobalInstructionData[] = []

    names.forEach((name) => {
      const token: BaseToken = {
        line: 1,
        startCharacter: 0,
        length: 1,
        value: name,
        tokenType: 0,
      }
      const variableInstruction: GlobalInstructionData = {
        type: GlobalInstructionType.Variable,
        name: name,
        token: token,
        idNumber: 0,
      }
      data.push(variableInstruction)
    })
    XPathSemanticTokensProvider.globalInstructionData = data
  }

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    this.xpLexer.documentTokens = []
    let variables: string[] = this.findAllVariables(document.getText())
    let tokens: Token[] = []

    const tokenPositions = this.findAllXPath(document.getText())

    for (let i = 0; i < tokenPositions.length; i++) {
      const line = tokenPositions[i][0]
      const startCharacter = tokenPositions[i][1]
      const documentOffset = tokenPositions[i][2]

      const lexPositions: LexPosition = {
        line: line,
        startCharacter: startCharacter,
        documentOffset: documentOffset,
      }
      let start = new vscode.Position(line, startCharacter)
      let tmpTokens = this.xpLexer.analyse(
        document.getText(),
        ExitCondition.CurlyBrace,
        lexPositions
      )
      let end = new vscode.Position(
        lexPositions.line,
        lexPositions.startCharacter
      )
      //Add start and end positions of XPath so we don't have to recalculate every time Intellisense is triggered
      startList.push(start)
      endList.push(end)
      tokens = tokens.concat(tmpTokens)

      // This was moved to inside the loop. If it isn't, the sections of XPath will be treated
      //   as a single XPath section instead of multiples
      setTimeout(() => this.reportProblems(tmpTokens, document, variables), 0)

      // Reset the xpLexer. If this is not done, existing tokens will not be flushed
      //   and will be re-added to the tokens list. This might not affect the operation, but it does
      //   increase the memory required by the tokenizer, potentially running out of memory.
      this.xpLexer.reset()
    }

    const builder = new vscode.SemanticTokensBuilder()
    tokens.forEach((token) => {
      builder.push(
        token.line,
        token.startCharacter,
        token.length,
        token.tokenType,
        0
      )
    })
    this.diagnosticList = new Array<vscode.Diagnostic>()
    return builder.build()
  }

  // Identify all sections in the full document that should be treated as XPath
  private findAllXPath(document: String): [number, number, number][] {
    let tokensFound: [number, number, number][] = []
    let charCount = 0
    const lines = document.split('\n')

    // Regex should match up to the character before we need to start detecting XPath
    // In these cases, there is a left curly brace right after the regex match, so
    //   we may need to adjust the exact points if there are schemas with spaces between
    //   the open quote and the left curly brace.
    // Also note that the start location that we return for processing should NOT include the
    //   left curly brace. The way that the tokenizer determines when to stop processing
    //   is to find an extra closing character (curly brace, single quote, or double quote)
    //   If it doesn't terminate, it will tokenize the remainder of the file.
    const xPathRegex = /(\w+)=("|')(?=\{)/
    let isComment: Boolean = false

    for (let i = 0; i < lines.length; i++) {
      let xPathMatch = lines[i].match(xPathRegex)

      if (!isComment && lines[i].includes('<!--')) {
        isComment = true
      }

      if (isComment) {
        let closeIndex = lines[i].search('-->')

        if (closeIndex !== -1) {
          isComment = false

          if (xPathMatch) {
            if (closeIndex > lines[i].search(xPathMatch[0])) {
              xPathMatch = null
            }
          }
        } else {
          xPathMatch = null
        }
      }

      // The items in the tuple are used to determine the start point for the tokenizer. They are
      //   the line number, position offset in the line, and document offset.
      // The +1 on the position offset accounts for the opening curly brace.
      if (xPathMatch) {
        const lineOffset =
          lines[i].search(xPathMatch[0]) + xPathMatch[0].length + 1
        tokensFound.push([
          i,
          (xPathMatch.index || 0) + xPathMatch[0].length + 1,
          charCount + lineOffset,
        ])
      }

      // Used to keep track of the document offset. The +1 accounts for newlines.
      charCount += lines[i].length + 1
    }

    return tokensFound
  }

  // Find the names of all variables in the file
  private findAllVariables(document: String | undefined): string[] {
    if (document === undefined) {
      return []
    }

    const lines = document.split('\n')
    const variableRegex = /(dfdl:defineVariable.*name=\")(.*?)\"/
    const variables: string[] = []

    // Capture and return a list of variable names
    for (let i = 0; i < lines.length; i++) {
      const variableMatch = lines[i].match(variableRegex)

      if (variableMatch) {
        variables.push(variableMatch[2])
      }
    }

    return variables
  }

  // This function will produce the error/warning list for vscode
  private reportProblems(
    allTokens: Token[],
    document: vscode.TextDocument,
    variables: string[]
  ) {
    let diagnostics = XsltTokenDiagnostics.calculateDiagnostics(
      document,
      allTokens,
      DocumentChangeHandler.lastXMLDocumentGlobalData,
      XPathSemanticTokensProvider.globalInstructionData,
      [],
      variables
    )
    diagnostics.forEach((diag) => {
      this.diagnosticList.push(diag)
    })
    if (this.diagnosticList.length > 0) {
      this.collection.set(document.uri, this.diagnosticList)
    } else {
      this.collection.clear()
    }
  }
}

function updateTagStatusBarItem(
  status: vscode.StatusBarItem,
  tagsList: PartialMatch[],
  position: number
) {
  const tagsForPosition = getTagsForPosition(tagsList, position)

  status.text = tagsForPosition.reduce((str, pair, i, pairs) => {
    const name = pair.opening!.name!

    if (i === 0) {
      return name
    }

    const separator =
      pairs[i - 1].attributeNestingLevel < pair.attributeNestingLevel
        ? ' ~ '
        : ' › '

    return str + separator + name
  }, '')

  status.text = status.text.trim().replace('›  ›', '»')

  if (tagsForPosition.length > 1) {
    status.show()
  } else {
    status.hide()
  }
}

export function isXPath(position: vscode.Position): boolean {
  for (let i = 0; i < startList.length; i++) {
    if (
      position.isBeforeOrEqual(endList[i]) &&
      position.isAfterOrEqual(startList[i])
    )
      return true
  }
  return false
}

export function activate(context: vscode.ExtensionContext) {
  const docChangeHandler = new DocumentChangeHandler()
  let activeEditor = vscode.window.activeTextEditor

  if (activeEditor) {
    docChangeHandler.registerXMLEditor(activeEditor)
  }

  const xpathDiagnosticsCollection =
    vscode.languages.createDiagnosticCollection('dfdl')
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'dfdl' },
      new XPathSemanticTokensProvider(xpathDiagnosticsCollection),
      legend
    )
  )

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    120
  )
  const tagStyler = new TagStyler()

  status.tooltip = 'Path to tag'

  let editorText: string = ''
  let tagsList: PartialMatch[] = []

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((evt) => {
      const editor = evt.textEditor

      if (
        !config.isEnabled ||
        !editor ||
        editor !== vscode.window.activeTextEditor
      ) {
        return
      }

      if (editorText !== editor.document.getText()) {
        editorText = editor.document.getText()
        tagsList = parseTags(editorText, config.emptyElements)
      }

      // Tag breadcrumbs
      if (config.showPath) {
        updateTagStatusBarItem(
          status,
          tagsList,
          editor.document.offsetAt(editor.selection.active)
        )
      }

      // Highlight matching tags
      tagStyler.clearDecorations()

      let matches: any[] = []
      if (config.highlightFromContent) {
        matches = editor.selections
          .map((sel) =>
            getTagForPosition(
              tagsList,
              editor.document.offsetAt(sel.active),
              config.highlightSelfClosing
            )
          )
          .filter((match) => match !== undefined)
      } else {
        matches = editor.selections
          .map((sel) =>
            findMatchingTag(
              tagsList,
              editor.document.offsetAt(sel.active),
              config.highlightFromName,
              config.highlightFromAttributes
            )
          )
          .filter(
            (match) =>
              match &&
              (match.opening !== match.closing || config.highlightSelfClosing)
          )
      }

      matches.forEach((match) => tagStyler.decoratePair(match as Match, editor))
    })
  )

  /* context.subscriptions.push(
    vscode.commands.registerCommand(
      'highlight-matching-tag.jumpToMatchingTag',
      jumpToMatchingTag
    )
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'highlight-matching-tag.selectPairContents',
      selectPairContents
    )
  )*/
}
