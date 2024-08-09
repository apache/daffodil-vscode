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
import { insertSnippet } from '../utils'

export const noChoiceAttributes = [
  'name',
  'ref',
  'occursCount',
  'length',
  'prefixLengthType',
  'nilValue',
  'lengthPattern',
  'inputValueCalc',
  'outputValueCalc',
  'hiddenGroupRef',
  'choiceBranchKey',
  'textOutputMinLength',
  'textStandardDecimalSeparator',
  'textStandardGroupingSeparator',
  'textZonedSignStyle',
  'textNumberRoundingIncrement',
  'textBooleanTrueRep',
  'textBooleanFalseRep',
  'textBooleanJustification',
  'textBooleanPadCharacter',
  'separator',
  'terminator',
  'choiceLength',
  'fillByte',
  'initiator',
  'choiceDispatchKey',
  'binaryDecimalVirtualPoint',
  'binaryPackedSignCodes',
  'binaryBooleantrueRep',
  'binaryBooleanFalseRep',
  'calendarPattern',
  'calendarTimeZone',
  'calendarCenturyStart',
  'calendarLanguage',
  'escapeSchemeRef',
  'escapeCharacter',
  'escapeBlockStart',
  'escapeBlockEnd',
  'escapeEscapeCharacter',
  'extraEscapedCharacters',
  'test',
  'testPattern',
  'message',
]

