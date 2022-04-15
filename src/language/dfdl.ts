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

export function activate(context: vscode.ExtensionContext) {
  const elementCompletionProvider =
    vscode.languages.registerCompletionItemProvider('dfdl', {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        const wholeLine = document
          .lineAt(position)
          .text.substr(0, position.character)
        if (checkBraceOpen(document, position)) {
          console.log('in elementCompletionProvider - brace is showing open')
          return undefined
        }
        if (wholeLine.includes('Variable')) {
          return undefined
        }

        var definedVariables = getDefinedVariables(document)
        // a simple completion item which inserts `Hello World!`
        //const simpleCompletion = new vscode.CompletionItem('Hello World!');

        // a completion item that inserts its text as snippet,
        // the `insertText`-property is a `SnippetString` which will be
        // honored by the editor.
        const xmlVersion = new vscode.CompletionItem('xml version')
        xmlVersion.insertText = new vscode.SnippetString(
          '<?xml version="1.0" encoding="UTF-8"?>\n$0'
        )

        const xsSchema = new vscode.CompletionItem('xs:schema')
        xsSchema.insertText = new vscode.SnippetString(
          '<xs:schema xmlns:xs="http://www.w3.org2001/xmlSchema"\n\t\txmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"\n\t\txmlns:daf="urn:ogf:dfdl:2013:imp:daffodil.apache.org:2018:ext"\n\t\txmlns:fn="http:/www.w3.org/2005/xpath-functions"\n\t\txmlns:math="www.w3.org/2005/xpath-functions/math" elementFormDefault="qualified">\n$0\n</xs:schema>'
        )

        const xsElement = new vscode.CompletionItem('xs:element name')
        xsElement.insertText = new vscode.SnippetString(
          '<xs:element name="$1"$0'
        )
        //xsElement.insertText = new vscode.SnippetString('<xs:element name="$1"$0>\n\n</xs:element>');
        xsElement.documentation = new vscode.MarkdownString('A new dfdl item')

        const xsElementRef = new vscode.CompletionItem('xs:element ref')
        xsElementRef.insertText = new vscode.SnippetString(
          '<xs:element ref="$1"$0'
        )
        //xsElementRef.insertText = new vscode.SnippetString('<xs:element ref="$1"$0>\n\n</xs:element>');
        xsElementRef.documentation = new vscode.MarkdownString(
          'A new dfdl reference to an item'
        )

        const xsGroup = new vscode.CompletionItem('xs:group name')
        xsGroup.insertText = new vscode.SnippetString(
          '<xs:group name = "$1">\n\t$0\n</xs:group>'
        )
        //xsGroup.documentation = new vscode.MarkdownString('');

        const xsGroupRef = new vscode.CompletionItem('xs:group ref')
        xsGroupRef.insertText = new vscode.SnippetString('<xs:group ref="$1"$0')
        //xsGroupRef.insertText = new vscode.SnippetString('<xs:group ref="$1"$0>\n\n</xs:element>');
        xsGroupRef.documentation = new vscode.MarkdownString(
          'A new dfdl reference to an item'
        )

        const dfdlAssert = new vscode.CompletionItem('dfdl:assert')
        dfdlAssert.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:assert>"<$1>"</dfdl:assert>\n\t</xs:appinfo>\n</xs:annotation>$0'
        )
        dfdlAssert.documentation = new vscode.MarkdownString(
          'dfdl assertion test'
        )

        const dfdlDiscriminator = new vscode.CompletionItem(
          'dfdL:discriminator'
        )
        dfdlDiscriminator.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:discriminator test="{$1}"/>\n\t</xs:appinfo>\n</xs:annotation>$0'
        )
        dfdlDiscriminator.documentation = new vscode.MarkdownString(
          'dfdl discriminator test'
        )

        const dfdlHiddenGroupRef = new vscode.CompletionItem(
          'dfdl:hiddenGroupRef'
        )
        dfdlHiddenGroupRef.insertText = new vscode.SnippetString(
          '<xs:sequence dfdl:hiddenGroupRef="$1"/>\n$0'
        )
        //dfdlHiddenGroupRef.documentation = new vscode.MarkdownString('Hidden group reference');

        const defaultDfdlFormat = new vscode.CompletionItem('dfdl:format')
        defaultDfdlFormat.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:format alignmentUnits=${1|"bits","bytes"|}\n\t\t\tlengthUnits=${2|"bits","bytes","characters"|}\n\t\t\trepresentation=${3|"binary","text"|}\n\t\t\tbinaryNumberRep=${4|"binary","packed","bcd","ibm4690Packed"|}\n\t\t\tbyteOrder=${5|"bigEndian","littleEndian"|}\n\t\t\tbitOrder=${6|"mostSignificantBitFirst","leastSignificantBitFirst"|}\n\t\t\tlengthKind=${7|"explicit","delimited","implicit","prefixed","pattern","endOfParent"|}\n\t\t\talignment=${8|"1","implicit"|}\n\t\t\tencodingErrorPolicy=${9|"error","replace"|}\n\t\t\tbinaryFloatRep=${10|"ieee","ibm390Hex"|}\n\t\t\tcalendarPatternKind=${11|"explicit","implicit"|}\n\t\t\tdocumentFinalTerminatorCanBeMissing=${12|"yes","no"|}\n\t\t\temptyValueDelimiterPolicy=${13|"initiator","terminator","both","none"|}\n\t\t\tescapeSchemeRef="$14"\n\t\t\tfillByte="$15"\n\t\t\tfloating=${16|"no","yes"|}\n\t\t\tignoreCase=${17|"no","yes"|}\n\t\t\tinitiatedContent=${18|"no","yes"|}\n\t\t\tinitiator="$19"\n\t\t\tleadingSkip="$20"\n\t\t\tseparator="$21"\n\t\t\tseparatorSuppressionPolicy=${22|"anyEmpty","never","trailingEmpty","trailingEmptyStrict"|}\n\t\t\toutputNewLine=${23|"%CR;","%LF;","%NEL;","%LS;","%CR;%LF;"|}\n\t\t\ttextStandardZeroRep="0$24"\n\t\t\ttextStandardInfinityRep="Inf$25"\n\t\t\ttextStandardExponentRep="E$26"\n\t\t\ttextStandardNaNRep="NaN$27"\n\t\t\ttextNumberPattern="#,##0.###;-#,##0.###$28"\n\t\t\ttextNumberRounding=${29|"explicit","pattern"|}\n\t\t\ttextNumberRoundingMode=${30|"roundCeiling","roundFloor","roundDown","roundUp","roundHalfEven","roundHalfDown","roundHalfUp","roundUnnecessary"|}\n\t\t\ttextNumberRoundingIncrement="0$31"\n\t\t\ttextStandardGroupingSeparator=",$32"\n\t\t\tseparatorPosition=${33|"infix","postFix","prefix"|}\n\t\t\tsequenceKind=${34|"ordered","unordered"|}\n\t\t\tterminator="$35"\n\t\t\ttextBidi=${36|"no","yes"|}"\n\t\t\ttextNumberCheckPolicy=${37|"lax","strict"|}\n\t\t\ttextNumberRep=${38|"standard","zoned"|}\n\t\t\ttextOutputMinLength="0$39"\n\t\t\ttextPadKind=${40|"none","padChar"|}\n\t\t\ttextStandardBase="10$41"\n\t\t\ttextTrimKind=${42|"none","padChar"|}\n\t\t\ttrailingSkip="0$43"\n\t\t\ttruncateSpecifiedLengthString=${44|"no","yes"|}\n\t\t\tutf16Width=${45|"fixed","variable"|}\n\t\t\tencoding=${46|"US-ASCII","ASCII","UTF-8","UTF-16","UTF-16BE","UTF-16LE","ISO-8859-1"|}\n\t\t\tnilKind=${47|"literalCharacter","literalValue","logicalValue"|}\n\t\t\tnilValueDelimiterPolicy=${48|"initiator","terminator","both","none"|}\n\t\t\toccursCountKind=${49|"expression","fixed","implicit","parsed","stopValue"|}\n\t\t\tchoiceLengthKind=${50|"explicit","implicit"|}/>\n\t</xs:appinfo>\n</xs:annotation>\n$0'
        )

        //annotationBlock.command = { command: 'editor.action.triggerSuggest', title: 'trigger annotation completion' };
        //appinfoBlock.command = { command: 'editor.action.triggerSuggest', title: 'trigger appinfo completion' };
        const annotationBlock = new vscode.CompletionItem('xs:annotation')
        //annotationBlock.kind = vscode.CompletionItemKind.Keyword;
        annotationBlock.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</xs:appinfo>\n</xs:annotation>'
        )
        const appinfoBlock = new vscode.CompletionItem('xs:appinfo')
        //appinfoBlock.kind = vscode.CompletionItemKind.Keyword;
        appinfoBlock.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</xs:appinfo>\n</xs:annotation>'
        )

        const xsComplexType = new vscode.CompletionItem('xs:complexType')
        //xsComplexType.insertText = new vscode.SnippetString('<xs:complexType>\n$0');
        xsComplexType.insertText = new vscode.SnippetString(
          '<xs:complexType>\n\t$0\n</xs:complexType>'
        )
        xsComplexType.documentation = new vscode.MarkdownString(
          'Starts a complex type definition'
        )

        const xsComplexTypeName = new vscode.CompletionItem(
          'xs:complexType name='
        )
        xsComplexTypeName.insertText = new vscode.SnippetString(
          '<xs:complexType Name="$1">\n\t$0\n</xs:complexType>'
        )
        xsComplexTypeName.documentation = new vscode.MarkdownString(
          'Starts a complex type definition'
        )

        const xsSimpleType = new vscode.CompletionItem('xs:simpleType')
        xsSimpleType.insertText = new vscode.SnippetString(
          '<xs:simpleType>\n\t$0\n</xs:simpleType>'
        )
        xsSimpleType.documentation = new vscode.MarkdownString(
          'Starts a complex type definition'
        )

        const xsSimpleTypeName = new vscode.CompletionItem(
          'xs:simpleType name='
        )
        xsSimpleTypeName.insertText = new vscode.SnippetString(
          '<xs:simpleType Name="$1"$0'
        )
        xsSimpleTypeName.documentation = new vscode.MarkdownString(
          'Starts a complex type definition'
        )

        const xsSequence = new vscode.CompletionItem('xs:sequence')
        //xsSequence.insertText = new vscode.SnippetString('<xs:sequence>\n$0');
        xsSequence.insertText = new vscode.SnippetString('<xs:sequence')
        //xsSequence.documentation = new vscode.MarkdownString("");

        const xsChoice = new vscode.CompletionItem('xs:choice')
        xsChoice.insertText = new vscode.SnippetString(
          '<xs:choice$1>\n\t$0\n</xs:choice>'
        )
        //xsChoice.documentation = new vscode.MarkdownString("");

        const dfdlDefineVariable = new vscode.CompletionItem(
          'dfdl:defineVariable'
        )
        dfdlDefineVariable.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:defineVariable name="$1"$0'
        )
        //dfdlDefineVariable.documentation = new vscode.MarkdownString("");

        const dfdlSetVariable = new vscode.CompletionItem('dfdl:setVariable')
        dfdlSetVariable.insertText = new vscode.SnippetString(
          '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:setVariable ref="${1|' +
            definedVariables +
            '|}"$0'
        )

        // return all completion items as array
        return [
          xmlVersion,
          xsSchema,
          xsElement,
          xsElementRef,
          xsGroup,
          xsGroupRef,
          dfdlAssert,
          dfdlDiscriminator,
          dfdlHiddenGroupRef,
          defaultDfdlFormat,
          annotationBlock,
          appinfoBlock,
          xsComplexType,
          xsComplexTypeName,
          xsSimpleType,
          xsSimpleTypeName,
          xsSequence,
          xsChoice,
          dfdlDefineVariable,
          dfdlSetVariable,
        ]
      },
    })

  const attributeCompletionProvider =
    vscode.languages.registerCompletionItemProvider(
      { language: 'dfdl' },
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          const wholeLine = document
            .lineAt(position)
            .text.substr(0, position.character)
          var nearestOpenItem = nearestOpen(document, position)
          //console.log("in attributeCOmpletionProvider");
          if (
            !checkBraceOpen(document, position) &&
            !wholeLine.includes('assert') &&
            !nearestOpenItem.includes('none')
          ) {
            if (nearestOpenItem.includes('element')) {
              var preVal = ''
              if (!wholeLine.includes('xs:element')) {
                if (lineCount(document, position) === 1) {
                  preVal = '\t'
                } else {
                  preVal = ''
                }
              }
              var additionalItems = getDefinedTypes(document)
              const dfdlDefineFormat = new vscode.CompletionItem(
                'dfdl:defineFormat'
              )
              dfdlDefineFormat.insertText = new vscode.SnippetString(
                preVal +
                  '<dfdl:defineFormat name="$1" >\n\t$2\n</dfdl:defineFormat>\n$0'
              )
              dfdlDefineFormat.documentation = new vscode.MarkdownString(
                'dfdl format name and configuration'
              )

              const dfdlDefineEscape = new vscode.CompletionItem(
                'dfdl:defineEscapeScheme'
              )
              dfdlDefineEscape.insertText = new vscode.SnippetString(
                preVal +
                  '<dfdl:defineEscapeScheme name=$1 >\n\t$0,/dfdl:defineEscapeScheme>\n'
              )
              dfdlDefineEscape.documentation = new vscode.MarkdownString(
                'dfdl escape character definition'
              )

              const xmlType = new vscode.CompletionItem('type=')
              xmlType.insertText = new vscode.SnippetString(
                preVal +
                  'type="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean' +
                  additionalItems +
                  '|}"$0'
              )
              xmlType.documentation = new vscode.MarkdownString(
                'attribute to specify a simple type element type'
              )

              const minOccurs = new vscode.CompletionItem('minOccurs=')
              minOccurs.insertText = new vscode.SnippetString(
                preVal + 'minOccurs="${1|0,1|}"$0'
              )
              minOccurs.documentation = new vscode.MarkdownString(
                'mininum number of times element will occur'
              )

              const maxOccurs = new vscode.CompletionItem('maxOccurs=')
              maxOccurs.insertText = new vscode.SnippetString(
                preVal + 'maxOccurs="${1|0,1,unbounded|}"$0'
              )
              maxOccurs.documentation = new vscode.MarkdownString(
                'maximum number of times element will occur'
              )

              const dfdlOccursCount = new vscode.CompletionItem(
                'dfdl:occursCount='
              )
              dfdlOccursCount.insertText = new vscode.SnippetString(
                preVal + 'dfdl:occursCount="$1"$0'
              )
              dfdlOccursCount.documentation = new vscode.MarkdownString(
                'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression, to obtain the count from another element.'
              )

              const dfdlByteOrder = new vscode.CompletionItem('dfdl:byteOrder=')
              dfdlByteOrder.insertText = new vscode.SnippetString(
                preVal + 'byteOrder="${1|bigEndian,littleEndian|}"$0'
              )
              dfdlByteOrder.documentation = new vscode.MarkdownString('')

              const dfdlOccursCountKind = new vscode.CompletionItem(
                'dfdl:occursCountKind='
              )
              dfdlOccursCountKind.insertText = new vscode.SnippetString(
                preVal +
                  'dfdl:occursCountKind="${1|expression,fixed,implicit,parsed,stopValue|}"$0'
              )
              dfdlOccursCountKind.documentation = new vscode.MarkdownString(
                'occursCountKind can be expression, fixed, implicit, parsed, stopValue'
              )

              const dfdlLength = new vscode.CompletionItem('dfdl:length=')
              dfdlLength.insertText = new vscode.SnippetString(
                preVal + 'dfdl:length="$1"$0'
              )
              dfdlLength.documentation = new vscode.MarkdownString(
                'length can be an expression that resolves to an unsigned integer, or a literal unsigned integer'
              )

              const dfdlLengthKind = new vscode.CompletionItem(
                'dfdl:lengthKind='
              )
              dfdlLengthKind.insertText = new vscode.SnippetString(
                preVal +
                  'dfdl:lengthKind="${1|delimited,fixed,explicit,implicit,prefixed,pattern,endOfParent|}"$0'
              )
              dfdlLengthKind.documentation = new vscode.MarkdownString(
                'lengthKind can be delimited, fixed, explicit, implicit, prefixed,pattern, or endOfParent'
              )

              const dfdlLengthUnits = new vscode.CompletionItem(
                'dfdl:lengthUnits='
              )
              dfdlLengthUnits.insertText = new vscode.SnippetString(
                preVal + 'dfdl:lengthUnits="${1|bits,bytes,characters|}"$0'
              )
              dfdlLengthUnits.documentation = new vscode.MarkdownString(
                'lengthUnits can be specified as bits, bytes, or characters'
              )

              const dfdlLengthPattern = new vscode.CompletionItem(
                'dfdl:lengthPattern='
              )
              dfdlLengthPattern.insertText = new vscode.SnippetString(
                preVal + 'dfdl:lengthPattern="$1"$0'
              )
              dfdlLengthPattern.documentation = new vscode.MarkdownString(
                'lengthPattern takes a regular expression which is used to scan the data stream for matching data'
              )

              const xmlEncoding = new vscode.CompletionItem('dfdl:encoding=')
              xmlEncoding.insertText = new vscode.SnippetString(
                preVal +
                  'dfdl:encoding="${1|US-ASCII,ASCII,UTF-8,UTF-16,UTF-16BE,UTF-16LE,ISO-8859-1|}"$0'
              )
              xmlEncoding.documentation = new vscode.MarkdownString(
                'encoding can be US-ASCII, ASCII, UTF-8, UTF-16, UTF-16BE UTF-16LE, or ISO-8859-1'
              )

              const dfdlInputValueCalc = new vscode.CompletionItem(
                'dfdl:inputValueCalc='
              )
              dfdlInputValueCalc.insertText = new vscode.SnippetString(
                preVal + 'dfdl:inputValueCalc="{$1}"$0'
              )
              dfdlInputValueCalc.documentation = new vscode.MarkdownString(
                'An expression that calculates the value of the element when parsing'
              )

              const dfdlOutputValueCalc = new vscode.CompletionItem(
                'dfdl:outputValueCalc='
              )
              dfdlOutputValueCalc.insertText = new vscode.SnippetString(
                preVal + 'dfdl:outputValueCalc="{$1}"$0'
              )
              dfdlOutputValueCalc.documentation = new vscode.MarkdownString(
                'An expression that calculates the value of the current element when unparsing'
              )

              const dfdlAlignment = new vscode.CompletionItem('dfdl:alignment=')
              dfdlAlignment.insertText = new vscode.SnippetString(
                preVal + 'dfdl:alignment="${1|1,2,implicit|}"$0'
              )
              dfdlAlignment.documentation = new vscode.MarkdownString(
                "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'."
              )

              const dfdlAlignmentUnits = new vscode.CompletionItem(
                'dfdl:alignmentUnits='
              )
              dfdlAlignmentUnits.insertText = new vscode.SnippetString(
                preVal + 'dfdl:alignmentUnits="${1|bits,bytes|}"$0'
              )
              dfdlAlignmentUnits.documentation = new vscode.MarkdownString(
                "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'."
              )

              const dfdlTerminator = new vscode.CompletionItem(
                'dfdl:terminator='
              )
              dfdlTerminator.insertText = new vscode.SnippetString(
                preVal + 'dfdl:terminator="$1"$0'
              )
              dfdlTerminator.documentation = new vscode.MarkdownString(
                'charater or bytes found in the input stream that designate termination of an element'
              )

              const dfdlOutputNewLine = new vscode.CompletionItem(
                'dfdl:outputNewLine='
              )
              dfdlOutputNewLine.insertText = new vscode.SnippetString(
                preVal + 'dfdl:outputNewLine="${1|%CR,%LF,%CR%LF,%NEL,%LS|}"$0'
              )
              dfdlOutputNewLine.documentation = new vscode.MarkdownString(
                'Specifies the character or characters that are used to replace the %NL; character class entity during unparse'
              )

              const dfdlChoiceBranchKey = new vscode.CompletionItem(
                'dfdl:choiceBranchKey='
              )
              dfdlChoiceBranchKey.insertText = new vscode.SnippetString(
                'dfdl:choiceBranchKey="$1"$0'
              )
              dfdlChoiceBranchKey.documentation = new vscode.MarkdownString(
                'List of DFDL String Literals'
              )

              const dfdlRepresentation = new vscode.CompletionItem(
                'dfdl:representation'
              )
              dfdlRepresentation.insertText = new vscode.SnippetString(
                'dfdl:representation="${1|binary,text|}"$0'
              )

              // console.log('In elementAttributeProvider just before if logic to return completion list');
              // console.log('wholeLine is: ' + wholeLine);
              if (
                checkLastItemOpen(document, position) &&
                (wholeLine.includes('<xs:element name="') ||
                  wholeLine.includes('<xs:element ref="') ||
                  checkElementOpen(document, position))
              ) {
                return [
                  dfdlDefineFormat,
                  dfdlDefineEscape,
                  xmlType,
                  minOccurs,
                  maxOccurs,
                  dfdlOccursCount,
                  dfdlOccursCountKind,
                  dfdlLength,
                  dfdlLengthKind,
                  dfdlLengthUnits,
                  dfdlLengthPattern,
                  dfdlByteOrder,
                  xmlEncoding,
                  dfdlInputValueCalc,
                  dfdlOutputValueCalc,
                  dfdlAlignment,
                  dfdlAlignmentUnits,
                  dfdlTerminator,
                  dfdlOutputNewLine,
                  dfdlChoiceBranchKey,
                ]
              }
            }
            if (nearestOpenItem.includes('sequence')) {
              var preVal = ''
              if (!wholeLine.includes('xs:sequence')) {
                if (lineCount(document, position) === 1) {
                  preVal = '\t'
                } else {
                  preVal = ''
                }
              }
              const dfdlHiddenGroupRef = new vscode.CompletionItem(
                'dfdl:hiddenGroupRef='
              )
              dfdlHiddenGroupRef.insertText = new vscode.SnippetString(
                preVal + 'dfdl:hiddenGroupRef="$1"$0'
              )
              dfdlHiddenGroupRef.documentation = new vscode.MarkdownString(
                'Specifies '
              )

              const dfdlSequenceKind = new vscode.CompletionItem(
                'dfdl:sequenceKind='
              )
              dfdlSequenceKind.insertText = new vscode.SnippetString(
                preVal + 'dfdl:SequenceKind ="${1|ordered,unordered|}"$0'
              )
              dfdlSequenceKind.documentation = new vscode.MarkdownString('')

              const dfdlSeparator = new vscode.CompletionItem('dfdl:separator=')
              dfdlSeparator.insertText = new vscode.SnippetString(
                preVal + 'dfdl:separator="$1"$0'
              )
              dfdlSeparator.documentation = new vscode.MarkdownString('')

              const dfdlSeparatorPosition = new vscode.CompletionItem(
                'dfdl:separatorPosition='
              )
              dfdlSeparatorPosition.insertText = new vscode.SnippetString(
                preVal + 'dfdl:separatorPosition="${1|infix,postfix.prefix|}$0'
              )
              dfdlSeparatorPosition.documentation = new vscode.MarkdownString(
                ''
              )

              const dfdlSeparatorSuprressionPolicy = new vscode.CompletionItem(
                'dfdl:separatorSuppressionPolicy'
              )
              dfdlSeparatorSuprressionPolicy.insertText =
                new vscode.SnippetString(
                  preVal +
                    'dfdl:separatorSuppressionPolicy="${1|anyEmpty,never,trailingEmptytrailingEmptyStrict|}"$0'
                )
              dfdlSeparatorSuprressionPolicy.documentation =
                new vscode.MarkdownString('')

              if (
                checkLastItemOpen(document, position) &&
                (wholeLine.includes('<xs:sequence') ||
                  checkSequenceOpen(document, position))
              ) {
                return [
                  dfdlHiddenGroupRef,
                  dfdlSequenceKind,
                  dfdlSeparator,
                  dfdlSeparatorPosition,
                  dfdlSeparatorSuprressionPolicy,
                ]
              }
            }
            if (wholeLine.includes('choice')) {
              var preVal = ''
              const dfdlChoiceLengthKind = new vscode.CompletionItem(
                'dfdl:choiceLengthKind='
              )
              dfdlChoiceLengthKind.insertText = new vscode.SnippetString(
                preVal + 'dfdl:choiceLengthKind="${1|explicit,Implicit|}"$0'
              )
              dfdlChoiceLengthKind.documentation = new vscode.MarkdownString(
                'Valid values are implicit and explicit'
              )

              const dfdlChoiceLength = new vscode.CompletionItem(
                'dfdl:choiceLength='
              )
              dfdlChoiceLength.insertText = new vscode.SnippetString(
                preVal + 'dfdl:choiceLength="$1"$0'
              )
              dfdlChoiceLength.documentation = new vscode.MarkdownString(
                'Only used when dfdl:choiceLengthKind is explicit'
              )

              const dfdlInitiatedContent = new vscode.CompletionItem(
                'dfdl:intiatedContent='
              )
              dfdlInitiatedContent.insertText = new vscode.SnippetString(
                preVal + 'dfdl:intiatedContent="${1|yes,no}"$0'
              )
              dfdlInitiatedContent.documentation = new vscode.MarkdownString(
                'yes indicates all branches of a choice are initiated\no indicates the branch dfdl:initator property may be ste to empty string'
              )

              const dfdlChoiceDispatchKey = new vscode.CompletionItem(
                'dfdl:choiceDispatchKey='
              )
              dfdlChoiceDispatchKey.insertText = new vscode.SnippetString(
                'dfdl:choiceBranchKey="$1"$0'
              )
              dfdlChoiceDispatchKey.documentation = new vscode.MarkdownString(
                'The expression must evaluate to a string'
              )

              const dfdlChoiceBranchKey = new vscode.CompletionItem(
                'dfdl:choiceBranchKey='
              )
              dfdlChoiceBranchKey.insertText = new vscode.SnippetString(
                'dfdl:choiceBranchKey="$1"$0'
              )
              dfdlChoiceBranchKey.documentation = new vscode.MarkdownString(
                'List of DFDL String Literals'
              )

              if (!wholeLine.includes('>')) {
                return [
                  dfdlChoiceLengthKind,
                  dfdlChoiceLength,
                  dfdlInitiatedContent,
                  dfdlChoiceDispatchKey,
                  dfdlChoiceBranchKey,
                ]
              }
            }
            if (
              wholeLine.includes('simpleType') ||
              checkSimpleTypeOpen(document, position)
            ) {
              var preVal = ''
              const dfdlLength = new vscode.CompletionItem('dfdl:length=')
              dfdlLength.insertText = new vscode.SnippetString(
                preVal + 'dfdl:length="$1"$0'
              )
              dfdlLength.documentation = new vscode.MarkdownString(
                'length can be an expression that resolves to an unsigned integer, or a literal unsigned integer'
              )

              const dfdlLengthKind = new vscode.CompletionItem(
                'dfdl:lengthKind='
              )
              dfdlLengthKind.insertText = new vscode.SnippetString(
                preVal +
                  'dfdl:lengthKind="${1|delimited,fixed,explicit,implicit,prefixed,pattern,endOfParent|}"$0'
              )
              dfdlLengthKind.documentation = new vscode.MarkdownString(
                'lengthKind can be delimited, fixed, explicit, implicit, prefixed,pattern, or endOfParent'
              )

              const dfdlSimpleTypeA = new vscode.CompletionItem(
                'dfdl:simpleType'
              )
              dfdlSimpleTypeA.insertText = new vscode.SnippetString(
                '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\talignment="$1"\n\t</xs:appinfo>\n</xs:annotation>$0'
              )

              const dfdlSimpleTypeR = new vscode.CompletionItem(
                'dfdl:simpleType'
              )
              dfdlSimpleTypeR.insertText = new vscode.SnippetString(
                '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\trepresentation="${1|binary,|"\n\t</xs:appinfo>\n</xs:annotation>$0'
              )

              const xsRestriction = new vscode.CompletionItem('xs:restriction')
              xsRestriction.insertText = new vscode.SnippetString(
                '<xs:restriction base="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean|}"/>$0'
              )

              if (!wholeLine.includes('>')) {
                return [
                  dfdlLength,
                  dfdlLengthKind,
                  dfdlSimpleTypeA,
                  dfdlSimpleTypeR,
                  xsRestriction,
                ]
              }
            }
            if (wholeLine.includes('defineVariable')) {
              var preVal = ''
              if (!wholeLine.includes('dfdl:defineVariable')) {
                if (lineCount(document, position) === 1) {
                  preVal = '\t'
                } else {
                  preVal = ''
                }
              }
              var additionalItems = getDefinedTypes(document)

              const xmlType = new vscode.CompletionItem('type=')
              xmlType.insertText = new vscode.SnippetString(
                preVal +
                  'type="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean' +
                  additionalItems +
                  '|}"$0'
              )
              xmlType.documentation = new vscode.MarkdownString(
                'attribute to specify a simple type element type'
              )

              const xmlExternal = new vscode.CompletionItem('external=')
              xmlExternal.insertText = new vscode.SnippetString(
                preVal + 'external="${1|true,false|}"$0'
              )
              xmlExternal.documentation = new vscode.MarkdownString('')

              const xmlDefaultValue = new vscode.CompletionItem('defaultValue=')
              xmlDefaultValue.insertText = new vscode.SnippetString(
                preVal + 'defaultValue="0$1"$0'
              )
              xmlDefaultValue.documentation = new vscode.MarkdownString('')

              if (!wholeLine.includes('>')) {
                return [xmlType, xmlExternal, xmlDefaultValue]
              }
            }
            if (nearestOpenItem.includes('setVariable')) {
              var preVal = ''
              if (!wholeLine.includes('dfdl:setVariable')) {
                if (lineCount(document, position) === 1) {
                  preVal = '\t'
                } else {
                  preVal = ''
                }
              }

              const xmlValue = new vscode.CompletionItem('value=')
              xmlValue.insertText = new vscode.SnippetString('value="$1"$0')
              xmlValue.documentation = new vscode.MarkdownString('')

              if (!wholeLine.includes('>')) {
                return [xmlValue]
              }
            }
          }
          return undefined
        },
      },
      ' ',
      '\n' // triggered whenever a newline is typed
    )

  //Checks if the line at the current position is the last opened tag
  function checkLastItemOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    const wholeLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum).range.end.character)
    while (wholeLine.length === 0) {
      --lineNum
    }
    const previousLine = document
      .lineAt(lineNum)
      .text.substr(0, document.lineAt(lineNum - 1).range.end.character)
    if (
      previousLine.includes('</') ||
      previousLine.includes('/>') ||
      ((wholeLine.includes('element') ||
        wholeLine.includes('sequence') ||
        wholeLine.includes('group') ||
        wholeLine.includes('Variable')) &&
        (wholeLine.includes('</') || wholeLine.includes('/>')))
    ) {
      // console.log('checkLastOpenItem returns false');
      return false
    }
    // console.log('checkLastOpenItem returns true');
    return true
  }

  function lineCount(document: vscode.TextDocument, position: vscode.Position) {
    var lineNum = position.line
    var lineCount = 0
    while (lineNum !== 0) {
      --lineNum
      ++lineCount
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      if (
        wholeLine.includes('<xs:element') &&
        !wholeLine.includes('</xs:element') &&
        !wholeLine.includes('/>')
      ) {
        return lineCount
      }
    }
    return lineCount
  }

  function nearestOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== -1) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substring(0, document.lineAt(lineNum).range.end.character)
      if (wholeLine.includes('element') && !wholeLine.includes('/>')) {
        if (checkElementOpen(document, position)) {
          // console.log("nearestOpen() returns element. wholeLine is: " + wholeLine);
          return 'element'
        }
      } else if (wholeLine.includes('sequence') && !wholeLine.includes('/>')) {
        if (checkSequenceOpen(document, position)) {
          return 'sequence'
        }
      } else if (wholeLine.includes('group')) {
        if (
          wholeLine.includes('<xs:group') &&
          !wholeLine.includes('</xs:group') &&
          !wholeLine.includes('/>') &&
          !wholeLine.includes('/')
        ) {
          return 'group'
        }
      } else if (
        wholeLine.includes('simpleType') &&
        !wholeLine.includes('/>')
      ) {
        if (checkSimpleTypeOpen(document, position)) {
          return 'simpleType'
        }
      } else if (
        wholeLine.includes('defineVariable') &&
        !wholeLine.includes('/>')
      ) {
        if (checkDefineVariableOpen(document, position)) {
          return 'defineVariable'
        }
      } else if (
        wholeLine.includes('setVariable') &&
        !wholeLine.includes('/>')
      ) {
        if (checkSetVariableOpen(document, position)) {
          return 'setVariable'
        }
      } else if (wholeLine.includes('/>')) {
        return 'none'
      }
      --lineNum
    }
    return 'none'
  }

  function checkElementOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== -1) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      if (
        wholeLine.includes('<xs:element') &&
        (wholeLine.includes('>') ||
          wholeLine.includes('</xs:element') ||
          wholeLine.includes('/>'))
      ) {
        return false
      }
      if (wholeLine.includes('</xs:element>')) {
        return false
      }
      if (
        wholeLine.includes('<xs:element') &&
        !wholeLine.includes('</xs:element') &&
        !wholeLine.includes('/>') &&
        !wholeLine.includes('>')
      ) {
        return true
      }
      --lineNum
    }
    return false
  }

  function checkSequenceOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== 0) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      if (
        (wholeLine.includes('<xs:sequence') &&
          (wholeLine.includes('</xs:sequence') || wholeLine.includes('/>'))) ||
        wholeLine.includes('</xs:sequence>')
      ) {
        return false
      }
      if (
        wholeLine.includes('<xs:sequence') &&
        !wholeLine.includes('</xs:sequence') &&
        !wholeLine.includes('/>')
      ) {
        return true
      }
      --lineNum
    }
    return false
  }

  /*function checkGroupOpen(document: vscode.TextDocument, position: vscode.Position) {
		var lineNum = position.line;
		while (lineNum !== 0) {
			const wholeLine = document.lineAt(lineNum).text.substr(0, document.lineAt(lineNum).range.end.character);
			if ((wholeLine.includes('<xs:group') && ((wholeLine.includes("</xs:group")) || (wholeLine.includes('/>')))) ||
				(wholeLine.includes('</xs:group>'))) {
				return false;
			}
			if (wholeLine.includes('<xs:group') && (!wholeLine.includes("</xs:group")) && (!wholeLine.includes('/>'))) {
				return true;
			}
			--lineNum;
		}
		return false;
	}*/

  function checkSimpleTypeOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== 0) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      // if((wholeLine.includes('<xs:simpleType') && ((wholeLine.includes("</xs:simpleType")) || (wholeLine.includes('/>')))) || (wholeLine.includes('</xs:simpleType>'))) {
      // 	return false;
      // }
      if (
        wholeLine.includes('<xs:simpleType') &&
        !wholeLine.includes('</xs:simpleType') &&
        !wholeLine.includes('/>')
      ) {
        return true
      }
      --lineNum
    }
    return false
  }

  function checkDefineVariableOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== 0) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      if (
        wholeLine.includes('<dfdl:defineVariable') &&
        !wholeLine.includes('</dfdl:defineVariable') &&
        !wholeLine.includes('/>')
      ) {
        return true
      }
      --lineNum
    }
    return false
  }

  function checkSetVariableOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    while (lineNum !== 0) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substr(0, document.lineAt(lineNum).range.end.character)
      if (
        wholeLine.includes('<dfdl:setVariable') &&
        !wholeLine.includes('</dfdl:setVariable') &&
        !wholeLine.includes('/>')
      ) {
        return true
      }
      --lineNum
    }
    return false
  }

  function checkBraceOpen(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    var lineNum = position.line
    //		var charPos = position.character;
    //		var endPos = 0;
    while (lineNum !== 0) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substring(0, document.lineAt(lineNum).range.end.character)
      //			endPos = wholeLine.lastIndexOf('}');
      if (
        wholeLine.includes('"{') &&
        wholeLine.includes('}"') &&
        wholeLine.includes('..') &&
        !wholeLine.includes('}"/') &&
        !wholeLine.includes('>')
      ) {
        return true
      }
      if (
        wholeLine.includes('"{') &&
        !wholeLine.includes('}"') &&
        !wholeLine.includes('}"/') &&
        !wholeLine.includes('>')
      ) {
        return true
      }
      if (
        wholeLine.includes('}"') &&
        !wholeLine.includes('}"/') &&
        !wholeLine.includes('>')
      ) {
        return true
      }
      if (
        wholeLine.includes('}"') &&
        (wholeLine.includes('}"/') ||
          wholeLine.includes('>') ||
          wholeLine.includes('/>'))
      ) {
        return false
      }
      --lineNum
    }
    return false
  }

  const closeElementGtProvider =
    vscode.languages.registerCompletionItemProvider(
      'dfdl',
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          var backpos = position.with(position.line, position.character - 1)
          const nearestOpenItem = nearestOpen(document, position)
          const wholeLine = document
            .lineAt(position)
            .text.substr(0, position.character)
          // console.log('In closeElementGtProvider: if open element or group or sequence');
          // console.log('in closeElementGtProvider - nearest open item: ' + nearestOpenItem);
          // console.log('in closeElementGtProvider - wholeLine: ' + wholeLine);
          if (
            wholeLine.endsWith('>') &&
            (wholeLine.includes('xs:element') ||
              nearestOpenItem.includes('element') ||
              wholeLine.includes('xs:group') ||
              nearestOpenItem.includes('group') ||
              wholeLine.includes('xs:sequence') ||
              nearestOpenItem.includes('sequence') ||
              wholeLine.includes('xs:simpleType') ||
              nearestOpenItem.includes('simpleType') ||
              wholeLine.includes('dfdl:defineVariable') ||
              nearestOpenItem.includes('Variable'))
          ) {
            // console.log('In closeElementGTProvider: if open element or group or sequence or simpleType');
            //					var backspace = new vscode.Selection(backpos, backpos);
            var range = new vscode.Range(backpos, position)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            if (
              wholeLine.endsWith('>') &&
              (wholeLine.includes('xs:element ref') ||
                wholeLine.includes('xs:group ref'))
            ) {
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString(' />\n$0'),
                backpos
              )
            } else if (
              wholeLine.endsWith('>') &&
              (wholeLine.includes('xs:element') ||
                nearestOpenItem.includes('element'))
            ) {
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n\t$0\n</xs:element>'),
                backpos
              )
            } else if (
              wholeLine.endsWith('>') &&
              (wholeLine.includes('xs:group') ||
                nearestOpenItem.includes('group'))
            ) {
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n\t$0\n</xs:group>'),
                backpos
              )
            } else if (
              (wholeLine.endsWith('>') && wholeLine.includes('xs:sequence')) ||
              nearestOpenItem.includes('sequence')
            ) {
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n\t$0\n</xs:sequence>'),
                backpos
              )
            } else if (
              (wholeLine.endsWith('>') &&
                wholeLine.includes('xs:simpleType')) ||
              nearestOpenItem.includes('simpleType')
            ) {
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n\t$0\n</xs:simpleType>'),
                backpos
              )
            } else if (
              (wholeLine.endsWith('>') &&
                wholeLine.includes('dfdl:defineVariable')) ||
              nearestOpenItem.includes('defineVariable')
            ) {
              var startPos = document.lineAt(position).text.indexOf('<', 0)
              var range = new vscode.Range(backpos, position)
              vscode.window.activeTextEditor?.edit((editBuilder) => {
                editBuilder.replace(range, '')
              })
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n</dfdl:defineVariable>\n'),
                backpos
              )
              var backpos2 = position.with(position.line + 2, startPos - 2)
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('</xs:appinfo>\n'),
                backpos2
              )
              var backpos3 = position.with(position.line + 3, startPos - 4)
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('</xs:annotation>$0'),
                backpos3
              )
            } else if (
              (wholeLine.endsWith('>') &&
                wholeLine.includes('dfdl:setVariable')) ||
              nearestOpenItem.includes('setVariable')
            ) {
              var startPos = document.lineAt(position).text.indexOf('<', 0)
              var range = new vscode.Range(backpos, position)
              vscode.window.activeTextEditor?.edit((editBuilder) => {
                editBuilder.replace(range, '')
              })
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('>\n</dfdl:setVariable>\n'),
                backpos
              )
              var backpos2 = position.with(position.line + 2, startPos - 2)
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('</xs:appinfo>\n'),
                backpos2
              )
              var backpos3 = position.with(position.line + 3, startPos - 4)
              vscode.window.activeTextEditor?.insertSnippet(
                new vscode.SnippetString('</xs:annotation>$0'),
                backpos3
              )
            }
          }
          return undefined
        },
      },
      '>' // triggered whenever a '>' is typed
    )

  const closeElementSlashProvider =
    vscode.languages.registerCompletionItemProvider(
      'dfdl',
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          var backpos = position.with(position.line, position.character - 1)
          const wholeLine = document
            .lineAt(position)
            .text.substr(0, position.character)
          const nearestOpenItem = nearestOpen(document, position)
          // console.log('In closeElementSlashProvider: if open element or group or sequence');
          // console.log('in closeElementSlashProvider - nearest open item: ' + nearestOpenItem);
          // console.log('in closeElementSlashProvider - wholeLine: ' + wholeLine);
          if (checkBraceOpen(document, position)) {
            return undefined
          }
          // console.log('in closeElementSlashProvider - passed all checks - if is next');
          if (
            wholeLine.endsWith('/') &&
            (wholeLine.includes('xs:element') ||
              nearestOpenItem.includes('element') ||
              wholeLine.includes('xs:group') ||
              nearestOpenItem.includes('group') ||
              wholeLine.includes('xs:sequence') ||
              nearestOpenItem.includes('sequence'))
          ) {
            //					var backspace = new vscode.Selection(backpos, backpos);
            var range = new vscode.Range(backpos, position)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            vscode.window.activeTextEditor?.insertSnippet(
              new vscode.SnippetString(' />$0'),
              backpos
            )
          }
          if (
            wholeLine.endsWith('/') &&
            (wholeLine.includes('dfdl:defineVariable') ||
              wholeLine.includes('dfdl:setVariable') ||
              nearestOpenItem.includes('defineVariable') ||
              nearestOpenItem.includes('setVariable'))
          ) {
            var startPos = document.lineAt(position).text.indexOf('<', 0)
            var range = new vscode.Range(backpos, position)
            vscode.window.activeTextEditor?.edit((editBuilder) => {
              editBuilder.replace(range, '')
            })
            vscode.window.activeTextEditor?.insertSnippet(
              new vscode.SnippetString('/>\n'),
              backpos
            )
            var backpos2 = position.with(position.line + 1, startPos - 2)
            vscode.window.activeTextEditor?.insertSnippet(
              new vscode.SnippetString('</xs:appinfo>\n'),
              backpos2
            )
            var backpos3 = position.with(position.line + 2, startPos - 4)
            vscode.window.activeTextEditor?.insertSnippet(
              new vscode.SnippetString('</xs:annotation>$0'),
              backpos3
            )
          }
          return undefined
        },
      },
      '/' // triggered whenever a '/' is typed
    )

  // const endSingleQuoteProvider = vscode.languages.registerCompletionItemProvider (
  // 	'dfdl',
  // 	{
  // 		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
  // 			const posPlusOne = new vscode.Position(position.line, position.character + 1);
  // 			const wholeLine = document.lineAt(position).text.substr(0, position.character);
  // 			console.log(wholeLine);
  // 			if(wholeLine.endsWith("'")) {
  // 				vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString("$1'$0"), position);
  // 			}
  // 			console.log('endSingleQuoteProvider returning undefined');
  // 			return undefined;
  // 		}
  // 	},
  // 	"'"

  const endSingleBraceProvider =
    vscode.languages.registerCompletionItemProvider(
      'dfdl',
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          //				const posMinusOne = document.lineAt(position).text.substr(0, position.character - 1);
          const wholeLine = document
            .lineAt(position)
            .text.substr(0, position.character)
          if (wholeLine.includes('dfdl:length="{')) {
            vscode.window.activeTextEditor?.insertSnippet(
              new vscode.SnippetString('$1}$0'),
              position
            )
          }
          return undefined
        },
      },
      '{'
    )

  function getDefinedTypes(document: vscode.TextDocument) {
    var additionalTypes = ''
    var lineNum = 0
    const lineCount = document.lineCount
    while (lineNum !== lineCount) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substring(0, document.lineAt(lineNum).range.end.character)
      // console.log('getDefinedTypes - wholeLine: ' + wholeLine);
      if (
        wholeLine.includes('xs:simpleType Name=') ||
        wholeLine.includes('xs:complexType Name=')
      ) {
        var startPos = wholeLine.indexOf('"', 0)
        var endPos = wholeLine.indexOf('"', startPos + 1)
        var newType = wholeLine.substring(startPos + 1, endPos)
        additionalTypes = String(additionalTypes + ',' + newType)
      }
      ++lineNum
    }
    return additionalTypes
  }

  function getDefinedVariables(document: vscode.TextDocument) {
    var additionalTypes = ''
    var lineNum = 0
    var itemCnt = 0
    const lineCount = document.lineCount
    while (lineNum !== lineCount) {
      const wholeLine = document
        .lineAt(lineNum)
        .text.substring(0, document.lineAt(lineNum).range.end.character)
      // console.log('getDefinedTypes - wholeLine: ' + wholeLine);
      if (wholeLine.includes('dfdl:defineVariable name=')) {
        var startPos = wholeLine.indexOf('"', 0)
        var endPos = wholeLine.indexOf('"', startPos + 1)
        var newType = wholeLine.substring(startPos + 1, endPos)
        if (itemCnt === 0) {
          additionalTypes = newType
          ++itemCnt
        } else {
          additionalTypes = String(additionalTypes + ',' + newType)
          ++itemCnt
        }
      }
      ++lineNum
    }
    return additionalTypes
  }

  context.subscriptions.push(
    elementCompletionProvider,
    attributeCompletionProvider,
    closeElementGtProvider,
    closeElementSlashProvider,
    endSingleBraceProvider
  )
}
