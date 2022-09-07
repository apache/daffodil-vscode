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
export const elementCompletion = (definedVariables, dfdlFormatString) => {
  return {
    items: [
      {
        item: 'xml version',
        snippetString: '<?xml version="1.0" encoding="UTF-8"?>\n$0',
      },
      {
        item: 'xs:schema',
        snippetString: '<xs:schema xmlns:xs="http://www.w3.org/2001/xmlSchema"\n\t\txmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"\n\t\txmlns:daf="urn:ogf:dfdl:2013:imp:daffodil.apache.org:2018:ext"\n\t\txmlns:fn="http:/www.w3.org/2005/xpath-functions"\n\t\txmlns:math="www.w3.org/2005/xpath-functions/math" elementFormDefault="qualified">\n$0\n</xs:schema>',
      },
      {
        item: 'xs:element name',
        snippetString: '<xs:element name="$1"$0',
        markdownString: 'A new xs element',
      },
      {
        item: 'xs:element ref',
        snippetString: '<xs:element ref="$1"$0',
        markdownString: 'A new dfdl reference to an item',
      },
      {
        item: 'xs:group name',
        snippetString: '<xs:group name = "$1">\n\t$0\n</xs:group>',
      },
      {
        item: 'xs:group ref',
        snippetString: '<xs:group ref="$1"$0',
        markdownString: 'A new dfdl reference to an item',
      },
      {
        item: 'dfdl:assert',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:assert>"<$1>"</dfdl:assert>\n\t</xs:appinfo>\n</xs:annotation>$0',
        markdownString: 'dfdl assertion test',
      },
      {
        item: 'dfdL:discriminator',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:discriminator test="{$1}"/>\n\t</xs:appinfo>\n</xs:annotation>$0',
        markdownString: 'dfdl discriminator test',
      },
      {
        item: 'dfdl:hiddenGroupRef',
        snippetString: '<xs:sequence dfdl:hiddenGroupRef="$1"/>\n$0',
      },
      {
        item: 'dfdl:format',
        snippetString: dfdlFormatString,
      },
      {
        item: 'xs:annotation',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</xs:appinfo>\n</xs:annotation>',
      },
      {
        item: 'xs:appinfo',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</xs:appinfo>\n</xs:annotation>',
      },
      {
        item: 'xs:complexType',
        snippetString: '<xs:complexType>\n\t$0\n</xs:complexType>',
        markdownString: 'Starts a complex type definition',
      },
      {
        item: 'xs:complexType name=',
        snippetString: '<xs:complexType Name="$1">\n\t$0\n</xs:complexType>',
        markdownString: 'Starts a complex type definition',
      },
      {
        item: 'xs:simpleType',
        snippetString: '<xs:simpleType>\n\t$0\n</xs:simpleType>',
        markdownString: 'Starts a simple type definition',
      },
      {
        item: 'xs:simpleType name=',
        snippetString: '<xs:simpleType Name="$1"$0',
        markdownString: 'Starts a simple type definition',
      },
      {
        item: 'xs:sequence',
        snippetString: '<xs:sequence',
      },
      {
        item: 'xs:choice',
        snippetString: '<xs:choice',
      },
      {
        item: 'dfdl:defineVariable',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:defineVariable name="$1"$0',
      },
      {
        item: 'dfdl:setVariable',
        snippetString: '<xs:annotation>\n\t<xs:appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:setVariable ref="${1|' + definedVariables + '|}"$0',
      },
    ],
  }
}
