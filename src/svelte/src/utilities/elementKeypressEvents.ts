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
type ElementKeypressEventKey = 'Enter' | 'Delete'
const MappableKeys: { [k in ElementKeypressEventKey]: true } = {
  Enter: true,
  Delete: true,
}

type ElementKeypressEvent = {
  elementId: string
  run: (keyEvent: KeyboardEvent) => void
}

class ElementKeypressEventMap {
  // private events: Array<ElementKeypressEvent> = []
  private events: {
    [key in ElementKeypressEventKey]: Array<ElementKeypressEvent>
  } = {
    Delete: [],
    Enter: [],
  }

  public register(key: ElementKeypressEventKey, event: ElementKeypressEvent) {
    this.remove_and_replace(key, event)
  }

  public run(elementId: string, keyEvent: KeyboardEvent) {
    this.events[keyEvent.key].forEach((eventItem) => {
      if (eventItem.elementId === elementId) eventItem.run(keyEvent)
    })
  }

  private remove_and_replace(
    key: ElementKeypressEventKey,
    event: ElementKeypressEvent
  ) {
    const replaceIndex = this.events[key].findIndex((storedEvent) => {
      return storedEvent.elementId === event.elementId
    })

    replaceIndex >= 0
      ? (this.events[key][replaceIndex] = event)
      : this.events[key].push(event)
  }
}
export function key_is_mappable(eventKey: string): boolean {
  return MappableKeys[eventKey as ElementKeypressEventKey] === true
}

export let elementKeypressEventMap = new ElementKeypressEventMap()