export function attributeValues(
  attributeName: string,
  startPos: vscode.Position,
  additionalTypes: string
) {
  switch (attributeName) {
    case 'minOccurs':
      insertSnippet('"${1|0,1|}"$0', startPos)
      break
    case 'maxOccurs':
      insertSnippet('"${1|0,1,unbounded|}"$0', startPos)
      break
    case 'occursCount':
      insertSnippet('"$1"$0', startPos)
      break
    case 'byteOrder':
      insertSnippet('"${1|bigEndian,littleEndian|}"$0', startPos)
      break
    case 'bitOrder':
      insertSnippet(
        '"${1|mostSignificantBitFirst,leastSignificantBitFirst|}"$0',
        startPos
      )
      break
    case 'occursCountKind':
      insertSnippet(
        '"${1|expression,fixed,implicit,parsed,stopValue|}"$0',
        startPos
      )
      break
    case 'length':
      insertSnippet('"$1"$0', startPos)
      break
    case 'lengthKind':
      insertSnippet(
        '"${1|delimited,fixed,explicit,implicit,prefixed,patternendOfParent|}"$0',
        startPos
      )
      break
    case 'prefixIncludesPrefixLength':
      insertSnippet('"${1|yes,no|}"$0', startPos)
      break
    case 'prefixLengthType':
      insertSnippet('"$1"$0', startPos)
      break
    case 'utf16Width':
      insertSnippet('"${1|fixed,variable|}"$0', startPos)
      break
    case 'encoding':
      insertSnippet(
        '"${1|US-ASCII,ASCII,UTF-8,UTF-16,UTF-16BE,UTF-16LE,ISO-8859-1|}"$0',
        startPos
      )
      break
    case 'encodingErrorPolicy':
      insertSnippet('"${1|error,replace|}"$0', startPos)
      break
    case 'nilKind':
      insertSnippet(
        '"${1|literalCharacter,literalValue,logicalValue|}"$0',
        startPos
      )
      break
    case 'nilValue':
      insertSnippet('nilValue="$1"$0', startPos)
      break
    case 'nilValueDelimiterPolicy':
      insertSnippet('"${1|initiator,terminator,both,none|}"$0', startPos)
      break
    case 'useNilForDefault':
      insertSnippet('"${1|yes,no|}"$0', startPos)
      break
    case 'alignment':
      insertSnippet('"${1|1,2,implicit|}"$0', startPos)
      break
    case 'lengthUnits':
      insertSnippet('"${1|bits,bytes,characters|}"$0', startPos)
      break
    case 'lengthPattern':
      insertSnippet('"$1"$0', startPos)
      break
    case 'inputValueCalc':
      insertSnippet('"{$1}"$0', startPos)
      break
    case 'outputValueCalc':
      insertSnippet('"{$1}"$0', startPos)
      break
    case 'alignmentUnits':
      insertSnippet('"${1|bits,bytes|}"$0', startPos)
      break
    case 'outputNewLine':
      insertSnippet('"${1|%CR;,%LF;,%CR;%LF;,%NEL;,%LS;|}"$0', startPos)
      break
    case 'choiceBranchKey':
      insertSnippet('"$1"$0', startPos)
      break
    case 'representation':
      insertSnippet('"${1|binary,text|}"$0', startPos)
      break
    case 'textStringJustification':
      insertSnippet('"${1|left,right,center|}"$0', startPos)
      break
    case 'textStandardZeroRep':
      insertSnippet('"0$1"$0', startPos)
      break
    case 'textStandardInfinityRep':
      insertSnippet('"Inf$1"$0', startPos)
      break
    case 'textStandardExponentRep':
      insertSnippet('"E$1"$0', startPos)
      break
    case 'textStandardNaNRep':
      insertSnippet('"NaN$1"$0', startPos)
      break
    case 'textNumberPattern':
      insertSnippet('"#,##0.###;-#,##0.###$1"$0', startPos)
      break
    case 'textNumberRep':
      insertSnippet('"${1|standard,zoned|}"$0', startPos)
      break
    case 'textNumberRoundingMode':
      insertSnippet(
        '"${1|roundCeiling,roundFloor,roundDown,roundUp,roundHalfEven,roundHalfDown,roundHalfUp,roundUnnecessary|}"$0',
        startPos
      )
      break
    case 'textNumberRoundingIncrement':
      insertSnippet('"0"$0', startPos)
      break
    case 'textNumberRounding':
      insertSnippet('"${1|explicit,pattern|}"$0', startPos)
      break
    case 'textNumberCheckPolicy':
      insertSnippet('"${1|lax,strict|}"$0', startPos)
      break
    case 'textOutputMinLength':
      insertSnippet('"0"$0', startPos)
      break
    case 'textStandardDecimalSeparator':
      insertSnippet('"$1"$0', startPos)
      break
    case 'textStandardGroupingSeparator':
      insertSnippet('",$1"$0', startPos)
      break
    case 'textPadKind':
      insertSnippet('"${1|none,padChar|}"$0', startPos)
      break
    case 'textStandardBase':
      insertSnippet('"${1|2,8,10,16|}"$0', startPos)
      break
    case 'textZonedSignStyle':
      insertSnippet('"$1"$0', startPos)
      break
    case 'textTrimKind':
      insertSnippet('"${1|none,padChar|}"$0', startPos)
      break
    case 'textBooleanTrueRep':
      insertSnippet('"$1"$0', startPos)
      break
    case 'textBooleanFalseRep':
      insertSnippet('"$1"$0', startPos)
      break
    case 'textBooleanJustification':
      insertSnippet('"${1|left,right,center|}"$0', startPos)
      break
    case 'textBooleanPadCharacter':
      insertSnippet('"$1"$0', startPos)
      break
    case 'leadingSkip':
      insertSnippet('"0$1"$0', startPos)
      break
    case 'trailingSkip':
      insertSnippet('"0$1"$0', startPos)
      break
    case 'truncateSpecifiedLengthString':
      insertSnippet('"${1|no,yes|}"$0', startPos)
      break
    case 'sequenceKind':
      insertSnippet('"${1|ordered,unordered|}"$0', startPos)
      break
    case 'separator':
      insertSnippet('"$1"$0', startPos)
      break
    case 'separatorPosition':
      insertSnippet('"${1|infix,postfix,prefix|}"$0', startPos)
      break
    case 'separatorSuppressionPolicy':
      insertSnippet(
        '"${1|anyEmpty,never,trailingEmpty,trailingEmptyStrict|}"$0',
        startPos
      )
      break
    case 'terminator':
      insertSnippet('"$1"$0', startPos)
      break
    case 'textBidi':
      insertSnippet('"${1|no,yes|}"$0', startPos)
      break
    case 'hiddenGroupRef':
      insertSnippet('"$1"\n$0', startPos)
      break
    case 'choiceLengthKind':
      insertSnippet('"${1|explicit,implicit|}"$0', startPos)
      break
    case 'choiceLength':
      insertSnippet('"$1"$0', startPos)
      break
    case 'fillByte':
      insertSnippet('"$1"$0', startPos)
      break
    case 'ignoreCase':
      insertSnippet('"${1|no,yes|}"$0', startPos)
      break
    case 'initiatedContent':
      insertSnippet('"${1|yes,no|}"$0', startPos)
      break
    case 'initiator':
      insertSnippet('"$1"$0', startPos)
      break
    case 'choiceDispatchKey':
      insertSnippet('"$1"$0', startPos)
      break
    case 'binaryNumberRep':
      insertSnippet('"${1|binary,packed,bcd,ibm4690Packed|}"$0', startPos)
      break
    case 'floating':
      insertSnippet('"${1|no,yes|}"$0', startPos)
      break
    case 'binaryFloatRep':
      insertSnippet('"${1|ieee,ibm390Hex|}"$0', startPos)
      break
    case 'binaryDecimalVirtualPoint':
      insertSnippet('"$1"$0', startPos)
      break
    case 'binaryPackedSignCodes':
      insertSnippet('"$1"$0', startPos)
      break
    case 'binaryNumberCheckPolicy':
      insertSnippet('"${1|strict,lax|}"$0', startPos)
      break
    case 'dfdl:binaryBooleanTrueRep':
      insertSnippet('"$1"$0', startPos)
      break
    case 'dfdl:binaryBooleanFalseRep':
      insertSnippet('"$1"$0', startPos)
      break
    case 'calendarPattern':
      insertSnippet('"$1"$0', startPos)
      break
    case 'calendarPatternKind':
      insertSnippet('"${1|explicit,implicit|}"$0', startPos)
      break
    case 'dfdl:calendarCheckPolicy':
      insertSnippet('"${1|strict,lax|}"$0', startPos)
      break
    case 'dfdl:calendarTimeZone':
      insertSnippet('"$1"$0', startPos)
      break
    case 'dfdl:calendarObserveDST':
      insertSnippet('"${1|yes,no|}"$0', startPos)
      break
    case 'dfdl:calendarFirstDayOfWeek':
      insertSnippet('"${1|Monday,Sunday|}"$0', startPos)
      break
    case 'dfdl:calendarDaysInFirstWeek':
      insertSnippet('"${1|1,2,3,4,5,6,7|}"$0', startPos)
      break
    case 'dfdl:calendarCenturyStart':
      insertSnippet('"$1"$0', startPos)
      break
    case 'dfdl:calendarLanguage':
      insertSnippet('"$1"$0', startPos)
      break
    case 'documentFinalTerminatorCanBeMissing':
      insertSnippet('"${1|yes,no|}"$0', startPos)
      break
    case 'emptyValueDelimiterPolicy':
      insertSnippet('"${1|initiator,terminator,both,none|}"$0', startPos)
      break
    case 'emptyElementParsePolicy':
      insertSnippet('"${1|treatAsAbsent,treatAsEmpty|}"$0', startPos)
      break
    case 'escapeSchemeRef':
      insertSnippet('"$1"$0', startPos)
      break
    case 'escapeKind':
      insertSnippet('"${1|escapeCharacter,escapeBlock|}"$0', startPos)
      break
    case ':escapeCharacter':
      insertSnippet('"$1"$0', startPos)
      break
    case 'escapeBlockStart':
      insertSnippet('"$1"$0', startPos)
      break
    case 'escapeBlockEnd':
      insertSnippet('"$1"$0', startPos)
      break
    case 'escapeEscapeCharacter':
      insertSnippet('"$1"$0', startPos)
      break
    case 'extraEscapedCharacters':
      insertSnippet('"$1"$0', startPos)
      break
    case 'generateEscapeBlock':
      insertSnippet('"${1|always,whenNeeded|}"$0', startPos)
      break
    case 'escapeCharacterPolicy':
      insertSnippet('"${1|all,delimiters|}"$0', startPos)
      break
    case 'testKind':
      insertSnippet('"${1|expression,pattern|}"$0', startPos)
      break
    case 'test':
      insertSnippet('"{$1}"$0', startPos)
      break
    case 'testPattern':
      insertSnippet('"$1"$0', startPos)
      break
    case 'message':
      insertSnippet('"$1"$0', startPos)
      break
    case 'failureType':
      insertSnippet('"${1|processingError,recoverableError|}"$0', startPos)
      break
    case 'type':
      insertSnippet(
        '"${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean' +
          additionalTypes +
          '|}"$0',
        startPos
      )
      break
  }
}
