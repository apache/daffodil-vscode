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
export const elementCompletion = (definedVariables, dfdlFormatString, nsPrefix) => {
  return {
    items: [
      {
        item: 'xml version',
        snippetString: '<?xml version="1.0" encoding="UTF-8"?>\n$0',
      },
      {
        item: nsPrefix + 'schema',
        snippetString: '<' + nsPrefix + 'schema xmlns:xs="http://www.w3.org/2001/xmlSchema"\n\t\txmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"\n\t\txmlns:daf="urn:ogf:dfdl:2013:imp:daffodil.apache.org:2018:ext"\n\t\txmlns:fn="http:/www.w3.org/2005/xpath-functions"\n\t\txmlns:math="www.w3.org/2005/xpath-functions/math" elementFormDefault="qualified">\n$0\n</' + nsPrefix + 'schema>',
      },
      {
        item: nsPrefix + 'element name',
        snippetString: '<' + nsPrefix + 'element name="$1"$0',
        markdownString: 'A new xs element',
      },
      {
        item: nsPrefix + 'element ref',
        snippetString: '<' + nsPrefix + 'element ref="$1"$0',
        markdownString: 'A new dfdl reference to an item',
      },
      {
        item: nsPrefix + 'group name',
        snippetString: '<' + nsPrefix + 'group name = "$1">\n\t$0\n</' + nsPrefix + 'group>',
      },
      {
        item: nsPrefix + 'group ref',
        snippetString: '<' + nsPrefix + 'group ref="$1"$0',
        markdownString: 'A new dfdl reference to an item',
      },
      {
        item: 'dfdl:assert',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:assert>"<$1>"</dfdl:assert>\n\t</' + nsPrefix + 'appinfo>\n</' + nsPrefix + 'annotation>$0',
        markdownString: 'dfdl assertion test',
      },
      {
        item: 'dfdL:discriminator',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:discriminator test="{$1}"/>\n\t</' + nsPrefix + 'appinfo>\n</' + nsPrefix + 'annotation>$0',
        markdownString: 'dfdl discriminator test',
      },
      {
        item: 'dfdl:hiddenGroupRef',
        snippetString: '<' + nsPrefix + 'sequence dfdl:hiddenGroupRef="$1"/>\n$0',
      },
      {
        item: 'dfdl:format',
        snippetString: dfdlFormatString,
      },
      {
        item: nsPrefix + 'annotation',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</' + nsPrefix + 'appinfo>\n</' + nsPrefix + 'annotation>',
      },
      {
        item: nsPrefix + 'appinfo',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t$0\n\t</' + nsPrefix + 'appinfo>\n</' + nsPrefix + 'annotation>',
      },
      {
        item: nsPrefix + 'complexType',
        snippetString: '<' + nsPrefix + 'complexType>\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Starts a complex type definition',
      },
      {
        item: nsPrefix + 'complexType name=',
        snippetString: '<' + nsPrefix + 'complexType Name="$1">\n\t$0\n</' + nsPrefix + 'complexType>',
        markdownString: 'Starts a complex type definition',
      },
      {
        item: nsPrefix + 'simpleType',
        snippetString: '<' + nsPrefix + 'simpleType>\n\t$0\n</' + nsPrefix + 'simpleType>',
        markdownString: 'Starts a simple type definition',
      },
      {
        item: nsPrefix + 'simpleType name=',
        snippetString: '<' + nsPrefix + 'simpleType Name="$1"$0',
        markdownString: 'Starts a simple type definition',
      },
      {
        item: nsPrefix + 'sequence',
        snippetString: '<' + nsPrefix + 'sequence',
      },
      {
        item: nsPrefix + 'choice',
        snippetString: '<' + nsPrefix + 'choice',
      },
      {
        item: 'dfdl:defineVariable',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:defineVariable name="$1"$0',
      },
      {
        item: 'dfdl:setVariable',
        snippetString: '<' + nsPrefix + 'annotation>\n\t<' + nsPrefix + 'appinfo source="http://www.ogf.org/dfdl/">\n\t\t<dfdl:setVariable ref="${1|' + definedVariables + '|}"$0',
      },
    ],
  }
}
