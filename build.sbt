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

lazy val commonSettings =
  Seq(
    version := IO.read((ThisBuild / baseDirectory).value / "VERSION").trim,
    dependencyOverrides ++= Seq(
      "org.apache.commons" % "commons-lang3" % "3.18.0"
    ),
    fork := true, // needed to pass javaOptions to tests, for example
    licenses += ("Apache-2.0", new URL("https://www.apache.org/licenses/LICENSE-2.0.txt")),
    maintainer := "Apache Daffodil <dev@daffodil.apache.org>",
    organization := "org.apache.daffodil",
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
      "org.glassfish.jaxb" % "jaxb-xjc" % "4.0.6"
    ),
    Test / javaOptions ++= extraJvmOptions, // tests use JAXB at runtime
    xjcCommandLine += "-nv",
    xjcCommandLine += "-p",
    xjcCommandLine += "org.apache.daffodil.tdml",
    xjcCommandLine += "-no-header",
    xjcJvmOpts ++= extraJvmOptions,
    xjcLibs := Seq(
      "com.sun.xml.bind" % "jaxb-impl" % "2.3.9",
      "org.glassfish.jaxb" % "jaxb-xjc" % "4.0.6",
      "javax.activation" % "activation" % "1.1.1"
    ),
    Compile / doc / sources := Seq(file("")),
    Compile / xjc / sources := {
      val stream = (Compile / xjc / streams).value

      // We are going to extract XSD files from Daffodil jars needed by xjc to generate JAXB
      // classes
      lazy val xjcSourceDir = crossTarget.value / "xjc"

      // Get the daffodil-lib or daffodil-core jar from the dependencies, this is the only jar we need to extract
      // files from
      val daffodilJarWithTdmlXsd = managedJars(Test, Set[String]("jar"), update.value)
        .map(_.data)
        .find(_.getName.contains(getDaffodilJarName(scalaBinaryVersion.value)))
        .get

      // cache the results of jar extraction so we don't keep extracting files (which would
      // trigger xjc again) everytime we compile.
      val cachedFun = FileFunction.cached(stream.cacheDirectory / "xjcSources") { _ =>
        // Extract the DFDL TDML schema file used for JAXB generation.
        IO.unzip(
          daffodilJarWithTdmlXsd,
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
      cachedFun(Set(daffodilJarWithTdmlXsd)).toSeq
    }
  )

lazy val `daffodil-debugger` = project
  .in(file("."))
  .settings(commonSettings, ratSettings)
  .settings(publish / skip := true)
  .aggregate(debugger.projectRefs: _*)

/** Since using projectMatrix, there will be a debugger, debugger2_12 and debugger3 target. The debugger target is for
  * Daffodil 3.11.0 and Scala 2.13. The debugger2_12 target is for Daffodil 3.10.0 abd older and Scala 2.12. The
  * debugger3 target is for Daffodil 4.0.0 and newer and Scala 3. (only availabe when using JDK 17+)
  *
  * When running something like "sbt test" that will run all targets. To use a single target do one of: sbt
  * debugger/test OR sbt debugger2_12/test OR sbt debugger3/test. Based on which version of the debugger you are
  * targeting.
  */
lazy val debugger =
  (projectMatrix in (file("debugger")))
    .enablePlugins(BuildInfoPlugin, JavaAppPackaging, UniversalPlugin, ClasspathJarPlugin, SbtXjcPlugin)
    .settings(commonSettings)
    .settings(xjcSettings)
    .settings(
      name := "daffodil-debugger",
      scalacOptions ++= buildScalacOptions(scalaBinaryVersion.value),
      javacOptions ++= buildJavacOptions(scalaBinaryVersion.value),
      libraryDependencies ++= Seq(
        /* NOTE: To support Java 8:
         *  logback-classic can not go above version 1.2.11.
         *  com.microsoft.java.debug.core can not go above version 0.34.0.
         *  jansi can not go above version 1.18.
         */
        // scala-steward:off
        "ch.qos.logback" % "logback-classic" % "1.2.11",
        "com.microsoft.java" % "com.microsoft.java.debug.core" % "0.34.0",
        "org.fusesource.jansi" % "jansi" % "1.18",
        // scala-steward:on
        "co.fs2" %% "fs2-io" % "3.12.0",
        "com.monovore" %% "decline-effect" % "2.5.0",
        "org.typelevel" %% "log4cats-slf4j" % "2.7.1",
        "org.scalameta" %% "munit" % "1.1.1" % Test
      ),
      libraryDependencies ++= getPlatformSpecificLibraries(scalaBinaryVersion.value),
      buildInfoPackage := "org.apache.daffodil.debugger.dap",
      buildInfoKeys := Seq[BuildInfoKey](
        name,
        version,
        scalaVersion,
        sbtVersion
      ),
      packageName := s"${name.value}-${scalaBinaryVersion.value}"
    )
    .jvmPlatform(
      scalaVersions =
        Seq("2.12.20", "2.13.16") ++ (if (scala.util.Properties.isJavaAtLeast("17")) Seq("3.3.6") else Seq())
    )

def getPlatformSpecificLibraries(scalaBinaryVersion: String) =
  scalaBinaryVersion match {
    case "2.12" =>
      Seq(
        // scala-steward:off
        "org.apache.daffodil" %% "daffodil-sapi" % "3.10.0" % "provided,test",
        "org.apache.daffodil" %% "daffodil-runtime1" % "3.10.0" % "provided,test",
        "org.apache.daffodil" %% "daffodil-lib" % "3.10.0" % Test,
        // scala-steward:on
        "org.scala-lang.modules" %% "scala-collection-compat" % "2.14.0"
      )
    case "2.13" =>
      Seq(
        // scala-steward:off
        "org.apache.daffodil" %% "daffodil-sapi" % "3.11.0" % "provided,test",
        "org.apache.daffodil" %% "daffodil-runtime1" % "3.11.0" % "provided,test",
        "org.apache.daffodil" %% "daffodil-lib" % "3.11.0" % Test
        // scala-steward:on
      )
    case "3" =>
      Seq(
        "org.apache.daffodil" %% "daffodil-core" % "4.0.0" % "provided,test"
      )
  }

def getMinSupportedJavaVersion(scalaBinaryVersion: String): String =
  if (scalaBinaryVersion == "3") "17"
  else if (scala.util.Properties.isJavaAtLeast("21")) "11"
  else "8"

def buildJavacOptions(scalaBinaryVersion: String) = {
  val jdkCompat = getMinSupportedJavaVersion(scalaBinaryVersion)

  if (jdkCompat == "8")
    Seq("-source", jdkCompat, "-target", jdkCompat)
  else
    Seq("--release", jdkCompat)
}

def buildScalacOptions(scalaBinaryVersion: String) = {
  val jdkCompat = getMinSupportedJavaVersion(scalaBinaryVersion)

  val commonSettings = Seq(if (scalaBinaryVersion == "2.12") "-Ypartial-unification" else "")

  if (scalaBinaryVersion == "2.12" && jdkCompat == "8")
    commonSettings ++ Seq(s"--target:jvm-${jdkCompat}")
  else
    commonSettings ++ Seq("--release", jdkCompat)
}

def getDaffodilJarName(scalaBinaryVersion: String) =
  if (scalaBinaryVersion == "3") "daffodil-core"
  else "daffodil-lib"
