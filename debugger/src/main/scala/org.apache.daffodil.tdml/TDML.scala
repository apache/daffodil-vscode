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

package org.apache.daffodil.tdml

import java.io.File
import java.nio.file._
import javax.xml.bind.JAXBContext
import javax.xml.bind.JAXBElement
import javax.xml.bind.Marshaller
import javax.xml.namespace.QName
import javax.xml.bind.annotation.XmlType
import scala.collection.JavaConverters._

object TDML {
  // Create a ParserTestCaseType object that can be put into a TestSuite
  // These types are generated when JAXB is executed on the TDML schema
  //
  // The format of the new ParserTestCase is as follows:
  //
  // <tdml:parserTestCase name="$tdmlName" root="file" model="$schemaPath" description="$tdmlDescription" roundTrip="onePass">
  //   <tdml:document>
  //     <tdml:documentPart type="file">$dataPath</tdml:documentPart>
  //   <tdml:document>
  //   <tdml:infoset>
  //     <tdml:dfdlInfoset type="file">$infosetPath</tdml:dfdlInfoset>
  //   </tdml:infoset>
  // </tdml:parserTestCase>
  //
  // infosetPath:     Path to the infoset
  // dataPath:        Path to the data file
  // schemaPath:      Path to the DFDL Schema
  // tdmlName:        Name of the DFDL operation
  // tdmlDescription: Description for the DFDL operation
  //
  // Returns the ParserTestCase object created with the applied paths
  def createTestCase(
      infosetPath: String,
      schemaPath: String,
      dataPath: String,
      tdmlName: String,
      tdmlDescription: String
  ): ParserTestCaseType = {
    val factory = new ObjectFactory()

    val dfdlInfoset = factory.createDfdlInfosetType()
    dfdlInfoset.setType("file")
    dfdlInfoset.getContent().add(infosetPath)

    val infoset = factory.createInfosetType()
    infoset.setDfdlInfoset(dfdlInfoset)

    val docPart = factory.createDocumentPartType()
    docPart.setType(DocumentPartTypeEnum.FILE)
    docPart.setValue(dataPath)

    // These lines are necessary because there is no @XmlRootElement annotation on the DocumentPartType class in JAXB
    // Ideally, we would want to have JAXB add the annotation - probably with the bindings.xjb file. The only way I found
    //   that did that required an external plugin just to add the annotation (https://github.com/highsource/jaxb2-annotate-plugin).
    // We are getting the namespace from the JAXB class so that we don't have to hard-code it here
    // Unfortunately, it seems like hard-coding the class name isn't an easy thing to avoid. There is a name in the XmlType
    //   annotation, but it is documentPartType instead of documentPart. We would need to remove the Type from this anyway.
    val tdmlNamespacePrefix = classOf[DocumentPartType].getAnnotation(classOf[XmlType]).namespace()
    val docPartElement = new JAXBElement[DocumentPartType](
      new QName(tdmlNamespacePrefix, "documentPart"),
      classOf[DocumentPartType],
      docPart
    )

    val doc = factory.createDocumentType()
    doc.getContent().add(docPartElement)

    val testCase = factory.createParserTestCaseType()
    testCase.setName(tdmlName)
    testCase.setRoot("file")
    testCase.setModel(schemaPath)
    testCase.setDescription(tdmlDescription)
    testCase.setRoundTrip(RoundTripType.ONE_PASS)
    testCase.getTutorialOrDocumentOrInfoset().add(doc)
    testCase.getTutorialOrDocumentOrInfoset().add(infoset)

    testCase
  }
  // Convert an absolute path into a path relative to the current working directory
  //
  // path: Absolute path to convert into a relative path
  // tdmlPath: Absolute path to the TDML file to make
  //
  // Returns the relative path. Note that this path is given as a string.
  def convertToRelativePath(path: Path, tdmlPath: String): String = {
    // Get the absolute path of the workspace directory
    // The path is the path to a file. To get the proper relative path, we need
    //   to start at the parent of the file.
    var workingDir = Paths.get(tdmlPath).toAbsolutePath().getParent()
    var prefix = ""

    // This is used to back up the path tree in order to find the first common ancestor of both paths
    // If a user wants to use a file not in or under the current working directory, this will be required to
    //   produce the expected output.
    // A possible use case of this is where a user has a data folder and a schema folder that are siblings.
    while (!path.startsWith(workingDir) && Paths.get(workingDir.toString()).getParent() != null) {
      workingDir = Paths.get(workingDir.toString()).getParent()
      // Need to add the dots to represent that we've gone back a step up the path
      prefix += ".." + File.separator
    }

    prefix + new File(workingDir.toString())
      .toURI()
      .relativize(new File(path.toString()).toURI())
      .getPath()
      .toString()
  }

  // Generate a new TDML file.
  // Paths given to this function should be absolute as they will be converted to relative paths
  //
  // infosetPath:     Path to the infoset
  // schemaPath:      Path to the DFDL Schema
  // dataPath:        Path to the data file
  // tdmlName:        Name of the DFDL operation
  // tdmlDescription: Description for the DFDL operation
  // tdmlPath:        Path to the TDML file
  def generate(
      infosetPath: Path,
      schemaPath: Path,
      dataPath: Path,
      tdmlName: String,
      tdmlDescription: String,
      tdmlPath: String
  ): Unit =
    TDML.generate(
      convertToRelativePath(infosetPath, tdmlPath),
      convertToRelativePath(schemaPath, tdmlPath),
      convertToRelativePath(dataPath, tdmlPath),
      tdmlName,
      tdmlDescription,
      tdmlPath
    )

