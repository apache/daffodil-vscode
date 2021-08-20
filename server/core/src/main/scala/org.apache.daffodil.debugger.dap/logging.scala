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
      s"#${response.request_seq} ${response.command} ${if (response.success) "success" else "failure"} <response body elided>"
    case response =>
      s"#${response.request_seq} ${response.command} ${if (response.success) "success" else "failure"} ${JsonUtils
        .toJson(response.body)}"
  }

  implicit val eventShow: Show[DebugEvent] = {
    case event: Events.StoppedEvent => s"${event.`type`} ${event.reason}"
    case event: Events.ThreadEvent  => s"${event.`type`} ${event.reason}"
    case event: DAPodil.LoadedSourceEvent => s"${event.`type`} ${event.reason} ${JsonUtils.toJson(event.source)}"
    case event                      => s"${event.`type`}"
  }
}
