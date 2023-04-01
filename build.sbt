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
    version := {
      val versionRegex = raw""""version": "(.*)",""".r
      versionRegex.findFirstMatchIn(packageJsonStr) match {
        case Some(m) => m.group(1)
        case None    => sys.error("Missing version specifier in package.json")
      }
    },
    libraryDependencies ++= Seq(
      "org.apache.daffodil" %% "daffodil-sapi" % daffodilVer,
      "org.apache.daffodil" %% "daffodil-runtime1" % daffodilVer
    ),
    dependencyOverrides ++= Seq(
      "org.apache.commons" % "commons-lang3" % "3.12.0"
    ),
    fork := true, // needed to pass javaOptions to tests, for example
    licenses += ("Apache-2.0", new URL("https://www.apache.org/licenses/LICENSE-2.0.txt")),
    maintainer := "Apache Daffodil <dev@daffodil.apache.org>",
    organization := "org.apache.daffodil",
    // scala-steward:off
    scalaVersion := "2.12.15",
    // scala-steward:on
    scalacOptions ++= Seq("-Ypartial-unification"),
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
      "co.fs2" %% "fs2-io" % "3.9.1",
      "com.monovore" %% "decline-effect" % "2.4.1",
      "org.typelevel" %% "log4cats-slf4j" % "2.6.0",
      "org.scalameta" %% "munit" % "0.7.29" % Test
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
      "com.sun.xml.bind" % "jaxb-impl" % "2.2.11",
      "javax.activation" % "activation" % "1.1.1",
      "org.apache.daffodil" %% "daffodil-lib" % daffodilVer % Test,
      "org.glassfish.jaxb" % "jaxb-xjc" % "2.2.11"
    ),
    Test / javaOptions ++= extraJvmOptions, // tests use JAXB at runtime
    xjcCommandLine += "-nv",
    xjcCommandLine += "-p",
    xjcCommandLine += "org.apache.daffodil.tdml",
    xjcBindings += "debugger/src/main/resources/bindings.xjb",
    xjcJvmOpts ++= extraJvmOptions,
    xjcLibs := Seq(
      "org.glassfish.jaxb" % "jaxb-xjc" % "2.2.11",
      "com.sun.xml.bind" % "jaxb-impl" % "2.2.11",
      "javax.activation" % "activation" % "1.1.1"
    ),
    Compile / xjc / sources := Seq(
      file(
        Seq(resourceManaged.value, "xsd")
          .mkString(java.io.File.separator)
      )
    ),
    Compile / doc / sources := Seq(file("")),
    Compile / resourceGenerators += Def.task {
      // This is going to be the directory that contains the DFDL schema files. We extract the files from the jar to this directory,
      //   but the directory structure is maintained. The directory structure will be flattened so that the DFDL schema files are
      //   directly contained by this directory.
      //
      // Note that baseDirectory is ${workspaceDir}/server/sbtXjc/
      lazy val xsdDir = Seq(resourceManaged.value, "xsd").mkString(java.io.File.separator)

      // Get the daffodil-lib jar from the dependencies.
      val jarsToExtract: Seq[File] =
        managedJars(Test, Set[String]("jar"), update.value) map { _.data } filter { _.getName.contains("daffodil-lib") }

      // Extract the DFDL schema files from the daffodil-lib jar. We ignore the XMLSchema.xsd file because it contains a DTD, and
      //   the JAXB process is not happy with DTDs without a particular setting being set. Consequently, this file is not strictly
      //   necessary for the generation of Java classes.
      jarsToExtract foreach { jar =>
        IO.unzip(
          jar,
          new File(xsdDir),
          NameFilter.fnToNameFilter(f =>
            !f.endsWith("XMLSchema.xsd") && f.endsWith(".xsd") && f.startsWith(
              Seq("org", "apache", "daffodil", "xsd").mkString("/")
            )
          )
        )
      }

      // Get File objects for each DFDL schema file that was extracted.
      new File(Seq(xsdDir, "org", "apache", "daffodil", "xsd").mkString("/")).listFiles().toSeq
    }.taskValue
  )
