<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<script lang="ts">
  import './globalStyles.css'
  import {
    bytesPerRow,
    displayRadix,
    editedDataSegment,
    editMode,
    editorEncoding,
    editorSelection,
    focusedViewportId,
    seekOffset,
    originalDataSegment,
    requestable,
    selectionDataStore,
    selectionSize,
    viewportNumLinesDisplayed,
    dataFeedLineTop,
    SelectionData_t,
    dataFeedAwaitRefresh,
    viewport,
    searchQuery,
    regularSizedFile,
  } from '../stores'
  import {
    CSSThemeClass,
    UIThemeCSSClass,
    darkUITheme,
  } from '../utilities/colorScheme'
  import { MessageCommand } from '../utilities/message'
  import { vscode } from '../utilities/vscode'
  import Header from './Header/Header.svelte'
  import Main from './Main.svelte'
  import {
    EditByteModes,
    VIEWPORT_SCROLL_INCREMENT,
    type BytesPerRow,
  } from '../stores/configuration'
  import ServerMetrics from './ServerMetrics/ServerMetrics.svelte'
  import {
    elementKeypressEventMap,
    key_is_mappable,
  } from '../utilities/elementKeypressEvents'
  import type {
    EditEvent,
    ViewportData_t,
  } from './DataDisplays/CustomByteDisplay/BinaryData'
  import { byte_count_divisible_offset } from '../utilities/display'
  import { clearSearchResultsHighlights } from '../utilities/highlights'

  $: $UIThemeCSSClass = $darkUITheme ? CSSThemeClass.Dark : CSSThemeClass.Light

  function requestEditedData() {
    if ($requestable) {
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          selectionToFileOffset: $selectionDataStore.startOffset,
          editedContent: $editorSelection,
          viewport: $focusedViewportId,
          selectionSize: $selectionSize,
          encoding: $editorEncoding,
          radix: $displayRadix,
          editMode: $editMode,
        },
      })
    }
  }

  function offset_to_viewport_line_number(
    offset: number,
    bytesPerRow: BytesPerRow,
    viewportStartOffset: number = $viewport.fileOffset
  ): number {
    const nearestBPRdivisibleOffset = byte_count_divisible_offset(
      offset - viewportStartOffset,
      bytesPerRow
    )
    const offsetLineNumInViewport = nearestBPRdivisibleOffset / bytesPerRow
    return offsetLineNumInViewport
  }

  function fetchable_content(offset: number): boolean {
    return offset > $viewport.fileOffset
      ? $viewport.bytesLeft > 0
      : $viewport.fileOffset > 0
  }

  function should_fetch_new_viewoprt(offset: number) {
    const lowerBound = viewport.lowerFetchBoundary()
    const upperBound = viewport.upperFetchBoundary($bytesPerRow)
    const fetchableContent = fetchable_content(offset)
    if (!fetchableContent) return false

    const boundaryTripped = offset < lowerBound || offset > upperBound

    return boundaryTripped
  }

  function seek(offsetArg?: number) {
    if (!offsetArg) offsetArg = $seekOffset

    const shouldFetchData = should_fetch_new_viewoprt(offsetArg)

    if (!shouldFetchData) {
      $dataFeedLineTop = Math.min(
        viewport.lineTopMax($bytesPerRow),
        offset_to_viewport_line_number(offsetArg, $bytesPerRow)
      )
      return
    }

    $dataFeedAwaitRefresh = true

    offsetArg = byte_count_divisible_offset(offsetArg, $bytesPerRow)
    const fetchOffset = Math.max(0, offsetArg - VIEWPORT_SCROLL_INCREMENT)

    $dataFeedLineTop = offset_to_viewport_line_number(
      offsetArg,
      $bytesPerRow,
      fetchOffset
    )

    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: fetchOffset,
        bytesPerRow: $bytesPerRow,
        numLinesDisplayed: $viewportNumLinesDisplayed,
      },
    })
    clearDataDisplays()
  }

  function seekEventHandler(_: CustomEvent) {
    seek($seekOffset)
  }

  function traversalEventHandler(navigationEvent: CustomEvent) {
    const navigationData = navigationEvent.detail
    $dataFeedAwaitRefresh = true

    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: navigationData.nextViewportOffset,
        bytesPerRow: $bytesPerRow,
      },
    })

    $dataFeedLineTop = navigationData.lineTopOnRefresh
    clearDataDisplays()
  }

  function handleEditorEvent(_: Event) {
    if ($regularSizedFile && $selectionSize < 0) {
      clearDataDisplays()
      return
    }
    if (!$regularSizedFile && $editorSelection.length == 0) return

    requestEditedData()
  }

  function custom_apply_changes(event: CustomEvent<EditEvent>) {
    const action = event.detail.action

    let editedData: Uint8Array
    let originalData = $originalDataSegment
    let editedOffset = $regularSizedFile
      ? $selectionDataStore.startOffset + $viewport.fileOffset
      : 0

    // noinspection FallThroughInSwitchStatementJS
    switch (action) {
      case 'insert-after':
        ++editedOffset
      // intentional fallthrough
      case 'insert-before':
        originalData = new Uint8Array(0)
      case 'byte-input':
        editedData = $editedDataSegment.subarray(0, 1)
        break
      case 'insert-replace':
        editedData =
          !$regularSizedFile && $editorSelection.length == 0
            ? new Uint8Array(0)
            : $editedDataSegment
        break
      case 'delete':
        editedData = new Uint8Array(0)
        break
    }

    vscode.postMessage({
      command: MessageCommand.applyChanges,
      data: {
        offset: editedOffset,
        originalSegment: originalData,
        editedSegment: editedData,
      },
    })
    clearDataDisplays()
    clearQueryableData()
  }

  function undo() {
    vscode.postMessage({
      command: MessageCommand.undoChange,
    })
  }

  function redo() {
    vscode.postMessage({
      command: MessageCommand.redoChange,
    })
  }

  function clearChangeStack() {
    vscode.postMessage({
      command: MessageCommand.clearChanges,
    })
  }

  function clearDataDisplays() {
    $selectionDataStore = new SelectionData_t()
    $editorSelection = ''
    $editedDataSegment = new Uint8Array(0)
  }

  function clearQueryableData() {
    searchQuery.clear()
    clearSearchResultsHighlights()
  }

  function handleKeyBind(event: Event) {
    const kbdEvent = event as KeyboardEvent
    if (key_is_mappable(kbdEvent.key)) {
      elementKeypressEventMap.run(document.activeElement.id, kbdEvent)
      return
    }
    if ($editMode === EditByteModes.Multiple) return
    switch (kbdEvent.key) {
      case 'Escape':
        clearDataDisplays()
        return
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.editorOnChange:
        if ($editMode === EditByteModes.Multiple)
          $editorSelection = msg.data.display
        break

      case MessageCommand.requestEditedData:
        $editorSelection = msg.data.data.dataDisplay
        if ($editMode === EditByteModes.Multiple) {
          $editedDataSegment = new Uint8Array(msg.data.data.data)
        } else {
          $editedDataSegment[0] = msg.data.data.data
        }
        $selectionDataStore.endOffset =
          $selectionDataStore.startOffset + $editedDataSegment.byteLength - 1
        break

      case MessageCommand.setUITheme:
        $darkUITheme = msg.data.theme === 2
        break
      case MessageCommand.viewportRefresh:
        // the viewport has been refreshed, so the editor views need to be updated
        $viewport = {
          data: msg.data.data.viewportData,
          fileOffset: msg.data.data.viewportOffset,
          length: msg.data.data.viewportLength,
          bytesLeft: msg.data.data.viewportFollowingByteCount,
        } as ViewportData_t

        break
    }
  })
