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
export const elementCompletion = (definedVariables, nsPrefix) => {
  return {
    items: [
      {
        item: 'xml version',
        snippetString: '<?xml version="1.0" encoding="UTF-8"?>\n$0',
      },
      {
        item: nsPrefix + 'schema',
        snippetString: '<${1|\0,xs:,xsd:|}$2' + 'schema xmlns:xs="http://www.w3.org/2001/xmlSchema"\n\t\txmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"\n\t\txmlns:daf="urn:ogf:dfdl:2013:imp:daffodil.apache.org:2018:ext"\n\t\txmlns:fn="http:/www.w3.org/2005/xpath-functions"\nelementFormDefault="unqualified"$0',
      },
      {
        item: nsPrefix + 'element name',
        snippetString: '<' + nsPrefix + 'element name="$1"$0',
        markdownString: 'Defines an xs element',
      },
      {
        item: nsPrefix + 'element ref',
        snippetString: '<' + nsPrefix + 'element ref="$1"$0',
        markdownString: 'Defines a reference to a declared element',
      },
      {
        item: nsPrefix + 'group name',
        snippetString: '<' + nsPrefix + 'group name = "$1">\n\t$0\n</' + nsPrefix + 'group>',
        markdownString: 'Defines a named model group to be reused later',
      },
      {
        item: nsPrefix + 'group ref',
        snippetString: '<' + nsPrefix + 'group ref="$1"$0',
        markdownString: 'Defines a reference to a group declaration',
      },
      {
        item: 'dfdl:assert',
        snippetString: '<dfdl:assert $0',
        markdownString: 'Used to assert truths about a DFDL model',
      },
      {
        item: 'dfdl:discriminator',
        snippetString: '<dfdl:discriminator $0',
        markdownString: 'Used during parsing to resolve points or uncertainity, remove ambiguity during speculative parsing, improve diagnostic behavior',
      },
      {
        item: 'dfdl:format',
        snippetString: '<dfdl:format $0',
        markdownString: 'Defines the physical data format properties for multiple DFDL schema constructs',
      },
      {
        item: nsPrefix + 'annotation',
        snippetString: '<' + nsPrefix + 'annotation>\n\t$0\n\</' + nsPrefix + 'annotation>',
      },
      {
        item: nsPrefix + 'appinfo',
        snippetString: '<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t$0\n</' + nsPrefix + 'appinfo>',
      },
      {
        item: nsPrefix + 'complexType',
        snippetString: '<' + nsPrefix + 'complexType>\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Defines a complex type definition',
      },
      {
        item: nsPrefix + 'complexType name=',
        snippetString: '<' + nsPrefix + 'complexType name="$1">\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Defines a complex type definition',
      },
      {
        item: nsPrefix + 'simpleType',
        snippetString: '<' + nsPrefix + 'simpleType$1>\n\t$0\n</' + nsPrefix + 'simpleType>',
        markdownString: 'Defines a simple type definition',
      },
      {
        item: nsPrefix + 'simpleType name=',
        snippetString: '<' + nsPrefix + 'simpleType name="$1"$0',
        markdownString: 'Defines simple type definition',
      },
      {
        item: nsPrefix + 'sequence',
        snippetString: '<' + nsPrefix + 'sequence',
        markdownString: 'Specifies that the child elements must appear in a sequence',
      },
      {
        item: nsPrefix + 'choice',
        snippetString: '<' + nsPrefix + 'choice',
        markdownString: 'Define group of mutually exclusive elements that resolve points of uncertainty that cannot be resolved by speculative parsing',
      },
      {
        item: 'dfdl:newVariableInstance',
        snippetString: '<dfdl:newVariableInstance ref="$1"$0',
        markdownString: 'Defines the name, type, and optional default value for the variable'
      },
      {
        item: 'dfdl:defineVariable',
        snippetString: '<dfdl:defineVariable name="$1"$0',
        markdownString: 'Defines the name, type, and optionally default value for the variable.',
      },
      {
        item: 'dfdl:setVariable',
        snippetString: '<dfdl:setVariable ref="${1|' + definedVariables + '"|}, value="$2"$0',
        markdownString: 'Sets the value of a variable whose declaration is in scope',
      },
      {
        item: 'dfdl:defineFormat',
        snippetString: '<dfdl:defineFormat name="$1">\n\t$2\n</dfdl:defineFormat>$0',
        markdownString: 'Defines a named reusable format definition',
      },
      {
        item: 'dfdl:defineEscapeScheme',
        snippetString: '<dfdl:defineEscapeScheme name=$1 >\n\t$0,/dfdl:defineEscapeScheme>',
        markdownString: 'Defines a named, reusable escapeScheme',
      },
      {
        item: 'dfdl:escapeScheme',
        snippetString: '<dfdl:escapeScheme $0',
        markdownString: 'Allows a common set of properties to be defined that can be reused',
      },
      {
        item: 'dfdl:simpleType',
        snippetString: '<dfdl:simpleType $1/>$0',
        markdownString: 'Defines the physical data format properties of an xs:simpleType',
      },
      {
        item: 'dfdl:element',
        snippetString: '<dfdl:element $1/>$0',
        markdownString: 'Defines the physical data format properties of an xs:element',
      },
      {
        item: 'dfdl:sequence',
        snippetString: '<dfdl:sequence $1/>$0',
        markdownString: 'Defines the physical data format properties of an xs:sequence group',
      },
      {
        item: 'dfdl:group',
        snippetString: '<dfdl:group $1/>$0',
        markdownString: 'Defines the physical data format properties of an xs:group reference',
      },
      {
        item: 'dfdl:choice',
        snippetString: '<dfdl:choice $1/>$0',
        markdownString: 'Defines the physical data format properties of an xs:choice group',
      },
      {
        item: 'dfdl:property',
        snippetString: '<dfdl:property name="$1">\n\t$2\n</dfdl:property>$0',
        markdownString: 'Used in the syntax of format annotations',
      },
      {
        item: 'restriction',
        // use the "xs:" prefix for primitive types to differentiate them from custom simple types
        snippetString: '<' + nsPrefix + 'restriction base="${1|xs:string,xs:decimal,xs:float,xs:double,xs:integer,xs:nonNegativeInteger,xs:int,xs:unsignedInt,xs:short,xs:unsignedShort,xs:long,xs:unsignedLong,xs:byte,xs:unsignedByte,xs:hexBinary,xs:boolean|}"$0',
        markdownString: 'Specify type the element is restricted to',
      },
      {
        item: 'minInclusive',
        snippetString: '<' + nsPrefix + 'minInclusive value="$1"/>$0',
        markdownString: 'Used to check the validity of an element'
      },
      {
        item: 'minExclusive',
        snippetString: '<' + nsPrefix + 'minExclusive value="$1"/>$0',
        markdownString: 'Used to check the validity of an element'
      },
      {
        item: 'maxInclusive',
        snippetString: '<' + nsPrefix + 'maxInclusive value="$1"/>$0',
        markdownString: 'Used to check the validity of an element'
      },
      {
        item: 'maxExclusive',
        snippetString: '<' + nsPrefix + 'maxExclusive value="$1"/>$0',
        markdownString: 'Used to check the validity of an element'
      },
      {
        item: 'pattern',
        snippetString: '<' + nsPrefix + 'pattern value="$1"/>$0',
        markdownString: 'Used to derive new simple types by specifying a regular expression against which values of the type are compared'
      },
      {
        item: 'totalDigits',
        snippetString: '<' + nsPrefix + 'totalDigits value="$1"/>$0',
        markdownString: 'Indicates the maximum allowed value for the number of digits'
      },
      {
        item: 'fractionDigits',
        snippetString: '<' + nsPrefix + 'fractionDigits value="$1"/>$0',
        markdownString: 'Indicates the maximum number of digits in the fractional part'
      },
      {
        item: 'enumeration',
        snippetString: '<' + nsPrefix + 'enumeration value="$1"/>$0',
        markdownString: 'Used to restrict a datatype to a finite set of values'
      },
      {
        item: 'include',
        snippetString: '<' + nsPrefix + 'include "$1"/>$0',
        markdownString: 'Used to add all the components of an included schema'
      },
      {
        item: 'documentation',
        snippetString: '<' + nsPrefix + 'documentation>\n\t$1\n</documentation>$0'
      },
      {
        item: 'import',
        snippetString: '<' + nsPrefix + 'import "$1"/>$0',
        markdownString: 'Used to add all the components of an included schema'
      },
      {
        item: '<[CDATA[]]>',
        snippetString: '<[CDATA[$1]]>$0',
        markdownString: ''
      },
      {
        item: '<![CDATA[]]>',
        snippetString: '<![CDATA[$1]]>$0',
        markdownString: ''
      },
      {
        item: '{}',
        snippetString: '{$1}$0',
        markdownString: ''
      },
    ],
  }
}
