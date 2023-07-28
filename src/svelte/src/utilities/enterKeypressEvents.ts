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

type EnterKeypressEvent = {
  id: string
  run: () => void
}

class EnterKeypressEvents {
  private events: Array<EnterKeypressEvent> = []

  public register(event: EnterKeypressEvent) {
    this.remove(event.id)
    this.events.push(event)
  }

  public run(elementId: string) {
    this.events.forEach((eventItem) => {
      if (eventItem.id === elementId) eventItem.run()
    })
  }

  private remove(eventId: string) {
    this.events = this.events.filter((event) => {
      return event.id === eventId
    })
  }
}

export let enterKeypressEvents = new EnterKeypressEvents()