</script>

<svelte:window on:keydown|nonpassive={handleKeyBind} />
<body class={$UIThemeCSSClass}>
  <Header
    on:clearChangeStack={clearChangeStack}
    on:seek={seekEventHandler}
    on:clearDataDisplays={clearDataDisplays}
    on:redo={redo}
    on:undo={undo}
  />

  <Main
    on:clearDataDisplays={clearDataDisplays}
    on:applyChanges={custom_apply_changes}
    on:handleEditorEvent={handleEditorEvent}
    on:traverse-file={traversalEventHandler}
    on:seek={seekEventHandler}
  />

  <hr />
  <ServerMetrics />
</body>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  div.test {
    display: flex;
    flex-wrap: wrap;
    width: 384px;
    height: 400pt;
    overflow-y: scroll;
  }
  /* CSS reset */
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
    font-weight: normal;
  }

  div.filename-display {
    font-family: var(--monospace-font);
    font-size: 14px;
    font-weight: bold;
  }

  /* fonts */
  main {
    font-family: var(--sans-serif-font);
    min-height: 100%;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    max-height: 120pt;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header div.display-icons {
    justify-content: space-between;
    transition: all 0.4s ease 0s;
    align-items: center;
  }

  header div.display-icons div {
    margin-right: 10pt;
    font-size: 10pt;
    letter-spacing: 1pt;
  }

  header div.display-icons button {
    width: 20px;
    height: 20px;
    font-size: 15px;
    padding: 0;
    font-weight: normal;
    border-width: 1px;
  }

  button.minmax-icon {
    min-width: 14px;
    font-weight: bold;
  }
</style>
