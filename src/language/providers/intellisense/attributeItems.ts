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
export const attributeCompletion = (additionalItems, nsPrefix: string) => {
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
        markdownString: 'minimum number of times element will occur',
      },
      {
        item: 'maxOccurs',
        snippetString: 'maxOccurs="${1|0,1,unbounded|}"$0',
        markdownString: 'maximum number of times element will occur',
      },
      {
        item: 'dfdl:occursCount',
        snippetString: 'dfdl:occursCount="$1"$0',
        markdownString: 'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression, to obtain the count from another element.',
      },
      {
        item: 'dfdl:byteOrder',
        snippetString: 'dfdl:byteOrder="${1|bigEndian,littleEndian|}"$0',
        markdownString: 'bigEndian or littleEndian',
      },
      {
        item: 'dfdl:bitOrder',
        snippetString: 'dfdl:bitOrder=${1|"mostSignificantBitFirst","leastSignificantBitFirst"|}$0',
        markdownString: 'mostSignificantBitFirst or leastSignificantBitFirst',
      },
      {
        item: 'dfdl:occursCountKind',
        snippetString: 'dfdl:occursCountKind="${1|expression,fixed,implicit,parsed,stopValue|}"$0',
        markdownString: 'occursCountKind can be expression, fixed, implicit, parsed, stopValue',
      },
      {
        item: 'dfdl:length',
        snippetString: 'dfdl:length="$1"$0',
        markdownString: 'length can be an expression that resolves to an unsigned integer, or a literal unsigned integer',
      },
      {
        item: 'dfdl:lengthKind',
        snippetString: 'dfdl:lengthKind="${1|delimited,fixed,explicit,implicit,prefixed,pattern,endOfParent|}"$0',
        markdownString: 'lengthKind can be delimited, fixed, explicit, implicit, prefixed,pattern, or endOfParent',
      },
      {
        item: 'dfdl:utf16Width',
        snippetString: 'dfdl:utf16Width=${1|"fixed","variable"|}$0',
        markdownString: 'fixed or variable',
      },
      {
        item: 'dfdl:encoding',
        snippetString: 'dfdl:encoding="${1|US-ASCII,ASCII,UTF-8,UTF-16,UTF-16BE,UTF-16LE,ISO-8859-1|}"$0',
        markdownString: 'encoding can be US-ASCII, ASCII, UTF-8, UTF-16, UTF-16BE UTF-16LE, or ISO-8859-1',
      },
      {
        item: 'dfdl:encodingErrorPolicy',
        snippetString: 'dfdl:encodingErrorPolicy=${1|"error","replace"|}$0',
        markdownString: 'error or replace',
      },
      {
        item: 'dfdl:nilKind',
        snippetString: 'dfdl:nilKind=${1|"literalCharacter","literalValue","logicalValue"|}$0',
        markdownString: 'literalCharacter,literalValue,or logicalValue'
      },
      {
        item: 'dfdl:nilValueDelimiterPolicy',
        snippetString: 'dfdl:nilValueDelimiterPolicy=${1|"initiator","terminator","both","none"|}$0',
        markdownString: 'initiator,terminator,both,or none',
      },
      {
        item: 'dfdl:alignment',
        snippetString: 'dfdl:alignment="${1|1,2,implicit|}"$0',
        markdownString: "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'.",
      },
      {
        item: 'dfdl:lengthUnits',
        snippetString: 'dfdl:lengthUnits="${1|bits,bytes,characters|}"$0',
        markdownString: 'lengthUnits can be specified as bits, bytes, or characters',
      },
      {
        item: 'dfdl:lengthPattern',
        snippetString: 'dfdl:lengthPattern="$1"$0',
        markdownString: 'lengthPattern takes a regular expression which is used to scan the data stream for matching data',
      },
      {
        item: 'dfdl:inputValueCalc',
        snippetString: 'dfdl:inputValueCalc="{$1}"$0',
        markdownString: 'An expression that calculates the value of the element when parsing',
      },
      {
        item: 'dfdl:outputValueCalc',
        snippetString: 'dfdl:outputValueCalc="{$1}"$0',
        markdownString: 'An expression that calculates the value of the current element when unparsing',
      },
      {
        item: 'dfdl:alignmentUnits',
        snippetString: 'dfdl:alignmentUnits="${1|bits,bytes|}"$0',
        markdownString: "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'.",
      },
      {
        item: 'dfdl:outputNewLine',
        snippetString: 'dfdl:outputNewLine="${1|%CR,%LF,%CR%LF,%NEL,%LS|}"$0',
        markdownString: 'Specifies the character or characters that are used to replace the %NL; character class entity during unparse',
      },
      {
        item: 'dfdl:choiceBranchKey',
        snippetString: 'dfdl:choiceBranchKey="$1"$0',
        markdownString: 'List of DFDL String Literals',
      },
      {
        item: 'dfdl:representation',
        snippetString: 'dfdl:representation="${1|binary,text|}"$0',
        markdownString: 'binary or text',
      },
      {
        item: 'dfdl:hiddenGroupRef',
        snippetString: 'dfdl:hiddenGroupRef="$1"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textStandardZeroRep',
        snippetString: 'dfdl:textStandardZeroRep="0"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textStandardInfinityRep',
        snippetString: 'dfdl:textStandardInfinityRep="Inf"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textStandardExponentRep',
        snippetString: 'dfdl:textStandardExponentRep="E"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textStandardNaNRep',
        snippetString: 'dfdl:textStandardNaNRep="NaN"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textNumberPattern',
        snippetString: 'dfdl:textNumberPattern="#,##0.###;-#,##0.###"$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textNumberRep',
        snippetString: 'dfdl:textNumberRep=${1|"standard","zoned"|}$0',
        markdownString: 'Specifies ',
      },
      {
        item: 'dfdl:textNumberRoundingMode',
        snippetString: 'dfdl:textNumberRoundingMode=${1|"roundCeiling","roundFloor","roundDown","roundUp","roundHalfEven","roundHalfDown","roundHalfUp","roundUnnecessary"|}$0',
        markdownString: 'roundCeiling,roundFloor,roundDown,roundUp,/nroundHalfEven,roundHalfDown,roundHalfUp, or roundUnnecessary',
      },
      {
        item: 'dfdl:textNumberRoundingIncrement',
        snippetString: 'dfdl:textNumberRoundingIncrement="0$"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:textNumberRounding',
        snippetString: 'dfdl:textNumberRounding=${1|"explicit","pattern"|}$0',
        markdownString: 'explicit or pattern',
      },
      {
        item: 'dfdl:textNumberCheckPolicy',
        snippetString: 'dfdl:textNumberCheckPolicy=${1|"lax","strict"|}$0',
        markdownString: 'lax, strict',
      },
      {
        item: 'dfdl:textOutputMinLength',
        snippetString: 'dfdl:textOutputMinLength="0"$0',
        markdownString: 'Specif ',
      },
      {
        item: 'dfdl:textStandardGroupingSeparator',
        snippetString: 'ddl:textStandardGroupingSeparator=","$0',
        markdownString: 'Speicify',
      },
      {
        item: 'dfdl:textPadKind',
        snippetString: 'dfdl:textPadKind=${1|"none","padChar"|}$0',
        markdownString: 'none or padChar',
      },
      {
        item: 'dfdl:textStandardBase',
        snippetString: 'dfdl:textStandardBase="10"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:textTrimKind',
        snippetString: 'dfdl:textTrimKind=${1|"none","padChar"|}$0',
        markdownString: 'none or padChar',
      },
      {
        item: 'dfdl:trailingSkip',
        snippetString: 'dfdl:trailingSkip="0"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:truncateSpecifiedLengthString',
        snippetString: 'dfdl:truncateSpecifiedLengthString=${1|"no","yes"|}$0',
        markdownString: 'yes or no',
      },
      {
        item: 'dfdl:sequenceKind',
        snippetString: 'dfdl:SequenceKind ="${1|ordered,unordered|}"$0',
        markdownString: 'order or unordered',
      },
      {
        item: 'dfdl:separator',
        snippetString: 'dfdl:separator="$1"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:separatorPosition',
        snippetString: 'dfdl:separatorPosition="${1|infix,postfix.prefix|}$0',
        markdownString: '',
      },
      {
        item: 'dfdl:separatorSuppressionPolicy',
        snippetString: 'dfdl:separatorSuppressionPolicy="${1|anyEmpty,never,trailingEmpty,trailingEmptyStrict|}"$0',
        markdownString: 'anyEmpty,never,trailingEmpty, or trailingEmptyStrict',
      },
      {
        item: 'dfdl:terminator',
        snippetString: 'dfdl:terminator="$1"$0',
        markdownString: 'charater or bytes found in the input stream that designate termination of an element',
      },
      {
        item: 'dfdl:textBidi',
        snippetString: 'dfdl:textBidi=${36|"no","yes"|}$0',
        markdownString: 'yes or no',
      },
      {
        item: 'dfdl:choiceLengthKind',
        snippetString: 'dfdl:choiceLengthKind="${1|explicit,Implicit|}"$0',
        markdownString: 'Valid values are implicit and explicit',
      },
      {
        item: 'dfdl:choiceLength',
        snippetString: 'dfdl:choiceLength="$1"$0',
        markdownString: 'Only used when dfdl:choiceLengthKind is explicit',
      },
      {
        item: 'dfdl:fillByte',
        snippetString: 'dfdl:fillByte="$1"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:ignoreCase',
        snippetString: 'dfdl:ignoreCase=${1|"no","yes"|}$0',
        markdownString: 'specify ',
      },
       {
        item: 'dfdl:initiatedContent',
        snippetString: 'dfdl:initiatedContent="${1|yes,no}"$0',
        markdownString: 'yes indicates all branches of a choice are initiated\no indicates the branch dfdl:initator property may be ste to empty string',
      },
      {
        item: 'dfdl:initiator',
        snippetString: 'dfdl:initiator="$1"$0',
        markdownString: 'specify ',
      },
      {
        item: 'dfdl:choiceDispatchKey',
        snippetString: 'dfdl:choiceDispatchKey="$1"$0',
        markdownString: 'The expression must evaluate to a string',
      },
      {
        item: 'dfdl:simpleType',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\trepresentation="${1|binary,|"\n\t</' + nsPrefix + 'appinfo>\n</' + nsPrefix + 'annotation>$0',
        markdownString: 'Creates a simpleType definition',
      },
      {
        item: 'dfdl:binaryNumberRep',
        snippetString: 'dfdl:binaryNumberRep=${1|"binary","packed","bcd","ibm4690Packed"|}$0',
        markdownString: 'binary,packed,bcd, oribm4690Packed',
      },
      {
        item: 'dfdl:floating',
        snippetString: 'dfdl:floating=${1|"no","yes"|}$0',
        markdownString: 'yes or no',
      },
       {
        item: 'dfdl:binaryFloatingRep',
        snippetString: 'dfdl:binaryFloatRep=${1|"ieee","ibm390Hex"|}$0',
        markdownString: 'ieee or ibm390Hex',
      },
      {
        item: 'dfdl:calendarPatternKind',
        snippetString: 'dfdl:calendarPatternKind=${1|"explicit","implicit"|}$0',
        markdownString: 'explicit or implicit',
      },
      {
        item: "dfdl:documentFinalTerminatorCanBeMissing",
        snippetString: 'dfdl:documentFinalTerminatorCanBeMissing=${1|"yes","no"|}$0',
        markdownString: 'yes or no',
      },
      {
        item:'dfdl:emptyValueDelimiterPolicy',
        snippetString: 'dfdl:emptyValueDelimiterPolicy=${1|"initiator","terminator","both","none"|}$0',
        markdownString: 'initiator,terminator,both, or none',
      },
      {
        item: nsPrefix + 'restriction',
        // use the "xs:" prefix for primitive types to differentiate them from custom simple types
        snippetString: '<' + nsPrefix + 'restriction base="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean|}"/>$0',
        markdownString: 'specify ',
      },
    ],
  }
}
