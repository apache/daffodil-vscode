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

import org.apache.daffodil.tdml.{DocumentPartType, DocumentType, InfosetType, TDML}

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.xml.bind.JAXBElement
import scala.collection.mutable.HashSet
import scala.xml.Elem
import scala.xml.XML
import java.nio.charset.StandardCharsets

class TDMLSuite extends munit.FunSuite {
  val basePath = Paths.get(".").toAbsolutePath()
  val basePathStr = ""
  val infosetPath = Paths.get("./debugger/src/test/data/emptyInfoset.xml").toAbsolutePath()
  val schemaPath = Paths.get("./debugger/src/test/data/emptySchema.xml").toAbsolutePath()
  val dataPath = Paths.get("./debugger/src/test/data/emptyData.xml").toAbsolutePath()
  val notInfosetPath = Paths.get("./debugger/src/test/data/notInfoset.xml").toAbsolutePath()
  val tdmlName = "TestTDMLName"
  val tdmlDescription = "Test TDML Description"
  val tdmlPath = Paths.get("./testTDML.tdml").toAbsolutePath()
  val expectedNSHashSet = HashSet[String](
    "http://www.ibm.com/xmlns/dfdl/testData"
  )
  val tdmlSingleTestCase = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns1:testSuite xmlns:ns1="http://www.ibm.com/xmlns/dfdl/testData" suiteName="TestTDMLName" defaultRoundTrip="onePass">
    <ns1:parserTestCase name="TestTDMLName" root="file" model="debugger/src/test/data/emptySchema.xml" roundTrip="onePass" description="Test TDML Description">
        <ns1:document>
            <ns1:documentPart type="file">debugger/src/test/data/emptyData.xml</ns1:documentPart>
        </ns1:document>
        <ns1:infoset>
            <ns1:dfdlInfoset type="file">debugger/src/test/data/emptyInfoset.xml</ns1:dfdlInfoset>
        </ns1:infoset>
    </ns1:parserTestCase>
</ns1:testSuite>"""
  val tdmlDoubleTestCase = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns1:testSuite xmlns:ns1="http://www.ibm.com/xmlns/dfdl/testData" suiteName="TestTDMLName" defaultRoundTrip="onePass">
    <ns1:parserTestCase name="TestTDMLName" root="file" model="debugger/src/test/data/emptySchema.xml" roundTrip="onePass" description="Test TDML Description">
        <ns1:document>
            <ns1:documentPart type="file">debugger/src/test/data/emptyData.xml</ns1:documentPart>
        </ns1:document>
        <ns1:infoset>
            <ns1:dfdlInfoset type="file">debugger/src/test/data/emptyInfoset.xml</ns1:dfdlInfoset>
        </ns1:infoset>
    </ns1:parserTestCase>
    <ns1:parserTestCase name="TestTDMLName" root="file" model="debugger/src/test/data/emptySchema.xml" roundTrip="onePass" description="Test TDML Description">
        <ns1:document>
            <ns1:documentPart type="file">debugger/src/test/data/emptyData.xml</ns1:documentPart>
        </ns1:document>
        <ns1:infoset>
            <ns1:dfdlInfoset type="file">debugger/src/test/data/emptyInfoset.xml</ns1:dfdlInfoset>
        </ns1:infoset>
    </ns1:parserTestCase>
</ns1:testSuite>"""
  val tdmlSingleTestCaseXml = XML.loadString(tdmlSingleTestCase)
  val tdmlDoubleTestCaseXml = XML.loadString(tdmlDoubleTestCase)

  override def afterEach(context: AfterEach): Unit = { val _ = tdmlPath.toFile.delete() }

  test("Test Generate") {
    TDML.generate(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())

    val content = readString(tdmlPath)
    val contentXml = XML.loadString(content)

    // Validate the namespaces as well. If they ever get placed out of order, this test can act as a canary.
    assertEquals(getNamespaces(contentXml), expectedNSHashSet)
    assertEquals(contentXml, tdmlSingleTestCaseXml)
  }

