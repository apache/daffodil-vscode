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

/**
 * Attribute Completion Items for DFDL/XSD Schema Intellisense
 *
 * This module provides static completion data for XML schema attributes used in DFDL (Data Format Description Language)
 * and XSD (XML Schema Definition) documents. It is consumed by the completion provider to offer context-aware
 * attribute suggestions as users type in DFDL schema files.
 *
 * Data Structure:
 * ---------------
 * The attributeCompletion function returns an object containing an array of completion items. Each item contains:
 * - item: The attribute name to display in the completion list
 * - snippetString: A VSCode snippet with placeholders ($1, $2, etc.) and default values
 * - markdownString: Human-readable documentation shown in the completion tooltip
 *
 * Usage by Completion Provider:
 * ------------------------------
 * This data is used by src/language/providers/dfdl.ts to provide intelligent attribute completion when:
 * - User types inside an XML element tag (e.g., <xs:element |)
 * - User triggers completion manually with Ctrl+Space
 * - Completion provider filters these items based on current context and element type
 *
 * Snippet Format:
 * ---------------
 * Snippets use VSCode snippet syntax:
 * - $1, $2, etc.: Tab stop positions for user input
 * - ${1|option1,option2|}: Choice placeholders with predefined options
 * - $0: Final cursor position after all tab stops
 * - spacingChar: Spacing before attribute (typically space)
 * - afterChar: Character after attribute (typically space or >)
 *
 * DFDL Specification Reference:
 * ------------------------------
 * Attributes in this file are defined by:
 * - DFDL v1.0 Specification: https://daffodil.apache.org/docs/dfdl/
 * - XML Schema Part 1: Structures (for xs: attributes)
 * - Attributes prefixed with dfdl: are DFDL-specific extensions to XSD
 *
 * Key Attribute Categories:
 * -------------------------
 * 1. XSD Core Attributes: name, ref, type, default, fixed, minOccurs, maxOccurs, nillable
 * 2. Length Properties: dfdl:length, dfdl:lengthKind, dfdl:lengthUnits, dfdl:lengthPattern
 * 3. Encoding Properties: dfdl:encoding, dfdl:encodingErrorPolicy, dfdl:utf16Width
 * 4. Occurrence Properties: dfdl:occursCount, dfdl:occursCountKind, dfdl:occursStopValue
 * 5. Byte/Bit Order: dfdl:byteOrder, dfdl:bitOrder
 * 6. Text Representation: dfdl:textNumberPattern, dfdl:textStringJustification, dfdl:textPadKind
 * 7. Binary Representation: dfdl:binaryNumberRep, dfdl:binaryFloatRep, dfdl:binaryBooleanTrueRep
 * 8. Separators/Delimiters: dfdl:separator, dfdl:terminator, dfdl:initiator
 * 9. Calendar/Date: dfdl:calendarPattern, dfdl:calendarTimeZone, dfdl:calendarPatternKind
 * 10. Escape Schemes: dfdl:escapeSchemeRef, dfdl:escapeCharacter, dfdl:escapeBlockStart
 * 11. Assertions: testKind, test, testPattern, message, failureType
 * 12. Schema Organization: schemaLocation, namespace
 *
 * @param additionalItems - Additional completion items to merge with the standard set
 * @param nsPrefix - Namespace prefix for schema elements (typically "xs:" or "xsd:")
 * @param dfdlPrefix - DFDL namespace prefix (typically "dfdl:")
 * @param spacingChar - Character to insert before attribute (typically " ")
 * @param afterChar - Character to insert after attribute value (typically " " or ">")
 * @returns Object containing array of completion items with snippets and documentation
 */
