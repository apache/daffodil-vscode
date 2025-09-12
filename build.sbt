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

import com.github.retronym.sbtxjc.SbtXjcPlugin
import Classpaths.managedJars

import java.io.ByteArrayOutputStream
import java.io.ByteArrayInputStream
import javax.xml.transform.TransformerFactory
import javax.xml.transform.stream.StreamResult
import javax.xml.transform.stream.StreamSource

//Fixes build issues on java11+
run / fork := true
Global / lintUnusedKeysOnLoad := false
val packageJsonStr = scala.io.Source.fromFile("package.json").mkString

val daffodilVer = {
  val daffodilVerRegex = raw""""daffodilVersion": "(.*)",""".r
  daffodilVerRegex.findFirstMatchIn(packageJsonStr) match {
    case Some(m) => m.toString.split(":")(1).trim.replaceAll("\"", "").replaceAll(",", "")
    case None    => sys.error("Missing daffodilVersion specifier in package.json")
  }
}

lazy val commonSettings =
  Seq(
    version := IO.read((ThisBuild / baseDirectory).value / "VERSION").trim,
    libraryDependencies ++= Seq(
      "org.apache.daffodil" %% "daffodil-sapi" % daffodilVer,
      "org.apache.daffodil" %% "daffodil-runtime1" % daffodilVer
    ),
    dependencyOverrides ++= Seq(
      "org.apache.commons" % "commons-lang3" % "3.18.0"
    ),
    fork := true, // needed to pass javaOptions to tests, for example
    licenses += ("Apache-2.0", new URL("https://www.apache.org/licenses/LICENSE-2.0.txt")),
    maintainer := "Apache Daffodil <dev@daffodil.apache.org>",
    organization := "org.apache.daffodil",
    // scala-steward:off
    scalaVersion := "2.13.16",
    // scala-steward:on
    // remove the -Xcheckinit option added by the sbt tpoletcat plugin. This
    // option leads to non-reproducible builds
    scalacOptions --= Seq("-Xcheckinit"),
    startYear := Some(2021)
  )

lazy val ratSettings = Seq(
  ratLicenses := Seq(
    ("MIT  ", Rat.MIT_LICENSE_NAME, Rat.MIT_LICENSE_TEXT_MICROSOFT),
    ("CC0  ", Rat.CREATIVE_COMMONS_LICENSE_NAME, Rat.CREATIVE_COMMONS_LICENSE_TEXT),
    ("MIT  ", Rat.MIT_LICENSE_NAME, Rat.MIT_LICENSE_TEXT_DELTAXML)
  ),
  ratLicenseFamilies := Seq(
    Rat.MIT_LICENSE_NAME,
    Rat.CREATIVE_COMMONS_LICENSE_NAME
  ),
  ratExcludes := Rat.excludes,
  ratFailBinaries := true
)

lazy val `daffodil-debugger` = project
  .in(file("."))
  .settings(commonSettings, ratSettings)
  .settings(publish / skip := true)
  .dependsOn(debugger)
  .aggregate(debugger)

lazy val debugger = project
  .in(file("debugger"))
  .enablePlugins(BuildInfoPlugin, JavaAppPackaging, UniversalPlugin, ClasspathJarPlugin, SbtXjcPlugin)
  .settings(commonSettings)
  .settings(xjcSettings)
  .settings(
    name := "daffodil-debugger",
    libraryDependencies ++= Seq(
      /* NOTE: To support Java 8:
       *   logback-classic can not go above version 1.2.11.
       *   com.microsoft.java.debug.core can not go above version 0.34.0.
       */
      // scala-steward:off
      "ch.qos.logback" % "logback-classic" % "1.2.11",
      "com.microsoft.java" % "com.microsoft.java.debug.core" % "0.34.0",
      // scala-steward:on
      "co.fs2" %% "fs2-io" % "3.12.0",
      "com.monovore" %% "decline-effect" % "2.5.0",
      "org.typelevel" %% "log4cats-slf4j" % "2.7.1",
      "org.scalameta" %% "munit" % "1.1.1" % Test,
      "org.fusesource.jansi" % "jansi" % "1.18"
    ),
    buildInfoKeys := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion, "daffodilVersion" -> daffodilVer),
    buildInfoPackage := "org.apache.daffodil.debugger.dap",
    packageName := s"${name.value}-$daffodilVer"
  )

/* Workaround: certain reflection (used by JAXB) isn't allowed by default in JDK 17:
 * https://docs.oracle.com/en/java/javase/17/migrate/migrating-jdk-8-later-jdk-releases.html#GUID-7BB28E4D-99B3-4078-BDC4-FC24180CE82B
 *
 * While we can handle this JVM quirk at build time, at runtime we won't know
 * a user's JVM version. We'll provide documentation and an extension setting
 * to add these flags to the extension-launched debugger backend.
 */
