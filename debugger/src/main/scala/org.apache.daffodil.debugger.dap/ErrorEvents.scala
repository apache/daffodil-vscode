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

package org.apache.daffodil.debugger.dap

import com.microsoft.java.debug.core.protocol.Events.DebugEvent

/** Case classes for errors that we want to relay back to the extension */
object ErrorEvents {
  case object UnexpectedError extends DebugEvent("daffodil.error.unexpected")
  case object UnhandledRequest extends DebugEvent("daffodil.error.requestunhandled")
  case object LaunchArgsParseError extends DebugEvent("daffodil.error.launchargparse")
  case object RequestError extends DebugEvent("daffodil.error.request")
  case object SourceError extends DebugEvent("daffodil.error.source")
}
