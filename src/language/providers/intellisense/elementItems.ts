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
 * Element Completion Data and Factory Function
 *
 * This module exports the element completion data used by elementCompletion.ts.
 * It provides a complete catalog of XML/DFDL elements that can be suggested
 * in different schema contexts, along with their snippet templates and documentation.
 *
 * **Dynamic Behavior:**
 * - The `elementCompletion` function generates completion items dynamically
 * - It accepts `definedVariables` to populate the dfdl:setVariable dropdown
 * - It accepts `nsPrefix` to customize snippets with the correct namespace
 *
 * **Snippet Features:**
 * - Tab stops ($1, $2, $0) for navigation
 * - Choice placeholders (${1|option1,option2|}) for enumerated values
 * - Dynamic variable insertion using string concatenation
 */
// prettier-ignore
export const elementCompletion = (definedVariables, nsPrefix) => {
  return {
    items: [
      {
        item: 'xml version',
        snippetString: '<?xml version="1.0" encoding="UTF-8"?>\n$0',
        markdownString: 'XML declaration with UTF-8 encoding'
      },
      {
        item: nsPrefix + 'schema',
        snippetString: '<${1|' + '\0' + ',xs:,xsd:|}$2' + 'schema xmlns:xs="http://www.w3.org/2001/xmlSchema"\n\t\txmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"\n\t\txmlns:daf="urn:ogf:dfdl:2013:imp:daffodil.apache.org:2018:ext"\n\t\txmlns:fn="http:/www.w3.org/2005/xpath-functions"\nelementFormDefault="unqualified"$0',
        markdownString: 'Root schema element with standard DFDL namespace declarations'
      },
      {
        item: nsPrefix + 'element',
        snippetString: '<' + nsPrefix + 'element$0',
        markdownString: 'Defines an xs element'
      },
      {
        item: nsPrefix + 'element name',
        snippetString: '<' + nsPrefix + 'element name="$1"$0',
        markdownString: 'Defines an xs element with name attribute'
      },
      {
        item: nsPrefix + 'element ref',
        snippetString: '<' + nsPrefix + 'element ref="$1"$0',
        markdownString: 'Defines a reference to a declared element'
      },
      {
        item: nsPrefix + 'group',
        snippetString: '<' + nsPrefix + 'group "$1">\n\t$0\n</' + nsPrefix + 'group>',
        markdownString: 'Defines a named model group to be reused later'
      },
      {
        item: nsPrefix + 'group name',
        snippetString: '<' + nsPrefix + 'group name = "$1">\n\t$0\n</' + nsPrefix + 'group>',
        markdownString: 'Defines a named model group'
      },
      {
        item: nsPrefix + 'group ref',
        snippetString: '<' + nsPrefix + 'group ref="$1"$0',
        markdownString: 'Defines a reference to a group declaration'
      },
      {
        item: 'dfdl:assert',
        snippetString: '<dfdl:assert $0',
        markdownString: 'Used to assert truths about a DFDL model'
      },
      {
        item: 'dfdl:discriminator',
        snippetString: '<dfdl:discriminator $0',
        markdownString: 'Used during parsing to resolve points of uncertainty during speculative parsing'
      },
      {
        item: 'dfdl:format',
        snippetString: '<dfdl:format $0',
        markdownString: 'Defines physical data format properties for DFDL constructs'
      },
      {
        item: nsPrefix + 'annotation',
        snippetString: '<' + nsPrefix + 'annotation>\n\t$0\n\</' + nsPrefix + 'annotation>',
        markdownString: 'Container for DFDL annotation information'
      },
      {
        item: nsPrefix + 'appinfo',
        snippetString: '<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t$0\n</' + nsPrefix + 'appinfo>',
        markdownString: 'Contains DFDL format definitions'
      },
      {
        item: nsPrefix + 'complexType',
        snippetString: '<' + nsPrefix + 'complexType>\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Defines a complex type definition'
      },
      {
        item: nsPrefix + 'complexType name',
        snippetString: '<' + nsPrefix + 'complexType name="$1">\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Defines a named complex type'
      },
      {
        item: nsPrefix + 'simpleType',
        snippetString: '<' + nsPrefix + 'simpleType$1>\n\t$0\n</' + nsPrefix + 'simpleType>',
        markdownString: 'Defines a simple type definition'
      },
      {
        item: nsPrefix + 'simpleType name',
        snippetString: '<' + nsPrefix + 'simpleType name="$1"$0',
        markdownString: 'Defines a named simple type'
      },
      {
        item: nsPrefix + 'sequence',
        snippetString: '<' + nsPrefix + 'sequence',
        markdownString: 'Specifies child elements must appear in sequence'
      },
      {
        item: nsPrefix + 'choice',
        snippetString: '<' + nsPrefix + 'choice',
        markdownString: 'Defines mutually exclusive elements'
      },
      {
        item: 'dfdl:newVariableInstance',
        snippetString: '<dfdl:newVariableInstance ref="$1"$0',
        markdownString: 'Creates a new instance of a defined variable'
      },
      {
        item: 'dfdl:defineVariable',
        snippetString: '<dfdl:defineVariable "$1"$0',
        markdownString: 'Defines a variable name, type, and optional default value'
      },
      {
        item: 'dfdl:defineVariable name',
        snippetString: '<dfdl:defineVariable name="$1"$0',
        markdownString: 'Defines a named variable with type and optional default'
      },
      {
        item: 'dfdl:setVariable',
        // **DYNAMIC SNIPPET**: Uses definedVariables parameter to populate ref attribute choices
        snippetString: '<dfdl:setVariable ref="${1|' + definedVariables + '"|}, value="$2"$0',
        markdownString: 'Sets the value of a variable in scope'
      },
      {
        item: 'dfdl:defineFormat',
        snippetString: '<dfdl:defineFormat name="$1">\n\t$2\n</dfdl:defineFormat>$0',
        markdownString: 'Defines a reusable format definition'
      },
      {
        item: 'dfdl:defineEscapeScheme',
        snippetString: '<dfdl:defineEscapeScheme name=$1 >\n\t$0</dfdl:defineEscapeScheme>',
        markdownString: 'Defines a reusable escape scheme'
      },
      {
        item: 'dfdl:escapeScheme',
        snippetString: '<dfdl:escapeScheme $0',
        markdownString: 'References a common set of reusable properties'
      },
      {
        item: 'dfdl:simpleType',
        snippetString: '<dfdl:simpleType $1/>$0',
        markdownString: 'Defines physical data format properties of xs:simpleType'
      },
      {
        item: 'dfdl:element',
        snippetString: '<dfdl:element $1/>$0',
        markdownString: 'Defines physical data format properties of xs:element'
      },
      {
        item: 'dfdl:sequence',
        snippetString: '<dfdl:sequence $1/>$0',
        markdownString: 'Defines physical data format properties of xs:sequence'
      },
      {
        item: 'dfdl:group',
        snippetString: '<dfdl:group $1/>$0',
        markdownString: 'Defines physical data format properties of xs:group'
      },
      {
        item: 'dfdl:choice',
        snippetString: '<dfdl:choice $1/>$0',
        markdownString: 'Defines physical data format properties of xs:choice'
      },
      {
        item: 'dfdl:property',
        snippetString: '<dfdl:property name="$1">\n\t$2\n</dfdl:property>$0',
        markdownString: 'Used in format annotations'
      },
      {
        item: 'restriction',
        // **CHOICE PLACEHOLDER**: Provides dropdown of common XSD primitive types
        snippetString: '<' + nsPrefix + 'restriction base="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean|}"$0',
        markdownString: 'Specifies base type for restriction'
      },
      {
        item: 'minInclusive',
        snippetString: '<' + nsPrefix + 'minInclusive value="$1"/>$0',
        markdownString: 'Validates element has minimum inclusive value'
      },
      {
        item: 'minExclusive',
        snippetString: '<' + nsPrefix + 'minExclusive value="$1"/>$0',
        markdownString: 'Validates element has minimum exclusive value'
      },
      {
        item: 'maxInclusive',
        snippetString: '<' + nsPrefix + 'maxInclusive value="$1"/>$0',
        markdownString: 'Validates element has maximum inclusive value'
      },
      {
        item: 'maxExclusive',
        snippetString: '<' + nsPrefix + 'maxExclusive value="$1"/>$0',
        markdownString: 'Validates element has maximum exclusive value'
      },
      {
        item: 'pattern',
        snippetString: '<' + nsPrefix + 'pattern value="$1"/>$0',
        markdownString: 'Restricts type with regular expression pattern'
      },
      {
        item: 'totalDigits',
        snippetString: '<' + nsPrefix + 'totalDigits value="$1"/>$0',
        markdownString: 'Restricts maximum number of digits'
      },
      {
        item: 'fractionDigits',
        snippetString: '<' + nsPrefix + 'fractionDigits value="$1"/>$0',
        markdownString: 'Restricts maximum digits in fractional part'
      },
      {
        item: 'enumeration',
        snippetString: '<' + nsPrefix + 'enumeration value="$1"/>$0',
        markdownString: 'Restricts type to finite set of values'
      },
      {
        item: nsPrefix + 'include',
        snippetString: '<' + nsPrefix + 'include "$1"/>$0',
        markdownString: 'Includes components from another schema'
      },
      {
        item: 'documentation',
        snippetString: '<' + nsPrefix + 'documentation>\n\t$1\n</documentation>$0',
        markdownString: 'Contains human-readable documentation'
      },
      {
        item: nsPrefix + 'import',
        snippetString: '<' + nsPrefix + 'import "$1"/>$0',
        markdownString: 'Imports components from another namespace'
      },
      {
        item: '<[CDATA[]]>',
        snippetString: '<[CDATA[$1]]>$0',
        markdownString: 'CDATA section (alternative syntax)'
      },
      {
        item: '<![CDATA[]]>',
        snippetString: '<![CDATA[$1]]>$0',
        markdownString: 'CDATA section for character data'
      },
      {
        item: '{}',
        snippetString: '{$1}$0',
        markdownString: 'DFDL expression wrapper'
      }
    ],
  }
}