lazy val extraJvmOptions: Seq[String] =
  if (scala.util.Properties.isJavaAtLeast("17"))
    Seq(
      "--add-opens",
      "java.base/java.lang=ALL-UNNAMED"
    )
  else Seq()

lazy val xjcSettings =
  Seq(
    libraryDependencies ++= Seq(
      "com.sun.xml.bind" % "jaxb-impl" % "2.3.9",
      "javax.activation" % "activation" % "1.1.1",
      "org.apache.daffodil" %% "daffodil-lib" % daffodilVer % Test,
      "org.glassfish.jaxb" % "jaxb-xjc" % "2.3.9"
    ),
    Test / javaOptions ++= extraJvmOptions, // tests use JAXB at runtime
    xjcCommandLine += "-nv",
    xjcCommandLine += "-p",
    xjcCommandLine += "org.apache.daffodil.tdml",
    xjcCommandLine += "-no-header",
    xjcJvmOpts ++= extraJvmOptions,
    xjcLibs := Seq(
      "com.sun.xml.bind" % "jaxb-impl" % "2.3.9",
      "org.glassfish.jaxb" % "jaxb-xjc" % "2.3.9",
      "javax.activation" % "activation" % "1.1.1"
    ),
    Compile / doc / sources := Seq(file("")),
    Compile / xjc / sources := {
      val stream = (Compile / xjc / streams).value

      // We are going to extract XSD files from Daffodil jars needed by xjc to generate JAXB
      // classes
      lazy val xjcSourceDir = crossTarget.value / "xjc"

      // Get the daffodil-lib jar from the dependencies, this is the only jar we need to extract
      // files from
      val daffodilLibJar = managedJars(Test, Set[String]("jar"), update.value)
        .map(_.data)
        .find(_.getName.contains("daffodil-lib"))
        .get

      // cache the results of jar extraction so we don't keep extracting files (which would
      // trigger xjc again) everytime we compile.
      val cachedFun = FileFunction.cached(stream.cacheDirectory / "xjcSources") { _ =>
        // Extract the DFDL TDML schema file used for JAXB generation.
        IO.unzip(
          daffodilLibJar,
          xjcSourceDir,
          NameFilter.fnToNameFilter(f => f == "org/apache/daffodil/xsd/tdml.xsd")
        )

        // The TDML schema supports embedded DFDL schemas and configurations, and it references
        // the schema for DFDL schema when doing so. This DFDL schema is pretty complex, which
        // requires extra complexity like the need for an xjc bindings file and also hits edge
        // cases where xjc generates non-deterministic java code, leading to non-reproducible
        // builds.
        //
        // Fortunately, VS Code does not need embedded DFDL schemas or config converted to
        // specific objects, so we use XSLT to replace those parts of the schema with <any>
        // elements. This allows JAXB to read TDML files containing embedded DFDL schemas, but
        // they are just converted to generic XML Objects and avoids those complex edge cases.
        val tdmlFile = xjcSourceDir / "org" / "apache" / "daffodil" / "xsd" / "tdml.xsd"
        val tdmlXslt = """
          |<xsl:stylesheet
          |  xmlns:xs="http://www.w3.org/2001/XMLSchema"
          |  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
          |  <xsl:template match="@*|node()">
          |    <xsl:copy>
          |      <xsl:apply-templates select="@*|node()"/>
          |    </xsl:copy>
          |  </xsl:template>
          |  <xsl:template match="xs:complexType[@name='defineSchemaType']">
          |    <xs:complexType name='defineSchemaType'>
          |      <xs:sequence>
          |        <xs:any />
          |      </xs:sequence>
          |      <xs:anyAttribute />
          |    </xs:complexType>
          |  </xsl:template>
          |  <xsl:template match="xs:complexType[@name='defineConfigType']">
          |    <xs:complexType name='defineConfigType'>
          |      <xs:sequence>
          |        <xs:any />
          |      </xs:sequence>
          |      <xs:anyAttribute />
          |    </xs:complexType>
          |  </xsl:template>
          |</xsl:stylesheet>""".stripMargin
        val xslt = new StreamSource(new ByteArrayInputStream(tdmlXslt.getBytes))
        val input = new StreamSource(tdmlFile)
        val output = new ByteArrayOutputStream()
        val factory = TransformerFactory.newInstance()
        val transformer = factory.newTransformer(xslt);
        transformer.transform(input, new StreamResult(output))
        IO.write(tdmlFile, output.toByteArray())

        val xsdFiles = (xjcSourceDir ** "*.xsd").get
        xsdFiles.toSet
      }

      // only invalidate the cache if the daffodil lib jar changed and so there could be a
      // chance the tdml.xsd file has been updated
      cachedFun(Set(daffodilLibJar)).toSeq
    }
  )