// prettier-ignore
export const attributeCompletion = (
    additionalItems, 
    nsPrefix: string, 
    dfdlPrefix: string, 
    spacingChar: string,
    afterChar: string
  ) => {
  return {
    // Array of completion item objects, each representing a DFDL/XSD attribute with its snippet and documentation
    items: [
      // === XSD Core Attributes ===
      // These are fundamental XML Schema attributes used for element definition and reference

      {
        item: 'name',
        snippetString: spacingChar + 'name="$1"$0' + afterChar,
        markdownString: 'specifies the name of this item',
      },
      {
        item: 'ref',
        snippetString: spacingChar + 'ref="$1"$0' + afterChar,
        markdownString: 'Refers to the name of a defined item'
      },
      {
        item: 'default',
        snippetString: spacingChar + 'default="$1"$0' + afterChar,
        markdownString: 'Value automatically assigned to an element in this schema'
      },
      {
        item: 'fixed',
        snippetString: spacingChar + 'fixed="$1"$0' + afterChar,
        markdownString: 'Specifies the exact value of an element in this schema'
      },
      {
        item: 'minOccurs',
        snippetString: spacingChar + 'minOccurs="${1|0,1|}"$0' + afterChar,
        markdownString: 'Minimum number of times element will occur',
      },
      {
        item: 'maxOccurs',
        snippetString: spacingChar + 'maxOccurs="${1|0,1,unbounded|}"$0' + afterChar,
        markdownString: 'Maximum number of times element will occur',
      },
      {
        item: 'nillable',
        snippetString: spacingChar + 'nillable="${true|false|}"$0' + afterChar,
        markdownString: 'Allows for the concept of an element having no value',
      },
      // === DFDL Occurrence Control Properties ===
      // These properties control how many times an element occurs in the data stream

      {
        item: 'type',
        snippetString: spacingChar + 'type="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean' +
          additionalItems +
          '|}"$0' + afterChar,
        markdownString: 'The name of a built in data type, or the name of a simpleType or complexType element defined in this schema',
      },
      {
        item: 'base',
        snippetString: spacingChar + 'type="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean' +
          additionalItems +
          '|}"$0' + afterChar,
        markdownString: 'The name of a built in data type, or the name of a simpleType or complexType element defined in this schema',
      },
      {
        item: 'dfdl:occursCount',
        snippetString: spacingChar + dfdlPrefix + 'occursCount="$1"$0' + afterChar,
        markdownString: 'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression, to obtain the count from another element.',
      },
      {
        item: 'dfdl:occursCountKind',
        snippetString: spacingChar + dfdlPrefix + 'occursCountKind="${1|expression,fixed,implicit,parsed,stopValue|}"$0' + afterChar,
        markdownString: 'Specifies how the actual number of occurrences is to be established',
      },
      {
        item: 'dfdl:occursStopValue',
        snippetString: spacingChar + dfdlPrefix + 'occursStopValue="$1"$0' + afterChar,
        markdownString: 'A whitespace separated list of logical values that specify the alternative logical stop values for the element',
      },

      // === DFDL Byte and Bit Order Properties ===
      // Control the ordering of bytes and bits in binary data

      {
        item: 'dfdl:byteOrder',
        snippetString: spacingChar + dfdlPrefix + 'byteOrder="${1|bigEndian,littleEndian|}"$0' + afterChar,
        markdownString: 'This property applies to all Number, Calendar (date and time), and Boolean types with representation binary',
      },
      {
        item: 'dfdl:bitOrder',
        snippetString: spacingChar + dfdlPrefix + 'bitOrder="${1|mostSignificantBitFirst,leastSignificantBitFirst|}"$0' + afterChar,
        markdownString: 'Determines the specific bits of any grammar region',
      },

      // === DFDL Length Properties ===
      // Define how the length of an element is determined and represented

      {
        item: 'dfdl:length',
        snippetString: spacingChar + dfdlPrefix + 'length="$1"$0',
        markdownString: 'length can be an expression that resolves to an unsigned integer, or a literal unsigned integer' + afterChar,
      },
      {
        item: 'dfdl:lengthKind',
        snippetString: spacingChar + dfdlPrefix + 'lengthKind="${1|delimited,fixed,explicit,implicit,prefixed,pattern,endOfParent|}"$0' + afterChar,
        markdownString: 'lengthKind can be delimited, fixed, explicit, implicit, prefixed,pattern, or endOfParent',
      },
      {
        item: 'dfdl:prefixIncludesPrefixLength',
        snippetString: spacingChar + dfdlPrefix + 'prefixIncludesPrefixLength="${1|yes,no|}"$0' + afterChar,
        markdownString: 'Specifies whether the length given by a prefix includes the length of the prefix as well as the length of the content region',
      },
      {
        item: 'dfdl:prefixLengthType',
        snippetString: spacingChar + dfdlPrefix + 'prefixLengthType="$1"$0' + afterChar,
        markdownString: 'Name of a simple type derived from xs:integer or any subtype of it.',
      },

      // === DFDL Encoding Properties ===
      // Control character encoding and text handling

      {
        item: 'dfdl:utf16Width',
        snippetString: spacingChar + dfdlPrefix + 'utf16Width="${1|fixed,variable|}"$0' + afterChar,
        markdownString: 'Specifies whether the encoding UTF-16 is treated as a fixed or variable width encoding',
      },
      {
        item: 'dfdl:encoding',
        snippetString: spacingChar + dfdlPrefix + 'encoding="${1|US-ASCII,ASCII,UTF-8,UTF-16,UTF-16BE,UTF-16LE,ISO-8859-1|}"$0' + afterChar,
        markdownString: 'This property can be computed by way of an expression which returns an appropriate string value',
      },
      {
        item: 'dfdl:encodingErrorPolicy',
        snippetString: spacingChar + dfdlPrefix + 'encodingErrorPolicy="${1|error,replace|}"$0' + afterChar,
        markdownString: 'This property provides control of how decoding and encoding errors are handled when converting the data to text, or text to data',
      },

      // === DFDL Nil/Null Value Properties ===
      // Handle nil (null) values in data streams

      {
        item: 'dfdl:nilKind',
        snippetString: spacingChar + dfdlPrefix + 'nilKind="${1|literalCharacter,literalValue,logicalValue|}"$0' + afterChar,
        markdownString: 'Specifies how dfdl:<nilValue> is interpreted to represent the nil value in the data stream'
      },
      {
        item: 'dfdl:nilValue',
        snippetString: spacingChar + dfdlPrefix + 'nilValue="$1"$0' + afterChar,
        markdownString: 'Used to provide a logical value that is used to indicate the data is nilled'
      },
      {
        item: 'dfdl:nilValueDelimiterPolicy',
        snippetString: spacingChar + dfdlPrefix + 'nilValueDelimiterPolicy="${1|initiator,terminator,both,none|}"$0' + afterChar,
        markdownString: 'Controls whether matching one of the nil values also involves matching the initiator or terminator specified by the element',
      },
      {
        item: 'dfdl:useNilForDefault',
        snippetString: spacingChar + dfdlPrefix + 'useNilForDefault="${1|yes,no|}"$0' + afterChar,
        markdownString: 'Controls whether to set the Infoset item [nilled] boolean member, or to use the XSD default or fixed properties to obtain a data value'
      },

      // === DFDL Alignment and Positioning Properties ===
      // Control byte/bit alignment and skip regions

      {
        item: 'dfdl:alignment',
        snippetString: spacingChar + dfdlPrefix + 'alignment="${1|1,2,implicit|}"$0' + afterChar,
        markdownString: "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'.",
      },
      {
        item: 'dfdl:lengthUnits',
        snippetString: spacingChar + dfdlPrefix + 'lengthUnits="${1|bits,bytes,characters|}"$0' + afterChar,
        markdownString: 'lengthUnits can be specified as bits, bytes, or characters',
      },
      {
        item: 'dfdl:lengthPattern',
        snippetString: spacingChar + dfdlPrefix + 'lengthPattern="$1"$0' + afterChar,
        markdownString: 'lengthPattern takes a regular expression which is used to scan the data stream for matching data',
      },
      {
        item: 'dfdl:inputValueCalc',
        snippetString: spacingChar + dfdlPrefix + 'inputValueCalc="{$1}"$0' + afterChar,
        markdownString: 'An expression that calculates the value of the element when parsing',
      },
      {
        item: 'dfdl:outputValueCalc',
        snippetString: spacingChar + dfdlPrefix + 'outputValueCalc="{$1}"$0' + afterChar,
        markdownString: 'An expression that calculates the value of the current element when unparsing',
      },
      {
        item: 'dfdl:alignmentUnits',
        snippetString: spacingChar + dfdlPrefix + 'alignmentUnits="${1|bits,bytes|}"$0' + afterChar,
        markdownString: "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'.",
      },
      {
        item: 'dfdl:leadingSkip',
        snippetString: spacingChar + dfdlPrefix + 'leadingSkip="0$1"$0' + afterChar,
        markdownString: 'A non-negative number of bytes or bits to skip before alignment is applied',
      },
      {
        item: 'dfdl:trailingSkip',
        snippetString: spacingChar + dfdlPrefix + 'trailingSkip="0$1"$0' + afterChar,
        markdownString: 'A non-negative number of bytes or bits to skip after the element,',
      },

      // === DFDL Output Control Properties ===
      // Control unparsing behavior and output formatting

      {
        item: 'dfdl:outputNewLine',
        snippetString: spacingChar + dfdlPrefix + 'outputNewLine="${1|%CR;,%LF;,%CR;%LF;,%NEL;,%LS;|}"$0' + afterChar,
        markdownString: 'Specifies the character or characters that are used to replace the %NL; character class entity during unparse',
      },

      // === DFDL Choice and Branching Properties ===
      // Control xs:choice element behavior and direct/dispatch choices

      {
        item: 'dfdl:choiceBranchKey',
        snippetString: spacingChar + dfdlPrefix + 'choiceBranchKey="$1"$0' + afterChar,
        markdownString: 'List of DFDL String Literals',
      },
      {
        item: 'dfdl:choiceDispatchKey',
        snippetString: spacingChar + dfdlPrefix + 'choiceDispatchKey="$1"$0' + afterChar,
        markdownString: 'The expression must evaluate to a string, the string must match one of the dfdl:choiceBranchKey property values of one of the branches of the choice',
      },
      {
        item: 'dfdl:choiceLengthKind',
        snippetString: spacingChar + dfdlPrefix + 'choiceLengthKind="${1|explicit,implicit|}"$0' + afterChar,
        markdownString: 'Determines whether the branches of the choice are always filled (explicit) to the fixed-length specified by dfdl:choiceLength or not filled (implicit)',
      },
      {
        item: 'dfdl:choiceLength',
        snippetString: spacingChar + dfdlPrefix + 'choiceLength="$1"$0' + afterChar,
        markdownString: 'Specifies the length of the choice in bytes, only used when dfdl:choiceLengthKind is explicit',
      },

      // === DFDL Representation Properties ===
      // Control whether data is represented as text or binary

      {
        item: 'dfdl:representation',
        snippetString: spacingChar + dfdlPrefix + 'representation="${1|binary,text|}"$0' + afterChar,
        markdownString: 'Identifies the physical representation of the element as text or binary',
      },

      // === DFDL Text String Properties ===
      // Properties specific to text representation of string data

      {
        item: 'dfdl:textStringJustification',
        snippetString: spacingChar + dfdlPrefix + 'textStringJustification="${1|left,right,center|}"$0' + afterChar,
        markdownString: 'Specifies the string justification',
      },
      {
        item: 'dfdl:textStringPadCharacter',
        snippetString: spacingChar + dfdlPrefix + 'textStringPadCharacter="$1"$0' + afterChar,
        markdownString: 'Specifies the string justification',
      },
      {
        item: 'dfdl:truncateSpecifiedLengthString',
        snippetString: spacingChar + dfdlPrefix + 'truncateSpecifiedLengthString="${1|no,yes|}"$0' + afterChar,
        markdownString: 'This property provides the means to express an error, or the strings can be truncated to fit when the strings in an Infoset being unparsed do not fit within those specified lengths',
      },

      // === DFDL Text Number Properties ===
      // Properties for parsing and unparsing numeric data in text representation

      {
        item: 'dfdl:textStandardZeroRep',
        snippetString: spacingChar + dfdlPrefix + 'textStandardZeroRep="0"$0' + afterChar,
        markdownString: 'Specifies the whitespace separated list of alternative DFDL String Literals that are equivalent to zero ',
      },
      {
        item: 'dfdl:textStandardInfinityRep',
        snippetString: spacingChar + dfdlPrefix + 'textStandardInfinityRep="Inf"$0' + afterChar,
        markdownString: 'The value used to represent infinity.',
      },
      {
        item: 'dfdl:textStandardExponentRep',
        snippetString: spacingChar + dfdlPrefix + 'textStandardExponentRep="E"$0' + afterChar,
        markdownString: 'Defines the actual character(s) that appear in the data as the exponent indicator',
      },
      {
        item: 'dfdl:textStandardNaNRep',
        snippetString: spacingChar + dfdlPrefix + 'textStandardNaNRep="NaN"$0' + afterChar,
        markdownString: 'Specifies the value used to represent NaN ',
      },
      {
        item: 'dfdl:textNumberPattern',
        snippetString: spacingChar + dfdlPrefix + 'textNumberPattern="#,##0.###;-#,##0.###"$0' + afterChar,
        markdownString: 'Indicates whether an xs:decimal element is signed',
      },
      {
        item: 'dfdl:decimalSigned',
        snippetString: spacingChar + dfdlPrefix + 'decimalSigned="${1|yes,no|}"$0' + afterChar,
        markdownString: 'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding',
      },
      {
        item: 'dfdl:textNumberRep',
        snippetString: spacingChar + dfdlPrefix + 'textNumberRep="${1|standard,zoned|}"$0' + afterChar,
        markdownString: 'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding',
      },
      {
        item: 'dfdl:textNumberJustification',
        snippetString: spacingChar + dfdlPrefix + 'textNumberJustification=${1|left,right,center|}"$0' + afterChar,
        markdownString: 'Controls how the data is padded or trimmed on parsing and unparsing',
      },
      {
        item: 'dfdl:textNumberPadCharacter',
        snippetString: spacingChar + dfdlPrefix + 'textNumberPadCharacter="$1"$0' + afterChar,
        markdownString: 'The value that is used when padding or trimming number elements',
      },
      {
        item: 'dfdl:textNumberRoundingMode',
        snippetString: spacingChar + dfdlPrefix + 'textNumberRoundingMode="${1|roundCeiling,roundFloor,roundDown,roundUp,roundHalfEven,roundHalfDown,roundHalfUp,roundUnnecessary|}"$0' + afterChar,
        markdownString: 'Specifies how rounding occurs during unparsing',
      },
      {
        item: 'dfdl:textNumberRoundingIncrement',
        snippetString: spacingChar + dfdlPrefix + 'textNumberRoundingIncrement="0"$0' + afterChar,
        markdownString: 'Specifies the rounding increment to use during unparsing',
      },
      {
        item: 'dfdl:textNumberRounding',
        snippetString: spacingChar + dfdlPrefix + 'textNumberRounding="${1|explicit,pattern|}"$0' + afterChar,
        markdownString: 'Specifies how rounding is controlled during unparsing',
      },
      {
        item: 'dfdl:textNumberCheckPolicy',
        snippetString: spacingChar + dfdlPrefix + 'textNumberCheckPolicy="${1|lax,strict|}"$0' + afterChar,
        markdownString: 'Indicates how lenient to be when parsing against the dfdl:textNumberPattern',
      },
      {
        item: 'dfdl:textOutputMinLength',
        snippetString: spacingChar + dfdlPrefix + 'textOutputMinLength="0"$0' + afterChar,
        markdownString: 'Specifies the minimum content length during unparsing for simple types that do not allow the XSD minLength facet to be specified',
      },
      {
        item: 'dfdl:textStandardDecimalSeparator',
        snippetString: spacingChar + 'dfdl:textStandardDecimalSeparator=","$0' + afterChar,
        markdownString: 'Defines a whitespace separated list of single characters that appear (individually) in the data as the decimal separator',
      },
      {
        item: 'dfdl:textStandardGroupingSeparator',
        snippetString: spacingChar + 'dfdl:textStandardGroupingSeparator=","$0' + afterChar,
        markdownString: 'Specifies the single character that can appear in the data as the grouping separator',
      },
      {
        item: 'dfdl:textPadKind',
        snippetString: spacingChar + dfdlPrefix + 'textPadKind="${1|none,padChar|}"$0' + afterChar,
        markdownString: 'Indicates whether to pad the data value on unparsing',
      },
      {
        item: 'dfdl:textStandardBase',
        snippetString: spacingChar + dfdlPrefix + 'textStandardBase="${1|2,8,10,16|}"$0' + afterChar,
        markdownString: 'Indicates the number base',
      },
      {
        item: 'dfdl:textZonedSignStyle',
        snippetString: spacingChar + dfdlPrefix + 'textZonedSignStyle="$1"$0' + afterChar,
        markdownString: 'Specifies the code points that are used to modify the sign nibble of the byte containing the sign',
      },
      {
        item: 'dfdl:textTrimKind',
        snippetString: spacingChar + dfdlPrefix + 'textTrimKind="${1|none,padChar|}"$0' + afterChar,
        markdownString: 'Indicates whether to trim data on parsing',
      },

      // === DFDL Text Boolean Properties ===
      // Properties for text representation of boolean values

      {
        item: 'dfdl:textBooleanTrueRep',
        snippetString: spacingChar + dfdlPrefix + 'textBooleanTrueRep="$1"$0' + afterChar,
        markdownString: 'A whitespace separated list of representations to be used for true',
      },
      {
        item: 'dfdl:textBooleanFalseRep',
        snippetString: spacingChar + dfdlPrefix + 'textBooleanFalseRep="$1"$0' + afterChar,
        markdownString: 'A whitespace separated list of representations to be used for false',
      },
      {
        item: 'dfdl:textBooleanJustification',
        snippetString: spacingChar + dfdlPrefix + 'textBooleanJustification="${1|left,right,center|}"$0' + afterChar,
        markdownString: 'Controls how the data is padded or trimmed on parsing and unparsing',
      },
      {
        item: 'dfdl:textBooleanPadCharacter',
        snippetString: spacingChar + dfdlPrefix + 'textBooleanPadCharacter="$1"$0' + afterChar,
        markdownString: 'The value that is used when padding or trimming boolean elements',
      },

      // === DFDL Sequence Properties ===
      // Properties for xs:sequence groups controlling ordering and separators

      {
        item: 'dfdl:sequenceKind',
        snippetString: spacingChar + dfdlPrefix + 'SequenceKind ="${1|ordered,unordered|}"$0' + afterChar,
        markdownString: 'Defines whether the items are expected in the same order that they appear in the schema or in any order',
      },
      {
        item: 'dfdl:separator',
        snippetString: spacingChar + dfdlPrefix + 'separator="$1"$0' + afterChar,
        markdownString: 'Specifies a whitespace separated list of alternative DFDL String Literals that are the possible separators for the sequence',
      },
      {
        item: 'dfdl:separatorPosition',
        snippetString: spacingChar + dfdlPrefix + 'separatorPosition="${1|infix,postfix,prefix|}"$0' + afterChar,
        markdownString: 'specifies where the separator occurs between the elements',
      },
      {
        item: 'dfdl:separatorSuppressionPolicy',
        snippetString: spacingChar + dfdlPrefix + 'separatorSuppressionPolicy="${1|anyEmpty,never,trailingEmpty,trailingEmptyStrict|}"$0' + afterChar,
        markdownString: 'Controls the circumstances when separators are expected in the data when parsing, or generated when unparsing',
      },

      // === DFDL Delimiter Properties ===
      // Properties for initiators and terminators marking element boundaries

      {
        item: 'dfdl:terminator',
        snippetString: spacingChar + dfdlPrefix + 'terminator="$1"$0' + afterChar,
        markdownString: 'charater or bytes found in the input stream that designate termination of an element',
      },
      {
        item: 'dfdl:initiator',
        snippetString: spacingChar + dfdlPrefix + 'initiator="$1"$0' + afterChar,
        markdownString: 'Specifies an ordered whitespace separated list of alternative DFDL String Literals one of which marks the beginning of the element or group of elements ',
      },
      {
        item: 'dfdl:initiatedContent',
        snippetString: spacingChar + dfdlPrefix + 'initiatedContent="${1|yes,no|}"$0' + afterChar,
        markdownString: 'yes indicates all branches of a choice are initiated\nno indicates the branch dfdl:initator property may be ste to empty string',
      },
      {
        item: "dfdl:documentFinalTerminatorCanBeMissing" + afterChar,
        snippetString: spacingChar + dfdlPrefix + 'documentFinalTerminatorCanBeMissing="${1|yes,no|}"$0',
        markdownString: 'Specifies whether the final line can be missing',
      },

      // === DFDL Empty Element Properties ===
      // Control behavior when elements have no content

      {
        item:'dfdl:emptyValueDelimiterPolicy',
        snippetString: spacingChar + dfdlPrefix + 'emptyValueDelimiterPolicy="${1|initiator,terminator,both,none|}"$0' + afterChar,
        markdownString: 'Indicates which of initiator, terminator, both, or neither must be present when an element in the data stream is empty.',
      },
      {
        item:'dfdl:emptyElementParsePolicy',
        snippetString: spacingChar + dfdlPrefix + 'emptyElementParsePolicy="${1|treatAsAbsent,treatAsEmpty|}"$0' + afterChar,
        markdownString: 'Indicates which of initiator, terminator, both, or neither must be present when an element in the data stream is empty.',
      },

      // === DFDL Miscellaneous Properties ===
      // Additional properties for special features

      {
        item: 'dfdl:textBidi',
        snippetString: spacingChar + dfdlPrefix + 'textBidi="${1|no,yes|}"$0' + afterChar,
        markdownString: 'This property exists in anticipation of future DFDL features that enable bidirectional text processing',
      },
      {
        item: 'dfdl:hiddenGroupRef',
        snippetString: spacingChar + 'dfdl:hiddenGroupRef="$1"$0' + afterChar,
        markdownString: 'Reference to a global model group definition',
      },
      {
        item: 'dfdl:fillByte',
        snippetString: spacingChar + dfdlPrefix + 'fillByte="$1"$0' + afterChar,
        markdownString: 'A single byte specified as a DFDL byte value entity or a single character, used on unparsing to fill empty space',
      },
      {
        item: 'dfdl:ignoreCase',
        snippetString: spacingChar + dfdlPrefix + 'ignoreCase="${1|no,yes|}"$0' + afterChar,
        markdownString: 'Whether mixed case data is accepted when matching delimiters and data values on input',
      },

      // === DFDL Binary Number Properties ===
      // Properties for binary representation of numeric values

      {
        item: 'dfdl:binaryNumberRep',
        snippetString: spacingChar + dfdlPrefix + 'binaryNumberRep="${1|binary,packed,bcd,ibm4690Packed|}"$0' + afterChar,
        markdownString: 'binary,packed,bcd, or ibm4690Packed',
      },
      {
        item: 'dfdl:floating',
        snippetString: spacingChar + dfdlPrefix + 'floating="${1|no,yes|}"$0' + afterChar,
        markdownString: 'yes or no',
      },
       {
        item: 'dfdl:binaryFloatRep',
        snippetString: spacingChar + dfdlPrefix + 'binaryFloatRep="${1|ieee,ibm390Hex|}"$0' + afterChar,
        markdownString: 'ieee or ibm390Hex',
      },
      {
        item: 'dfdl:binaryDecimalVirtualPoint',
        snippetString: spacingChar + dfdlPrefix + 'binaryDecimalVirtualPoint="$1"$0' + afterChar,
        markdownString: 'An integer that represents the position of an implied decimal point within a number',
      },
      {
        item: 'dfdl:binaryPackedSignCodes',
        snippetString: spacingChar + dfdlPrefix + 'binaryPackedSignCodes="$1"$0' + afterChar,
        markdownString: 'A whitespace separated string giving the hex sign nibbles to use for a positive value, a negative value, an unsigned value, and zero',
      },
      {
        item: 'dfdl:binaryNumberCheckPolicy',
        snippetString: spacingChar + dfdlPrefix + 'binaryNumberCheckPolicy="${1|strict,lax|}"$0' + afterChar,
        markdownString: 'Indicates how lenient to be when parsing binary numbers',
      },

      // === DFDL Binary Boolean Properties ===
      // Properties for binary representation of boolean values

      {
        item: 'dfdl:binaryBooleanTrueRep',
        snippetString: spacingChar + dfdlPrefix + 'binaryBooleanTrueRep="$1"$0' + afterChar,
        markdownString: 'A binary xs:unsignedInt gives the representation for true',
      },
      {
        item: 'dfdl:binaryBooleanFalseRep',
        snippetString: spacingChar + dfdlPrefix + 'binaryBooleanFalseRep="$1"$0' + afterChar,
        markdownString: 'A binary xs:unsignedInt gives the representation for false',
      },

      // === DFDL Calendar/Date-Time Properties ===
      // Properties for parsing and unparsing date/time data

      {
        item: 'dfdl:calendarPattern',
        snippetString: spacingChar + dfdlPrefix + 'calendarPattern="$1"$0' + afterChar,
        markdownString: 'Defines the ICU pattern that describes the format of the calendar. The pattern defines where the year, month, day, hour, minute, second, fractional second and time zone components appear',
      },
      {
        item: 'dfdl:calendarPatternKind',
        snippetString: spacingChar + dfdlPrefix + 'calendarPatternKind="${1|explicit,implicit|}"$0' + afterChar,
        markdownString: 'The pattern is given by dfdl:calendarPattern explicit or the pattern is derived from the XML schema date/time type (implicit)',
      },
      {
        item: 'dfdl:calendarCheckPolicy',
        snippetString: spacingChar + dfdlPrefix + 'calendarCheckPolicy="${1|strict,lax|}"$0' + afterChar,
        markdownString: 'Indicates how lenient to be when parsing against the pattern',
      },
      {
        item: 'dfdl:calendarTimeZone',
        snippetString: spacingChar + dfdlPrefix + 'calendarTimeZone="$1"$0' + afterChar,
        markdownString: 'Provides the time zone that is assumed if no time zone explicitly occurs in the data',
      },
      {
        item: 'dfdl:calendarObserveDST',
        snippetString: spacingChar + dfdlPrefix + 'calendarObserveDST="${1|yes,no|}"$0' + afterChar,
        markdownString: 'Whether the time zone given in dfdl:calendarTimeZone observes daylight savings time',
      },
      {
        item: 'dfdl:calendarFirstDayOfWeek',
        snippetString: spacingChar + dfdlPrefix + 'calendarFirstDayOfWeek="${1|Monday,Sunday|}"$0' + afterChar,
        markdownString: 'The day of the week upon which a new week is considered to start',
      },
      {
        item: 'dfdl:calendarDaysInFirstWeek',
        snippetString: spacingChar + dfdlPrefix + 'calendarDaysInFirstWeek="${1|1,2,3,4,5,6,7|}"$0' + afterChar,
        markdownString: 'Specify the number of days of the new year that must fall within the first week',
      },
      {
        item: 'dfdl:calendarCenturyStart',
        snippetString: spacingChar + dfdlPrefix + 'calendarCenturyStart="$1"$0' + afterChar,
        markdownString: 'specifies the two digits that start a 100-year window that contains the current year',
      },
      {
        item: 'dfdl:calendarLanguage',
        snippetString: spacingChar + dfdlPrefix + 'calendarLanguage="$1"$0' + afterChar,
        markdownString: 'The language that is used when the pattern produces a presentation in text',
      },
      {
        item: 'dfdl:textCalendarJustification',
        snippetString: spacingChar + dfdlPrefix + 'textCalendarJustification="${1|left,right,center|}"$0' + afterChar,
        markdownString: 'Controls how the data is padded or trimmed on parsing and unparsing',
      },
      {
        item: 'dfdl:textCalendarPadCharacter',
        snippetString: spacingChar + dfdlPrefix + 'textCalendarPadCharacter="$1"$0' + afterChar,
        markdownString: 'The value that is used when padding or trimming calendar elements. The value can be a single character or a single byte',
      },
      {
        item: 'dfdl:binaryCalendarRep',
        snippetString: spacingChar + dfdlPrefix + 'binaryCalendarRep="${1|packed,bcd,ibm4690Packed,binarySeconds,binaryMilliseconds|}"$0' + afterChar,
        markdownString: 'Valid values are packed, bcd, ibm4690Packed, binarySeconds, binaryMilliseconds',
      },
      {
        item: 'dfdl:binaryCalendarEpoch',
        snippetString: spacingChar + dfdlPrefix + 'binaryCalendarEpoch="$1"$0' + afterChar,
        markdownString: 'The epoch from which to calculate dates and times. Used when dfdl:binaryCalendarRep is binarySeconds or binaryMilliseconds',
      },

      // === DFDL Escape Scheme Properties ===
      // Properties for defining and using escape mechanisms

      {
        item: 'dfdl:escapeSchemeRef',
        snippetString: spacingChar + dfdlPrefix + 'escapeSchemeRef="$1"$0' + afterChar,
        markdownString: "Refers to a named escape scheme definition via its qualified name",
      },
      {
        item: 'dfdl:escapeKind',
        snippetString: spacingChar + dfdlPrefix + 'escapeKind="${1|escapeCharacter,escapeBlock|}"$0' + afterChar,
        markdownString: "The type of escape mechanism defined in the escape scheme",
      },
      {
        item: 'dfdl:escapeCharacter',
        snippetString: spacingChar + dfdlPrefix + 'escapeCharacter="$1"$0' + afterChar,
        markdownString: "Specifies one character that escapes the subsequent character",
      },
      {
        item: 'dfdl:escapeBlockStart',
        snippetString: dfdlPrefix + 'escapeBlockStart="$1"$0',
        markdownString: "The string of characters that denotes the beginning of a sequence of characters escaped by a pair of escape strings" + afterChar,
      },
      {
        item: 'dfdl:escapeBlockEnd',
        snippetString: spacingChar + dfdlPrefix + 'escapeBlockEnd="$1"$0',
        markdownString: "The string of characters that denotes the end of a sequence of characters escaped by a pair of escape strings" + afterChar,
      },
      {
        item: 'dfdl:escapeEscapeCharacter',
        snippetString: spacingChar + dfdlPrefix + 'escapeEscapeCharacter="$1"$0',
        markdownString: "Specifies one character that escapes an immediately following dfdl:escapeCharacter" + afterChar,
      },
      {
        item: 'dfdl:extraEscapedCharacters',
        snippetString: spacingChar + dfdlPrefix + 'extraEscapedCharacters="$1"$0',
        markdownString: "A whitespace separated list of single characters that must be escaped in addition to the in-scope delimiters" + afterChar,
      },
      {
        item: 'dfdl:generateEscapeBlock',
        snippetString: spacingChar + dfdlPrefix + 'generateEscapeBlock="${1|always,whenNeeded|}"$0' + afterChar,
        markdownString: "The type of escape mechanism defined in the escape scheme",
      },
      {
        item: 'dfdl:escapeCharacterPolicy',
        snippetString: spacingChar + dfdlPrefix + 'escapeCharacterPolicy="${1|all,delimiters|}"$0' + afterChar,
        markdownString: "The type of escape mechanism defined in the escape scheme",
      },

      // === DFDL Assert and Discriminator Properties ===
      // Properties for assertions and discriminators used in validation and disambiguation

      {
        item: 'testKind',
        snippetString: spacingChar + 'testKind="${1|expression,pattern|}"$0' + afterChar,
        markdownString: 'Specifies whether a DFDL expression or DFDL regular expression pattern is used in the dfdl:assert',
      },
      {
        item: 'test',
        snippetString: spacingChar + dfdlPrefix + 'test="{$1}"$0' + afterChar,
        markdownString: 'A DFDL expression that evaluates to true or false.',
      },
      {
        item: 'testPattern',
        snippetString: spacingChar + 'testPattern="$1"$0' + afterChar,
        markdownString: 'A DFDL regular expression that is applied against the data stream',
      },
      {
        item: 'message',
        snippetString: spacingChar + 'message="$1"$0' + afterChar,
        markdownString: 'Defines text for use in an error message',
      },
      {
        item: 'failureType',
        snippetString: spacingChar + 'failureType="${1|processingError,recoverableError|}"$0' + afterChar,
        markdownString: 'Specifies the type of failure that occurs when the dfdl:assert is unsuccessful',
      },

      // === XSD Schema Organization Attributes ===
      // Attributes for schema imports and includes

      {
        item: 'schemaLocation',
        snippetString: spacingChar + 'schemaLocation="$1"$0' + afterChar,
        markdownString: 'Specifies the location of the schema'
      },
      {
        item: 'namespace',
        snippetString: spacingChar + 'namespace="$1"$0' + afterChar,
        markdownString: 'User defined identifier for the imported schemaLocation'
      }
    ],
  }
}
