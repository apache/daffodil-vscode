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

export type Radixes = 'Hexadecimal' | 'Decimal' | 'Octal' | 'Binary'

export type RadixValues = 16 | 10 | 8 | 2

export type BytesPerRow = 16 | 8 | 24

export enum EditByteModes {
  Single = 'single',
  Multiple = 'multiple',
}
export type AvailableStrEncodings =
  | 'hex'
  | 'binary'
  | 'ascii'
  | 'latin1'
  | 'utf-8'
  | 'utf-16'

export enum EditActionRestrictions {
  None,
  OverwriteOnly,
}

export type EditAction = { name: string; value: EditActionRestrictions }
