/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LanguageConfiguration, DocumentTypes } from './xslLexer'
import { XMLSnippets } from './xmlSnippets'
import { XSLTSnippets } from './xsltSnippets'
import { XSLTSchema } from './xsltSchema'
import { XSLTSchema4 } from './xsltSchema4'

export class XSLTConfiguration {
  // Note: Non-standard 'else', 'then', 'on-duplicates' can be used in Saxon 10.0
  static expressionAtts = [
    'context-item',
    'count',
    'else',
    'from',
    'group-adjacent',
    'group-by',
    'group-ending-with',
    'group-starting-with',
    'from',
    'for-each-item',
    'for-each-source',
    'initial-value',
    'key',
    'match',
    'namespace-context',
    'on-duplicates',
    'select',
    'test',
    'then',
    'use',
    'use-when',
    'value',
    'with-params',
    'xpath',
  ]

  static avtAtts = [
    'allow-duplicate-names',
    'base-uri',
    'build-tree',
    'byte-order-mark',
    'case-order',
    'cdata-section-elements',
    'collation',
    'data-type',
    'doctype-public',
    'doctype-system',
    'encoding',
    'error-code',
    'escape-uri-attributes',
    'flags',
    'format',
    'grouping-separator',
    'grouping-size',
    'href',
    'html-version',
    'include-context-type',
    'indent',
    'item-separator',
    'json-node-output-method',
    'lang',
    'letter-value',
    'media-type',
    'method',
    'name',
    'namespace',
    'normalization-form',
    'omit-xml-declaration',
    'order',
    'ordinal',
    'ordinal-type',
    'output-version',
    'parameter-document',
    'regex',
    'separator',
    'schema-aware',
    'stable',
    'standalone',
    'suppress-indentaion',
    'terminate',
    'undeclar-prefixes',
    'start-at',
  ]

  static xsltPrefix = 'xsl'

  static configuration: LanguageConfiguration = {
    expressionAtts: XSLTConfiguration.expressionAtts,
    variableElementNames: ['xsl:variable', 'xsl:param'],
    avtAtts: XSLTConfiguration.avtAtts,
    nativePrefix: XSLTConfiguration.xsltPrefix,
    tvtAttributes: ['expand-text'],
    nonNativeAvts: true,
    rootElementSnippets: XSLTSnippets.xsltRootTags,
    schemaData: new XSLTSchema(),
    docType: DocumentTypes.XSLT,
  }

  static schemaData4 = new XSLTSchema4()
}

export class XPathConfiguration {
  static configuration: LanguageConfiguration = {
    expressionAtts: [],
    variableElementNames: [],
    nativePrefix: '',
    tvtAttributes: [],
    nonNativeAvts: true,
    rootElementSnippets: [],
    docType: DocumentTypes.XPath,
  }
}

export class XMLConfiguration {
  public static configuration: LanguageConfiguration = {
    expressionAtts: [],
    variableElementNames: [],
    nativePrefix: 'qz',
    tvtAttributes: [],
    nonNativeAvts: false,
    rootElementSnippets: XMLSnippets.xsltRootTags,
    elementSnippets: XMLSnippets.generalTags,
    docType: DocumentTypes.Other,
  }
}

export class XSLTLightConfiguration {
  // used for global instruction processing only
  public static configuration: LanguageConfiguration = {
    expressionAtts: [],
    variableElementNames: [],
    nativePrefix: 'xsl',
    tvtAttributes: [],
    nonNativeAvts: false,
    docType: DocumentTypes.XSLT,
  }
}
