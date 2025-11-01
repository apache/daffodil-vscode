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
 * List of attribute names that should NOT show completion choices.
 * These are typically free-form text attributes where showing predefined
 * options would not be helpful, such as:
 * - Names and references (name, ref, namespace)
 * - Expressions and patterns (inputValueCalc, outputValueCalc, test, testPattern)
 * - Numeric values (length, occursCount, textOutputMinLength)
 * - Custom strings (separator, terminator, initiator, nilValue)
 * - Type names (prefixLengthType)
 * - Escape characters and patterns
 */
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
  'source',
  'schemaLocation',
  'targetNamespace',
  'namespace',
]
