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
    /** Can't add license headers in JSON files.
      * Adding a license attribute breaks things in some of these fiels as well.
      */
    file("language/dfdl.json"),
    file("language/syntax.json"),
    file("language/syntaxes/dfdl.tmLanguage.json"),
    file("package.json"),
    file(".prettierrc"),
    // ignore images - daffiodil.ico
    file("images/daffodil.ico"),
    // yarn and rpm generated files
    file("yarn.lock"),
    file("package-lock.json")
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