  // Generate a new TDML file.
  // There is a suiteName attribute in the root element (TestSuite) of the document. This is set to $tdmlName
  // Paths given to this function should be relative as it should be expected for the TDML files to be shared on the mailing list
  //
  // infosetPath:     Path to the infoset
  // schemaPath:      Path to the DFDL Schema
  // dataPath:        Path to the data file
  // tdmlName:        Name of the DFDL operation
  // tdmlDescription: Description for the DFDL operation
  // tdmlPath:        Path to the TDML file
  //
  // There is a suiteName attribute in the root element of the document. This is set to tdmlName
  def generate(
      infosetPath: String,
      schemaPath: String,
      dataPath: String,
      tdmlName: String,
      tdmlDescription: String,
      tdmlPath: String
  ): Unit = {
    val factory = new ObjectFactory()

    val testSuite = factory.createTestSuite()
    testSuite.setSuiteName(tdmlName)
    testSuite.setDefaultRoundTrip(RoundTripType.ONE_PASS)
    testSuite
      .getTutorialOrParserTestCaseOrDefineSchema()
      .add(createTestCase(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription))

    val marshaller = JAXBContext.newInstance(classOf[TestSuite]).createMarshaller()
    marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true)
    marshaller.marshal(testSuite, new java.io.File(tdmlPath))
  }

  // Append a new test case to an existing TDML file.
  // Paths given to this function should be absolute as they will be converted to relative paths
  //
  // infosetPath:     Path to the infoset
  // schemaPath:      Path to the DFDL Schema
  // dataPath:        Path to the data file
  // tdmlName:        Name of the DFDL operation
  // tdmlDescription: Description for the DFDL operation
  // tdmlPath:        Path to the TDML file
  def append(
      infosetPath: Path,
      schemaPath: Path,
      dataPath: Path,
      tdmlName: String,
      tdmlDescription: String,
      tdmlPath: String
  ): Unit =
    append(
      convertToRelativePath(infosetPath, tdmlPath),
      convertToRelativePath(schemaPath, tdmlPath),
      convertToRelativePath(dataPath, tdmlPath),
      tdmlName,
      tdmlDescription,
      tdmlPath
    )

  // Append a new test case to an existing TDML file.
  // Paths given to this function should be relative as it should be expected for the TDML files to be shared on the mailing list
  //
  // infosetPath:     Path to the infoset
  // schemaPath:      Path to the DFDL Schema
  // dataPath:        Path to the data file
  // tdmlName:        Name of the DFDL operation
  // tdmlDescription: Description for the DFDL operation
  // tdmlPath:        Path to the TDML file
  def append(
      infosetPath: String,
      schemaPath: String,
      dataPath: String,
      tdmlName: String,
      tdmlDescription: String,
      tdmlPath: String
  ): Unit = {

    val testSuite = JAXBContext
      .newInstance(classOf[TestSuite])
      .createUnmarshaller()
      .unmarshal(new File(tdmlPath))
      .asInstanceOf[TestSuite]

    testSuite
      .getTutorialOrParserTestCaseOrDefineSchema()
      .add(createTestCase(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription))

    val marshaller = JAXBContext.newInstance(classOf[TestSuite]).createMarshaller()
    marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true)
    marshaller.marshal(testSuite, new java.io.File(tdmlPath))
  }

  // Find the parameters needed to execute a DFDL parse based on the given TDML Parameters
  //
  // tdmlName:        Test case name to run
  // tdmlDescription: Description of test case to run
  // tdmlPath:        File path of TDML file to extract test case from
  //
  // Returns a tuple containing the following (Path to DFDL Schema, Path to Data File)
  // All paths returned could be either relative or absolute - it depends on what exists in the TDML file
  def execute(tdmlName: String, tdmlDescription: String, tdmlPath: String): Option[(Path, Path)] = {
    val basePath = Paths.get(tdmlPath).toAbsolutePath().getParent()

    val testCaseList = JAXBContext
      .newInstance(classOf[TestSuite])
      .createUnmarshaller()
      .unmarshal(new File(tdmlPath))
      .asInstanceOf[TestSuite]
      .getTutorialOrParserTestCaseOrDefineSchema()
      .asScala
      .toList

    testCaseList.collectFirst {
      case (ptc: ParserTestCaseType) if ptc.getName() == tdmlName && ptc.getDescription() == tdmlDescription =>
        ptc.getTutorialOrDocumentOrInfoset().asScala.collectFirst { case doc: DocumentType =>
          // The right part of the tuple only takes the first DocumentPart inside the Document.
          // In the case that there are more than one, any extras will be ignored.
          val schemaPath = Paths.get(basePath + File.separator + ptc.getModel()).normalize()
          val dataPath = Paths
            .get(
              basePath + File.separator + doc
                .getContent()
                .get(1)
                .asInstanceOf[JAXBElement[DocumentPartType]]
                .getValue()
                .getValue()
            )
            .normalize()
          (schemaPath, dataPath)
        }
    }.flatten
  }
}
