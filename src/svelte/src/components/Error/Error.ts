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

import type { Unsubscriber } from 'svelte/store'
/**
 * Enumeration of possible Error Components to render.
 *
 * ---
 *
 * `SYMBOL` - Displays as an error symbol with hoverable tooltip
 * error descriptions.
 *
 * `STRING` - Displays as a simple error message string
 */
export const enum ErrorComponentType {
  SYMBOL,
  STRING,
}

/**
 * Interface type for ErrorStore's _values data member.
 *
 * ---
 *
 * `errMessage`: ErrorStore subscribable field.
 *
 * `errType`: Type of Error Component rendering.
 */
export interface ErrorValues {
  errMessage: string
  errType: ErrorComponentType
}

/**
 * Custom ErrorStore that satisfies the Svelte Store contract to store
 * an ErrorValues type.
 *
 * ---
 *
 * `_subscribers`: Data member holding the current observer functions against
 * an ErrorStore object.
 *
 * `_values`: ErrorValues interfaced object with fields that makes up the contents
 * of and Error Component.
 */
export class ErrorStore {
  private _subscribers: Function[] = []
  private _values: ErrorValues

  constructor(errCompType: ErrorComponentType) {
    this._values = {
      errMessage: '',
      errType: errCompType,
    }
  }

  /**
   * Svelte Store Contract required subscribe function.
   *
   * @param fn Callback function with typeof ErrorValues::errMessage parameter
   * @returns Unsubscribe function as required by Svelte Store Contract
   */
  public subscribe(
    fn: (msg: typeof this._values.errMessage) => void
  ): Unsubscriber {
    fn('')
    this._subscribers.push(fn)
    return () => {
      this._subscribers.splice(this._subscribers.indexOf(fn), 1)
    }
  }

  /**
   * Svelte Store Contract required set function.
   *
   * Iterates over object's list of subscribers, invoking the subscriber's
   * function with `msg` as the argument.
   */
  public set(msg: typeof this._values.errMessage) {
    this._subscribers.forEach((fn) => {
      fn(msg)
    })
  }

  public update(fn: () => typeof this._values.errMessage): void {
    this.set(fn())
  }
  /**
   * Function for getting the appropriate innerHTML content according to the
   * object's ErrorComponentType.
   * @returns `string`: _values.errMessage for STRING | String.fromCharCode(9888)
   * for SYMBOL
   */
  public innerHTML(): string {
    return this._values.errType === ErrorComponentType.STRING
      ? this._values.errMessage
      : String.fromCharCode(9888)
  }
}