  test(name = "Negative Generate") {
    TDML.generate(notInfosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())

    val content = readString(tdmlPath)
    val contentXml = XML.loadString(content)

    // Validate that this does fail if the input data is bad, but namespaces should still be okay
    assertEquals(getNamespaces(contentXml), expectedNSHashSet)
    assertNotEquals(contentXml, tdmlSingleTestCaseXml)
  }

  test("Test Append") {
    TDML.generate(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())
    TDML.append(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())

    val content = readString(tdmlPath)
    val contentXml = XML.loadString(content)

    // Validate the namespaces as well. If they ever get placed out of order, this test can act as a canary.
    assertEquals(getNamespaces(contentXml), expectedNSHashSet)
    assertEquals(contentXml, tdmlDoubleTestCaseXml)
  }

  test("Negative Append") {
    TDML.generate(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())
    TDML.append(notInfosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())

    val content = readString(tdmlPath)
    val contentXml = XML.loadString(content)

    // Validate the namespaces as well. If they ever get placed out of order, this test can act as a canary.
    assertEquals(getNamespaces(contentXml), expectedNSHashSet)
    assertNotEquals(contentXml, tdmlDoubleTestCaseXml)
  }

  test("Test Execute") {

    var schemaPathExecute = Paths.get("/debugger/src/test/data/emptySchema.xml")
    var dataPathExecute = Paths.get("/debugger/src/test/data/emptyData.xml")

    if (System.getProperty("os.name").toLowerCase.startsWith("win") == true) {
      schemaPathExecute = schemaPath
      dataPathExecute = dataPath
    }
    TDML.generate(infosetPath, schemaPath, dataPath, tdmlName, tdmlDescription, tdmlPath.toString())
    val executePaths = TDML.execute(tdmlName, tdmlDescription, tdmlPath.toAbsolutePath().toString())

    assertEquals(executePaths, Option[(Path, Path)]((schemaPathExecute.normalize(), dataPathExecute.normalize())))
  }

  test("Test convertToRelativePath") {
    val relativePath = TDML.convertToRelativePath(basePath, tdmlPath.toString())

    assertEquals(relativePath, basePathStr)
  }

  test("Test createTestCase") {
    val testCase =
      TDML.createTestCase(infosetPath.toString(), schemaPath.toString(), dataPath.toString(), tdmlName, tdmlDescription)

    assertEquals(testCase.getDescription.toString(), tdmlDescription)
    assertEquals(testCase.getName.toString(), tdmlName)
    assertEquals(testCase.getModel.toString(), schemaPath.toString())
    assertEquals(
      testCase.getTutorialOrDocumentOrInfoset
        .get(1)
        .asInstanceOf[InfosetType]
        .getDfdlInfoset
        .getContent()
        .get(0)
        .toString(),
      infosetPath.toString()
    )
    assertEquals(
      testCase.getTutorialOrDocumentOrInfoset
        .get(0)
        .asInstanceOf[DocumentType]
        .getContent
        .get(0)
        .asInstanceOf[JAXBElement[DocumentPartType]]
        .getValue()
        .getValue(),
      dataPath.toString()
    )

  }

  def getNamespaces(root: Elem): HashSet[String] = {
    val contentSet = HashSet[String]()
    val namespaces = root.scope.toString().split(" ")
    // The list contains an empty element. We are filtering for namespaces, which will always contain an '='
    namespaces.filter(_.contains("=")).foreach { ns =>
      val nsValue = ns.split("=")(1)
      contentSet += (nsValue.substring(1, nsValue.length() - 1))
    }

    contentSet
  }

  // Files.readString doesn't exist until Java 11. This should work for all versions of Java.
  def readString(path: Path): String = {
    val bytes = Files.readAllBytes(path)
    new String(bytes, StandardCharsets.UTF_8)
  }
}
