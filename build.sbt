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
    licenses += ("Apache-2.0", new URL("https://www.apache.org/licenses/LICENSE-2.0.txt")),
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
    ("CC0  ", Rat.CREATIVE_COMMONS_LICENSE_NAME, Rat.CREATIVE_COMMONS_LICENSE_TEXT)
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
  .dependsOn(core)
  .aggregate(core)

lazy val core = project
  .in(file("server/core"))
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
      "co.fs2" %% "fs2-io" % "3.2.14",
      "com.monovore" %% "decline-effect" % "2.3.1",
      "org.typelevel" %% "log4cats-slf4j" % "2.5.0",
      "org.scalameta" %% "munit" % "0.7.29" % Test
    ),
    buildInfoKeys := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion, "daffodilVersion" -> daffodilVer),
    buildInfoPackage := "org.apache.daffodil.debugger.dap",
    packageName := s"${name.value}-$daffodilVer"
  )

lazy val xjcSettings =
  Seq(
    libraryDependencies ++= Seq(
      "com.sun.xml.bind" % "jaxb-impl" % "2.2.11",
      "javax.activation" % "activation" % "1.1.1",
      "org.apache.daffodil" %% "daffodil-lib" % daffodilVer % Test,
      "org.glassfish.jaxb" % "jaxb-xjc" % "2.2.11"
    ),
    xjcCommandLine += "-nv",
    xjcCommandLine += "-p",
    xjcCommandLine += "org.apache.daffodil.tdml",
    xjcBindings += "server/core/src/main/resources/bindings.xjb",
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
      val resources =
        new File(Seq(xsdDir, "org", "apache", "daffodil", "xsd").mkString("/")).listFiles()

      // Flatten the extracted files so that the directory structure created by the extraction process is deleted
      resources.foreach { f: File => IO.move(f, new File(Seq(xsdDir, f.getName).mkString(java.io.File.separator))) }

      // Delete the directory structure created during extraction
      IO.delete(new File(Seq(xsdDir, "org").mkString(java.io.File.separator)))

      // The files have been moved, but the paths have not been updated. We need to point the File objects
      //   to the new file locations
      val moved_resources = resources map { f: File =>
        new File(Seq(xsdDir, f.getName).mkString(java.io.File.separator))
      }

      // Return a Seq[File] containing the created resources. This cast can't happen before this point because the
      //   foreach throws an error when the type of resources is a Seq[File] rather than an Array[File]
      moved_resources toSeq
    }.taskValue,
    Test / xjc / sources := (Compile / xjc / sources).value,
    Test / doc / sources := (Compile / doc / sources).value,
    Test / sourceGenerators := (Compile / sourceGenerators).value
  )
