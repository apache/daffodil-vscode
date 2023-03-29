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

// prettier-ignore
export const attributeCompletion = (additionalItems, nsPrefix: string, dfdlPrefix: string) => {
  return {
    items: [
      {
        item: 'name',
        snippetString: 'name="$1"$0',
        markdownString: 'specify name',
      },
      {
        item: 'ref',
        snippetString: 'ref="$1"$0',
        markdownString: 'specify reference name'
      },
      {
        item: 'minOccurs',
        snippetString: 'minOccurs="${1|0,1|}"$0',
        markdownString: 'Minimum number of times element will occur',
      },
      {
        item: 'maxOccurs',
        snippetString: 'maxOccurs="${1|0,1,unbounded|}"$0',
        markdownString: 'Maximum number of times element will occur',
      },
      {
        item: 'dfdl:occursCount',
        snippetString: dfdlPrefix + 'occursCount="$1"$0',
        markdownString: 'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression, to obtain the count from another element.',
      },
      {
        item: 'dfdl:byteOrder',
        snippetString: dfdlPrefix + 'byteOrder="${1|bigEndian,littleEndian|}"$0',
        markdownString: 'This property applies to all Number, Calendar (date and time), and Boolean types with representation binary',
      },
      {
        item: 'dfdl:bitOrder',
        snippetString: dfdlPrefix + 'bitOrder="${1|mostSignificantBitFirst,leastSignificantBitFirst|}"$0',
        markdownString: 'Determines the specific bits of any grammar region',
      },
      {
        item: 'dfdl:occursCountKind',
        snippetString: dfdlPrefix + 'occursCountKind="${1|expression,fixed,implicit,parsed,stopValue|}"$0',
        markdownString: 'Specifies how the actual number of occurrences is to be established',
      },
      {
        item: 'dfdl:length',
        snippetString: dfdlPrefix + 'length="$1"$0',
        markdownString: 'length can be an expression that resolves to an unsigned integer, or a literal unsigned integer',
      },
      {
        item: 'dfdl:lengthKind',
        snippetString: dfdlPrefix + 'lengthKind="${1|delimited,fixed,explicit,implicit,prefixed,pattern,endOfParent|}"$0',
        markdownString: 'lengthKind can be delimited, fixed, explicit, implicit, prefixed,pattern, or endOfParent',
      },
      {
        item: 'dfdl:prefixIncludesPrefixLength',
        snippetString: dfdlPrefix + 'prefixIncludesPrefixLength="${1|yes,no|}"$0',
        markdownString: 'Specifies whether the length given by a prefix includes the length of the prefix as well as the length of the content region',
      },
      {
        item: 'dfdl:prefixLengthType',
        snippetString: dfdlPrefix + 'prefixLengthType="$1"$0',
        markdownString: 'Name of a simple type derived from xs:integer or any subtype of it.',
      },
      {
        item: 'dfdl:utf16Width',
        snippetString: dfdlPrefix + 'utf16Width="${1|fixed,variable|}"$0',
        markdownString: 'Specifies whether the encoding UTF-16 is treated as a fixed or variable width encoding',
      },
      {
        item: 'dfdl:encoding',
        snippetString: dfdlPrefix + 'encoding="${1|US-ASCII,ASCII,UTF-8,UTF-16,UTF-16BE,UTF-16LE,ISO-8859-1|}"$0',
        markdownString: 'This property can be computed by way of an expression which returns an appropriate string value',
      },
      {
        item: 'dfdl:encodingErrorPolicy',
        snippetString: dfdlPrefix + 'encodingErrorPolicy="${1|error,replace|}"$0',
        markdownString: 'This property provides control of how decoding and encoding errors are handled when converting the data to text, or text to data',
      },
      {
        item: 'dfdl:nilKind',
        snippetString: dfdlPrefix + 'nilKind="${1|literalCharacter,literalValue,logicalValue|}"$0',
        markdownString: 'Specifies how dfdl:<nilValue> is interpreted to represent the nil value in the data stream'
      },
      {
        item: 'dfdl:nilValue',
        snippetString: dfdlPrefix + 'nilValue="$1"$0',
        markdownString: 'Used to provide a logical value that is used to indicate the data is nilled'
      },
      {
        item: 'dfdl:nilValueDelimiterPolicy',
        snippetString: dfdlPrefix + 'nilValueDelimiterPolicy="${1|initiator,terminator,both,none|}"$0',
        markdownString: 'Controls whether matching one of the nil values also involves matching the initiator or terminator specified by the element',
      },
      {
        item: 'dfdl:alignment',
        snippetString: dfdlPrefix + 'alignment="${1|1,2,implicit|}"$0',
        markdownString: "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'.",
      },
      {
        item: 'dfdl:lengthUnits',
        snippetString: dfdlPrefix + 'lengthUnits="${1|bits,bytes,characters|}"$0',
        markdownString: 'lengthUnits can be specified as bits, bytes, or characters',
      },
      {
        item: 'dfdl:lengthPattern',
        snippetString: dfdlPrefix + 'lengthPattern="$1"$0',
        markdownString: 'lengthPattern takes a regular expression which is used to scan the data stream for matching data',
      },
      {
        item: 'dfdl:inputValueCalc',
        snippetString: dfdlPrefix + 'inputValueCalc="{$1}"$0',
        markdownString: 'An expression that calculates the value of the element when parsing',
      },
      {
        item: 'dfdl:outputValueCalc',
        snippetString: dfdlPrefix + 'outputValueCalc="{$1}"$0',
        markdownString: 'An expression that calculates the value of the current element when unparsing',
      },
      {
        item: 'dfdl:alignmentUnits',
        snippetString: dfdlPrefix + 'alignmentUnits="${1|bits,bytes|}"$0',
        markdownString: "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'.",
      },
      {
        item: 'dfdl:outputNewLine',
        snippetString: dfdlPrefix + 'outputNewLine="${1|%CR;,%LF;,%CR;%LF;,%NEL;,%LS;|}"$0',
        markdownString: 'Specifies the character or characters that are used to replace the %NL; character class entity during unparse',
      },
      {
        item: 'dfdl:choiceBranchKey',
        snippetString: dfdlPrefix + 'choiceBranchKey="$1"$0',
        markdownString: 'List of DFDL String Literals',
      },
      {
        item: 'dfdl:representation',
        snippetString: dfdlPrefix + 'representation="${1|binary,text|}"$0',
        markdownString: 'Identifies the physical representation of the element as text or binary',
      },
      {
        item: 'dfdl:textStringJustification',
        snippetString: dfdlPrefix + 'textStringJustification="${1|left,right,center|}"$0',
        markdownString: 'Specifies the string justification',
      },
      {
        item: 'dfdl:textStandardZeroRep',
        snippetString: dfdlPrefix + 'textStandardZeroRep="0"$0',
        markdownString: 'Specifies the whitespace separated list of alternative DFDL String Literals that are equivalent to zero ',
      },
      {
        item: 'dfdl:textStandardInfinityRep',
        snippetString: dfdlPrefix + 'textStandardInfinityRep="Inf"$0',
        markdownString: 'The value used to represent infinity.',
      },
      {
        item: 'dfdl:textStandardExponentRep',
        snippetString: dfdlPrefix + 'textStandardExponentRep="E"$0',
        markdownString: 'Defines the actual character(s) that appear in the data as the exponent indicator',
      },
      {
        item: 'dfdl:textStandardNaNRep',
        snippetString: dfdlPrefix + 'textStandardNaNRep="NaN"$0',
        markdownString: 'Specifies the value used to represent NaN ',
      },
      {
        item: 'dfdl:textNumberPattern',
        snippetString: dfdlPrefix + 'textNumberPattern="#,##0.###;-#,##0.###"$0',
        markdownString: 'Defines the ICU-like pattern that describes the format of the text number',
      },
      {
        item: 'dfdl:textNumberRep',
        snippetString: dfdlPrefix + 'textNumberRep="${1|standard,zoned|}"$0',
        markdownString: 'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding',
      },
      {
        item: 'dfdl:textNumberRoundingMode',
        snippetString: dfdlPrefix + 'textNumberRoundingMode="${1|roundCeiling,roundFloor,roundDown,roundUp,roundHalfEven,roundHalfDown,roundHalfUp,roundUnnecessary|}"$0',
        markdownString: 'Specifies how rounding occurs during unparsing',
      },
      {
        item: 'dfdl:textNumberRoundingIncrement',
        snippetString: dfdlPrefix + 'textNumberRoundingIncrement="0"$0',
        markdownString: 'Specifies the rounding increment to use during unparsing',
      },
      {
        item: 'dfdl:textNumberRounding',
        snippetString: dfdlPrefix + 'textNumberRounding="${1|explicit,pattern|}"$0',
        markdownString: 'Specifies how rounding is controlled during unparsing',
      },
      {
        item: 'dfdl:textNumberCheckPolicy',
        snippetString: dfdlPrefix + 'textNumberCheckPolicy="${1|lax,strict|}"$0',
        markdownString: 'Indicates how lenient to be when parsing against the dfdl:textNumberPattern',
      },
      {
        item: 'dfdl:textOutputMinLength',
        snippetString: dfdlPrefix + 'textOutputMinLength="0"$0',
        markdownString: 'Specifies the minimum content length during unparsing for simple types that do not allow the XSD minLength facet to be specified',
      },
      {
        item: 'dfdl:textStandardGroupingSeparator',
        snippetString: 'ddl:textStandardGroupingSeparator=","$0',
        markdownString: 'Specifies the single character that can appear in the data as the grouping separator',
      },
      {
        item: 'dfdl:textPadKind',
        snippetString: dfdlPrefix + 'textPadKind="${1|none,padChar|}"$0',
        markdownString: 'Indicates whether to pad the data value on unparsing',
      },
      {
        item: 'dfdl:textStandardBase',
        snippetString: dfdlPrefix + 'textStandardBase="${1|2,8,10,16|}"$0',
        markdownString: 'Indicates the number base',
      },
      {
        item: 'dfdl:textTrimKind',
        snippetString: dfdlPrefix + 'textTrimKind="${1|none,padChar|}"$0',
        markdownString: 'Indicates whether to trim data on parsing',
      },
      {
        item: 'dfdl:leadingSkip',
        snippetString: dfdlPrefix + 'trailingSkip="0$1"$0',
        markdownString: 'A non-negative number of bytes or bits to skip before alignment is applied',
      },
      {
        item: 'dfdl:trailingSkip',
        snippetString: dfdlPrefix + 'trailingSkip="0$1"$0',
        markdownString: 'A non-negative number of bytes or bits to skip after the element,',
      },
      {
        item: 'dfdl:truncateSpecifiedLengthString',
        snippetString: dfdlPrefix + 'truncateSpecifiedLengthString="${1|no,yes|}"$0',
        markdownString: 'This property provides the means to express an error, or the strings can be truncated to fit when the strings in an Infoset being unparsed do not fit within those specified lengths',
      },
      {
        item: 'dfdl:sequenceKind',
        snippetString: dfdlPrefix + 'SequenceKind ="${1|ordered,unordered|}"$0',
        markdownString: 'Defines whether the items are expected in the same order that they appear in the schema or in any order',
      },
      {
        item: 'dfdl:separator',
        snippetString: dfdlPrefix + 'separator="$1"$0',
        markdownString: 'Specifies a whitespace separated list of alternative DFDL String Literals that are the possible separators for the sequence',
      },
      {
        item: 'dfdl:separatorPosition',
        snippetString: dfdlPrefix + 'separatorPosition="${1|infix,postfix,prefix|}"$0',
        markdownString: 'specifies where the separator occurs between the elements',
      },
      {
        item: 'dfdl:separatorSuppressionPolicy',
        snippetString: dfdlPrefix + 'separatorSuppressionPolicy="${1|anyEmpty,never,trailingEmpty,trailingEmptyStrict|}"$0',
        markdownString: 'Controls the circumstances when separators are expected in the data when parsing, or generated when unparsing',
      },
      {
        item: 'dfdl:terminator',
        snippetString: dfdlPrefix + 'terminator="$1"$0',
        markdownString: 'charater or bytes found in the input stream that designate termination of an element',
      },
      {
        item: 'dfdl:textBidi',
        snippetString: dfdlPrefix + 'textBidi="${1|no,yes|}"$0',
        markdownString: 'This property exists in anticipation of future DFDL features that enable bidirectional text processing',
      },
      {
        item: 'dfdl:hiddenGroupRef',
        snippetString: '<' + nsPrefix + 'dfdl:hiddenGroupRef="$1"\n$0',
        markdownString: 'Reference to a global model group definition',
      },
      {
        item: 'dfdl:choiceLengthKind',
        snippetString: dfdlPrefix + 'choiceLengthKind="${1|explicit,implicit|}"$0',
        markdownString: 'Determines whether the branches of the choice are always filled (explicit) to the fixed-length specified by dfdl:choiceLength or not filled (implicit)',
      },
      {
        item: 'dfdl:choiceLength',
        snippetString: dfdlPrefix + 'choiceLength="$1"$0',
        markdownString: 'Specifies the length of the choice in bytes, only used when dfdl:choiceLengthKind is explicit',
      },
      {
        item: 'dfdl:fillByte',
        snippetString: dfdlPrefix + 'fillByte="$1"$0',
        markdownString: 'A single byte specified as a DFDL byte value entity or a single character, used on unparsing to fill empty space',
      },
      {
        item: 'dfdl:ignoreCase',
        snippetString: dfdlPrefix + 'ignoreCase="${1|no,yes|}"$0',
        markdownString: 'Whether mixed case data is accepted when matching delimiters and data values on input',
      },
       {
        item: 'dfdl:initiatedContent',
        snippetString: dfdlPrefix + 'initiatedContent="${1|yes,no|}"$0',
        markdownString: 'yes indicates all branches of a choice are initiated\nno indicates the branch dfdl:initator property may be ste to empty string',
      },
      {
        item: 'dfdl:initiator',
        snippetString: dfdlPrefix + 'initiator="$1"$0',
        markdownString: 'Specifies an ordered whitespace separated list of alternative DFDL String Literals one of which marks the beginning of the element or group of elements ',
      },
      {
        item: 'dfdl:choiceDispatchKey',
        snippetString: dfdlPrefix + 'choiceDispatchKey="$1"$0',
        markdownString: 'The expression must evaluate to a string, the string must match one of the dfdl:choiceBranchKey property values of one of the branches of the choice',
      },
      {
        item: 'dfdl:binaryNumberRep',
        snippetString: dfdlPrefix + 'binaryNumberRep="${1|binary,packed,bcd,ibm4690Packed|}"$0',
        markdownString: 'binary,packed,bcd, or ibm4690Packed',
      },
      {
        item: 'dfdl:floating',
        snippetString: dfdlPrefix + 'floating="${1|no,yes|}"$0',
        markdownString: 'yes or no',
      },
       {
        item: 'dfdl:binaryFloatRep',
        snippetString: dfdlPrefix + 'binaryFloatRep="${1|ieee,ibm390Hex|}"$0',
        markdownString: 'ieee or ibm390Hex',
      },
      {
        item: 'dfdl:calendarPatternKind',
        snippetString: dfdlPrefix + 'calendarPatternKind="${1|explicit,implicit|}"$0',
        markdownString: 'The pattern is given by dfdl:calendarPattern explicit or the pattern is derived from the XML schema date/time type (implicit)',
      },
      {
        item: "dfdl:documentFinalTerminatorCanBeMissing",
        snippetString: dfdlPrefix + 'documentFinalTerminatorCanBeMissing="${1|yes,no|}"$0',
        markdownString: 'Specifies whether the final line can be missing',
      },
      {
        item:'dfdl:emptyValueDelimiterPolicy',
        snippetString: dfdlPrefix + 'emptyValueDelimiterPolicy="${1|initiator,terminator,both,none|}"$0',
        markdownString: 'Indicates which of initiator, terminator, both, or neither must be present when an element in the data stream is empty.',
      },
      {
        item: 'dfdl:escapeSchemeRef',
        snippetString: dfdlPrefix + 'escapeSchemeRef="$1"$0',
        markdownString: "Refers to a named escape scheme definition via its qualified name",
      },
      {
        item: 'testKind',
        snippetString: 'testKind="${1|expression,pattern|}"$0',
        markdownString: 'Specifies whether a DFDL expression or DFDL regular expression pattern is used in the dfdl:assert',
      },
      {
        item: 'test',
        snippetString: dfdlPrefix + 'test="{$1}"$0',
        markdownString: 'A DFDL expression that evaluates to true or false.',
      },
      {
        item: 'testPattern',
        snippetString: 'testPattern="$1"$0',
        markdownString: 'A DFDL regular expression that is applied against the data stream',
      },
      {
        item: 'message',
        snippetString: 'message="$1"$0',
        markdownString: 'Defines text for use in an error message',
      },
      {
        item: 'failureType',
        snippetString: 'failureType="${1|processingError,recoverableError|}"$0',
        markdownString: 'Specifies the type of failure that occurs when the dfdl:assert is unsuccessful',
      },
    ],
  }
}
