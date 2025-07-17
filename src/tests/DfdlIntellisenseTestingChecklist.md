<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# The following tests use the file: src/tests/data/testDfdlMixedLineFormats.dfdl.xsd

Place the cursor at line 29 column 44, after alignmentUnits="bytes" press the backspace key until alignmentUnits="bytes" is erased. Type CTRL+space. Select dfdl:alignmentUnits from the dropdown and bytes from the value dropdown.

- [ ] Verify that alignmentUnits="bytes" is inserted.
- [ ] Verify that alignmentUnits does not have the dfdl: prefix.

Place the cursor on line 46, column 28 at the end of the line <xs:group
name = "test" >. Type a space.

- [ ] Verify drop down contains xs:annotation and xs:sequence.

Place the cursor at the same position as above. Type CTRL+space

- [ ] Verify drop down contains xs:annotation and xs:sequence.

Place the cursor at line 48, column 18 at the end of the line
<xs:sequence>. Type a space or CTRL+space.

- [ ] Verify dropdown contains xs:annotation, xs:choice, xs:element
      name, xs:element ref, and xs:sequence.

Place cursor at line 56, column 39 at the end of the line xs:element
name="Keyword". Type a space.

- [ ] Verify dropdown contains dfdl:alignment, dfdl:alignmentUnits,
      dfdl:binaryBooleanFalseRep, dfdl:binaryBooleanTrueRep,
      dfdl:binaryNumberRep, dfdl:bitOrder, dfdl:byteOrder,
      dfdl:choiceBranchKey, dfdl:encoding, dfdl:inputValueCalc, dfdl:length,
      dfdl:lengthKind, dfdl:lengthPattern, dfdl:lengthUnits, dfdl:occursCount,
      dfdl:occursCountKind, dfdl:outputNewLine dfdl:outputValueCalc,
      dfdl:prefxIncludesPrefixLength, dfdl:prefixLengthType,
      dfdl:representation, dfdl:terminator, maxOccurs, minOccurs, name, ref,
      and type.
      Note: This isn't a comprehensive list of attributes, just the most commonly used attributes.

- [ ] Verify dropdown appears with above listed elements, and the first
      line in dropdown is highlighted with a description of the highlighted
      item beside it.

- [ ] Verify a dropdown appears with the above listed elements and
      pressing the down arrow key displays the description of each highlighted
      element.

Place the cursor at line 57 and hover over the attribute dfdl:alignment.

- [ ] Verify a text box appears with a definition for dfdl:alignment.

Place the cursor at line 57 column 47, within the double quotes with the value 1 for dfdl:alignment.
Type CTRL+space.

- [ ] Verify the dropdown contains 1, 2, and implicit.

Place the cursor at line 57 column 65, after dfdl:length="10". Type CTRL+space. Select dfdl:byteOrder from the dropdown and bigEndian for the value.

- [ ] Verify that dfdl:byteOrder="bigEndian" is inserted and appropriately spaced.
- [ ] Verify that the dfdl: prefix was inserted with byteOrder.

Place cursor at line 67, column 26, after </xs:element>. Type a space.

- [ ] Verify the dropdown contains xs:annotation, xs:choice, xs:element
      name, xs:element ref, and xs:sequence.

Place the cursor at line 68, column 42 after <xs:element
name="Datastream". Type a space.

- [ ] Verify the dropdown contains dfdl:alignment, dfdl:alignmentUnits,
      dfdl:binaryBooleanFalseRep, dfdl:binaryBooleanTrueRep,
      dfdl:binaryNumberRep, dfdl:bitOrder, dfdl:byteOrder,
      dfdl:choiceBranchKey, dfdl:encoding, dfdl:inputValueCalc, dfdl:length,
      dfdl:lengthKind, dfdl:lengthPattern, dfdl:lengthUnits, dfdl:occursCount,
      dfdl:occursCountKind, dfdl:outputNewLine dfdl:outputValueCalc,
      dfdl:prefxIncludesPrefixLength, dfdl:prefixLengthType,
      dfdl:representation, dfdl:terminator, maxOccurs, minOccurs, name, ref,
      and type.
      Note: This isn't a comprehensive list of attributes, just the most commonly used attributes.

Place the cursor at line 68 column 98, within the double quotes containing the value binary for dfdl:representation. Type CTRL+space.

- [ ] Verify the dropdown contains binary an text. Select "text" as the value.
- [ ] verify that "binary" is replaced with "text".

