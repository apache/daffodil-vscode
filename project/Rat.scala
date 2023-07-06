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

import sbt._

object Rat {

  lazy val excludes = Seq(
    // git files
    file(".git"),
    // metals generated directory
    file(".metal"),
    // vscode-test generated directory
    file(".vscode-test"),
    // generate version file from sbt
    file("src/version.ts"),
    /** Can't add license headers in JSON files. Adding a license attribute breaks things in some of these files as
      * well.
      */
    file("language/dfdl.json"),
    file("language/syntax.json"),
    file("language/syntaxes/dfdl.tmLanguage.json"),
    file("package.json"),
    file("svelte/package.json"),
    file(".prettierrc"),
    file("svelte/.prettierrc"),
    // ignore images - daffiodil.ico
    file("images/daffodil.ico"),
    // yarn and rpm generated files
    file("yarn.lock"),
    file("svelte/yarn.lock"),
    file("package-lock.json"),
    file("svelte/package-lock.json"),
    // files listing packages with no license or notice
    file("build/package/NOLICENSE"),
    file("build/package/NONOTICE"),
    file("src/tests/data/test.txt"),
    file("debugger/src/test/data/emptyData.xml"),
    file("debugger/src/test/data/emptyInfoset.xml"),
    file("debugger/src/test/data/notInfoset.xml"),
    file("debugger/src/test/data/emptySchema.dfdl.xsd")
  )

  lazy val MIT_LICENSE_NAME = "MIT License"

  lazy val MIT_LICENSE_TEXT_MICROSOFT =
    """
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License. See License.txt in the project root for license information.
"""

  lazy val CREATIVE_COMMONS_LICENSE_NAME = "Creative Commons CC0 1.0 Universal"

  lazy val CREATIVE_COMMONS_LICENSE_TEXT =
    """
This file is made available under the Creative Commons CC0 1.0 Universal
"""
}
