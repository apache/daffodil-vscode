/*
 * Licensed to the Apache Software Foundation (ASF under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License Version 2.0
 * (the "License"; you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function attributeHoverValues(attributeName: string): string {
  switch (attributeName) {
    case 'name':
      return 'specify name'
    case 'ref':
      return 'Specifies the name of an element in this schema'
    case 'minOccurs':
      return 'Minimum number of times element will occur'
    case 'maxOccurs':
      return 'Maximum number of times element will occur'
    case 'dfdl:occursCount':
      return 'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression to obtain the count from another element.'
    case 'dfdl:byteOrder':
      return 'This property applies to all Number Calendar (date and time and Boolean types with representation binary'
    case 'dfdl:bitOrder':
      return 'Determines the specific bits of any grammar region'
    case 'dfdl:occursCountKind':
      return 'Specifies how the actual number of occurrences is to be established'
    case 'dfdl:length':
      return 'length can be an expression that resolves to an unsigned integer or a literal unsigned integer'
    case 'dfdl:lengthKind':
      return 'lengthKind can be delimited fixed explicit implicit prefixedpattern or endOfParent'
    case 'dfdl:prefixIncludesPrefixLength':
      return 'Specifies whether the length given by a prefix includes the length of the prefix as well as the length of the content region'
    case 'dfdl:prefixLengthType':
      return 'Name of a simple type derived from xs:integer or any subtype of it.'
    case 'dfdl:utf16Width':
      return 'Specifies whether the encoding UTF-16 is treated as a fixed or variable width encoding'
    case 'dfdl:encoding':
      return 'This property can be computed by way of an expression which returns an appropriate string value'
    case 'dfdl:encodingErrorPolicy':
      return 'This property provides control of how decoding and encoding errors are handled when converting the data to text or text to data'
    case 'dfdl:nilKind':
      return 'Specifies how dfdl:<nilValue> is interpreted to represent the nil value in the data stream'
    case 'dfdl:nilValue':
      return 'Used to provide a logical value that is used to indicate the data is nilled'
    case 'dfdl:nilValueDelimiterPolicy':
      return 'Controls whether matching one of the nil values also involves matching the initiator or terminator specified by the element'
    case 'dfdl:useNilForDefault':
      return 'Controls whether to set the Infoset item [nilled] boolean member or to use the XSD default or fixed properties to obtain a data value'
    case 'dfdl:alignment':
      return "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'."
    case 'dfdl:lengthUnits':
      return 'lengthUnits can be specified as bits bytes or characters'
    case 'dfdl:lengthPattern':
      return 'lengthPattern takes a regular expression which is used to scan the data stream for matching data'
    case 'dfdl:inputValueCalc':
      return 'An expression that calculates the value of the element when parsing'
    case 'dfdl:outputValueCalc':
      return 'An expression that calculates the value of the current element when unparsing'
    case 'dfdl:alignmentUnits':
      return "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'."
    case 'dfdl:outputNewLine':
      return 'Specifies the character or characters that are used to replace the %NL; character class entity during unparse'
    case 'dfdl:choiceBranchKey':
      return 'List of DFDL String Literals'
    case 'dfdl:representation':
      return 'Identifies the physical representation of the element as text or binary'
    case 'dfdl:textStringJustification':
      return 'Specifies the string justification'
    case 'dfdl:textStringPadCharacter':
      return 'Specifies the string justification'
    case 'dfdl:textStandardZeroRep':
      return 'Specifies the whitespace separated list of alternative DFDL String Literals that are equivalent to zero '
    case 'dfdl:textStandardInfinityRep':
      return 'The value used to represent infinity.'
    case 'dfdl:textStandardExponentRep':
      return 'Defines the actual character(s that appear in the data as the exponent indicator'
    case 'dfdl:textStandardNaNRep':
      return 'Specifies the value used to represent NaN'
    case 'dfdl:textNumberPattern':
      return 'Indicates whether an xs:decimal element is signed'
    case 'dfdl:decimalSigned':
      return 'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding'
    case 'dfdl:textNumberRep':
      return 'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding'
    case 'dfdl:textNumberJustification':
      return 'Controls how the data is padded or trimmed on parsing and unparsing'
    case 'dfdl:textNumberRoundingMode':
      return 'Specifies how rounding occurs during unparsing'
    case 'dfdl:textNumberRoundingIncrement':
      return 'Specifies the rounding increment to use during unparsing'
    case 'dfdl:textNumberRounding':
      return 'Specifies how rounding is controlled during unparsing'
    case 'dfdl:textNumberCheckPolicy':
      return 'Indicates how lenient to be when parsing against the dfdl:textNumberPattern'
    case 'dfdl:textOutputMinLength':
      return 'Specifies the minimum content length during unparsing for simple types that do not allow the XSD minLength facet to be specified'
    case 'dfdl:textStandardDecimalSeparator':
      return 'Defines a whitespace separated list of single characters that appear (individually in the data as the decimal separator'
    case 'dfdl:textStandardGroupingSeparator':
      return 'Specifies the single character that can appear in the data as the grouping separator'
    case 'dfdl:textPadKind':
      return 'Indicates whether to pad the data value on unparsing'
    case 'dfdl:textStandardBase':
      return 'Indicates the number base'
    case 'dfdl:textZonedSignStyle':
      return 'Specifies the code points that are used to modify the sign nibble of the byte containing the sign'
    case 'dfdl:textTrimKind':
      return 'Indicates whether to trim data on parsing'
    case 'dfdl:textBooleanTrueRep':
      return 'A whitespace separated list of representations to be used for true'
    case 'dfdl:textBooleanFalseRep':
      return 'A whitespace separated list of representations to be used for false'
    case 'dfdl:textBooleanJustification':
      return 'Controls how the data is padded or trimmed on parsing and unparsing'
    case 'dfdl:textBooleanPadCharacter':
      return 'The value that is used when padding or trimming boolean elements'
    case 'dfdl:leadingSkip':
      return 'A non-negative number of bytes or bits to skip before alignment is applied'
    case 'dfdl:trailingSkip':
      return 'A non-negative number of bytes or bits to skip after the element'
    case 'dfdl:truncateSpecifiedLengthString':
      return 'This property provides the means to express an error or the strings can be truncated to fit when the strings in an Infoset being unparsed do not fit within those specified lengths'
    case 'dfdl:sequenceKind':
      return 'Defines whether the items are expected in the same order that they appear in the schema or in any order'
    case 'dfdl:separator':
      return 'Specifies a whitespace separated list of alternative DFDL String Literals that are the possible separators for the sequence'
    case 'dfdl:separatorPosition':
      return 'specifies where the separator occurs between the elements'
    case 'dfdl:separatorSuppressionPolicy':
      return 'Controls the circumstances when separators are expected in the data when parsing or generated when unparsing'
    case 'dfdl:terminator':
      return 'charater or bytes found in the input stream that designate termination of an element'
    case 'dfdl:textBidi':
      return 'This property exists in anticipation of future DFDL features that enable bidirectional text processing'
    case 'dfdl:hiddenGroupRef':
      return 'Reference to a global model group definition'
    case 'dfdl:choiceLengthKind':
      return 'Determines whether the branches of the choice are always filled (explicit to the fixed-length specified by dfdl:choiceLength or not filled (implicit'
    case 'dfdl:choiceLength':
      return 'Specifies the length of the choice in bytes only used when dfdl:choiceLengthKind is explicit'
    case 'dfdl:fillByte':
      return 'A single byte specified as a DFDL byte value entity or a single character used on unparsing to fill empty space'
    case 'dfdl:ignoreCase':
      return 'Whether mixed case data is accepted when matching delimiters and data values on input'
    case 'dfdl:initiatedContent':
      return 'yes indicates all branches of a choice are initiated\nno indicates the branch dfdl:initator property may be ste to empty string'
    case 'dfdl:initiator':
      return 'Specifies an ordered whitespace separated list of alternative DFDL String Literals one of which marks the beginning of the element or group of elements '
    case 'dfdl:choiceDispatchKey':
      return 'The expression must evaluate to a string the string must match one of the dfdl:choiceBranchKey property values of one of the branches of the choice'
    case 'dfdl:binaryNumberRep':
      return 'binarypackedbcd or ibm4690Packed'
    case 'dfdl:floating':
      return 'yes or no'
    case 'dfdl:binaryFloatRep':
      return 'ieee or ibm390Hex'
    case 'dfdl:binaryDecimalVirtualPoint':
      return 'An integer that represents the position of an implied decimal point within a number'
    case 'dfdl:binaryPackedSignCodes':
      return 'A whitespace separated string giving the hex sign nibbles to use for a positive value a negative value an unsigned value and zero'
    case 'dfdl:binaryNumberCheckPolicy':
      return 'Indicates how lenient to be when parsing binary numbers'
    case 'dfdl:binaryBooleanTrueRep':
      return 'A binary xs:unsignedInt gives the representation for true'
    case 'dfdl:binaryBooleanFalseRep':
      return 'A binary xs:unsignedInt gives the representation for false'
    case 'dfdl:calendarPattern':
      return 'Defines the ICU pattern that describes the format of the calendar. The pattern defines where the year month day hour minute second fractional second and time zone components appear'
    case 'dfdl:calendarPatternKind':
      return 'The pattern is given by dfdl:calendarPattern explicit or the pattern is derived from the XML schema date/time type (implicit'
    case 'dfdl:calendarCheckPolicy':
      return 'Indicates how lenient to be when parsing against the pattern'
    case 'dfdl:calendarTimeZone':
      return 'Provides the time zone that is assumed if no time zone explicitly occurs in the data'
    case 'dfdl:calendarObserveDST':
      return 'Whether the time zone given in dfdl:calendarTimeZone observes daylight savings time'
    case 'dfdl:calendarFirstDayOfWeek':
      return 'The day of the week upon which a new week is considered to start'
    case 'dfdl:calendarDaysInFirstWeek':
      return 'Specify the number of days of the new year that must fall within the first week'
    case 'dfdl:calendarCenturyStart':
      return 'specifies the two digits that start a 100-year window that contains the current year'
    case 'dfdl:calendarLanguage':
      return 'The language that is used when the pattern produces a presentation in text'
    case 'dfdl:documentFinalTerminatorCanBeMissing':
      return 'Specifies whether the final line can be missing'
    case 'dfdl:emptyValueDelimiterPolicy':
      return 'Indicates which of initiator terminator both or neither must be present when an element in the data stream is empty.'
    case 'dfdl:emptyElementParsePolicy':
      return 'Indicates which of initiator terminator both or neither must be present when an element in the data stream is empty.'
    case 'dfdl:escapeSchemeRef':
      return 'Refers to a named escape scheme definition via its qualified name'
    case 'dfdl:escapeKind':
      return 'The type of escape mechanism defined in the escape scheme'
    case 'dfdl:escapeCharacter':
      return 'Specifies one character that escapes the subsequent character'
    case 'dfdl:escapeBlockStart':
      return 'The string of characters that denotes the beginning of a sequence of characters escaped by a pair of escape strings'
    case 'dfdl:escapeBlockEnd':
      return 'The string of characters that denotes the end of a sequence of characters escaped by a pair of escape strings'
    case 'dfdl:escapeEscapeCharacter':
      return 'Specifies one character that escapes an immediately following dfdl:escapeCharacter'
    case 'dfdl:extraEscapedCharacters':
      return 'A whitespace separated list of single characters that must be escaped in addition to the in-scope delimiters'
    case 'dfdl:generateEscapeBlock':
      return 'The type of escape mechanism defined in the escape scheme'
    case 'dfdl:escapeCharacterPolicy':
      return 'The type of escape mechanism defined in the escape scheme'
    case 'testKind':
      return 'Specifies whether a DFDL expression or DFDL regular expression pattern is used in the dfdl:assert'
    case 'test':
      return 'A DFDL expression that evaluates to true or false.'
    case 'testPattern':
      return 'A DFDL regular expression that is applied against the data stream'
    case 'message':
      return 'Defines text for use in an error message'
    case 'failureType':
      return 'Specifies the type of failure that occurs when the dfdl:assert is unsuccessful'
    case 'schemaLocation':
      return 'Specifies the location of the schema'
    default:
      return 'No definition available'
  }
}
