// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const fileMetricsState = $state({
  name: '',
  type: '',
  language: '',
  diskSize: 0,
  computedSize: 0,
  changeCount: 0,
  undoCount: 0,
})

const isRegularSizedFileState = $derived(fileMetricsState.computedSize >= 2)

const canUndoState = $derived(fileMetricsState.changeCount > 0)

const canRedoState = $derived(fileMetricsState.undoCount > 0)

const canRevertState = $derived(
  fileMetricsState.undoCount + fileMetricsState.changeCount > 0
)

const saveableState = $derived(fileMetricsState.changeCount > 0)

export const isRegularSizedFile = () => isRegularSizedFileState

export const canUndo = () => canUndoState

export const canRedo = () => canRedoState

export const canRevert = () => canRevertState

export const saveable = () => saveableState
