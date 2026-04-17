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

import * as fs from 'fs'
import path from 'path'

function ensureParentDirectory(filePath: string): void {
  const dirname = path.dirname(filePath)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
}

function buildLogbackConfig(logFile: string, logLevel: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${logFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${logLevel.toUpperCase()}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
}

export function writeLogbackConfigFile(
  logbackConfigFile: string,
  logFile: string,
  logLevel: string = 'INFO'
): string {
  ensureParentDirectory(logFile)
  ensureParentDirectory(logbackConfigFile)
  fs.writeFileSync(logbackConfigFile, buildLogbackConfig(logFile, logLevel))
  return logbackConfigFile
}
