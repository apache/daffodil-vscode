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

package org.apache.daffodil.debugger

/** The dap package object allows other files inside of the package to be able to use specific classes and types without
  * directly importing them. This help us with the different versions of Daffodil where the classes have the same name
  * but have moved to different import paths.
  */

package object dap {
  type Debugger = org.apache.daffodil.runtime1.debugger.Debugger
  type Diagnostic = org.apache.daffodil.lib.api.Diagnostic
  type SDiagnostic = org.apache.daffodil.sapi.Diagnostic
  type InfosetOutputter = org.apache.daffodil.sapi.infoset.InfosetOutputter
  type DataProcessor = org.apache.daffodil.sapi.DataProcessor
}
