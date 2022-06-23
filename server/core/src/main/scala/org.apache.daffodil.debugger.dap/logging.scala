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

import cats.Show
import com.microsoft.java.debug.core.protocol._
import com.microsoft.java.debug.core.protocol.Messages._
import com.microsoft.java.debug.core.protocol.Events._

object logging {
  implicit val requestShow: Show[Request] =
    request => s"#${request.seq} ${request.command} ${request.arguments}"

  // Note/warning: all response bodies *should* be translatable to JSON, so we decode them for logging.
  implicit val responseShow: Show[Response] = {
    case response if response.command == "source" =>
      s"#${response.request_seq} ${response.command} ${if (response.success) "success"
        else "failure"} <response body elided>"
    case response =>
      s"#${response.request_seq} ${response.command} ${if (response.success) "success"
        else "failure"} ${JsonUtils
          .toJson(response.body)}"
  }

  implicit val eventShow: Show[DebugEvent] = {
    case event: Events.StoppedEvent => s"${event.`type`} ${event.reason}"
    case event: Events.ThreadEvent  => s"${event.`type`} ${event.reason}"
    case event: DAPodil.LoadedSourceEvent =>
      s"${event.`type`} ${event.reason} ${JsonUtils.toJson(event.source)}"
    case event => s"${event.`type`}"
  }
}