Place the cursor at line 68 column 252 at the end of the line. Backspace over the last 2 characters "/>". The cursor shoul;d be directly after dfdl:length="{../../Length - fn:string-length(../Keyword) - 2}". Type a / (slash '/').

- [ ] Verify that the self closing tag "/> was added to the end of the line.

Place cursor at line 69, column 25, before </xs:sequence>. Type CTRL+space.

- [ ] Verify the dropdown contains xs:choice, xs:group name, dfdl:group ref, and xs:sequence.

Place a cursor at line 71 column 20, after </xs:element>. Backspace until the closing element tag is erased. Type > (the greater than symbol).

- [ ] Verify the </xs:element> tag is replaced.

Place the cursor at line 73 column 129, before <xs:annotation>. Type CTRL+space.

- [ ] Verify the dropdown contains xs:annotation, xs:complexType, xs:complexType name=,xs:simpleType, and xs:simpleType name=.

Place the cursor at line 73 column 263, after </xs:annotation>. Backspace to remove the annoation closing tag. With your cursor just after the </xs:appinfo> tag, type > (the greater than symbol).

- [ ] Verify the closing tag for annotation is re-created in the proper place.

DO NOT save any changes to the test file.

# The following test use the file: src/test/data/helloWorldPlusLongForm.dfdl.xsd

Place the cursor at line 29 column 32, backspace over the two slashes ('/'). Type 2 slashes.
See issue # 1083 "Intellisense issue when the "/" character is typed" for context.

- [ ] Verify that typing the slashes does not erase any of the data in quotes

Place the cursor at line 31 column 39, after ref="GeneralFormat". Type a space.

- [ ] Verify the dropdown contains a long list of dfdl attributes including:
      dfdl:alignment, dfdl:alignmentUnits,
      dfdl:binaryBooleanFalseRep, dfdl:binaryBooleanTrueRep,
      dfdl:binaryNumberRep, dfdl:bitOrder, dfdl:byteOrder,
      dfdl:choiceBranchKey, dfdl:encoding, dfdl:inputValueCalc, dfdl:length,
      dfdl:lengthKind, dfdl:lengthPattern, dfdl:lengthUnits, dfdl:occursCount,
      dfdl:occursCountKind, dfdl:outputNewLine dfdl:outputValueCalc,
      dfdl:prefxIncludesPrefixLength, dfdl:prefixLengthType,
      dfdl:representation, dfdl:terminator, maxOccurs, minOccurs, name, ref,
      and type.
      Note: This isn't a comprehensive list of attributes, just the most commonly used attributes.

Select alignment from the dropdown. select 1 as the value for alignment.

- [ ] Verify that alignment="1" is inserted.
- [ ] Verfiy that alignment does not have the dfdl: prefix.

Place the cursor at line 33 column 1. Type CTRL+space.

- [ ] Verify the dropdown contains dfdl:defineEscapeScheme, dfdl:defineFormat, ,and dfdl:format.

Place the cursor at line 52 column 56 at the end of the line. Backspace over the last two characters "/>". The cursor should be directly after encoding="ascii". Type a / (slash '/').

- [ ] Verify the self closing tag characters "/>" appear at the end of the line.

Place the cursor at line 59, column 46, after representation="text". Type a space.

- [ ] Verify the dropdown contains dfdl:alignment, dfdl:alignmentUnits,
      dfdl:binaryBooleanFalseRep, dfdl:binaryBooleanTrueRep,
      dfdl:binaryNumberRep, dfdl:bitOrder, dfdl:byteOrder,
      dfdl:choiceBranchKey, dfdl:encoding, dfdl:inputValueCalc, dfdl:length,
      dfdl:lengthKind, dfdl:lengthPattern, dfdl:lengthUnits, dfdl:occursCount,
      dfdl:occursCountKind, dfdl:outputNewLine dfdl:outputValueCalc,
      dfdl:prefxIncludesPrefixLength, dfdl:prefixLengthType,
      dfdl:representation, dfdl:terminator, maxOccurs, minOccurs, name, ref,
      and type.
      Note: This isn't a comprehensive list of attributes, just the most commonly used attributes.

Select dfdl:alignment from the dropdown. select 1 as the value.

- [ ] Verify that alignment="1" was inserted.
- [ ] Verify that alignment does not contian the dfdl: prefix.

Place the cursor at line 68 column 59, after >. Type CTRL+space. -[ ] Verify the dropdown contains dfdl:assert, dfdl:discriminator, dfdl:element, dfdl:property, and dfdl:setVariable.

DO NOT save any changes to the test file.
