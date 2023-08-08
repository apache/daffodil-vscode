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
    viewportCapacity,
    viewportEndOffset,
    viewportFollowingByteCount,
    viewportNumLinesDisplayed,
    viewportStartOffset,
    dataFeedLineTop,
    SelectionData_t,
    dataFeedAwaitRefresh,
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
  import { EditByteModes } from '../stores/configuration'
  import ServerMetrics from './ServerMetrics/ServerMetrics.svelte'
  import { enterKeypressEvents } from '../utilities/enterKeypressEvents'
  import {
    type EditEvent,
    viewport,
    ViewportData_t,
  } from './DataDisplays/CustomByteDisplay/BinaryData'
  import { fileMetrics } from './Header/fieldsets/FileMetrics'
  import {
    DISPLAYED_DATA_LINES,
    byte_count_divisible_offset,
    viewport_offset_to_line_num,
  } from '../utilities/display'
  import { clearSearchResultsHighlights } from '../utilities/highlights'
  import { searchQuery } from './Header/fieldsets/SearchReplace'

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

  function seek(offsetArg?: number) {
    if (!offsetArg) offsetArg = $seekOffset

    const fileSize = $fileMetrics.computedSize
    const viewportBoundary =
      $viewport.length + $viewport.fileOffset - 20 * $bytesPerRow
    const offset =
      offsetArg > 0 &&
      offsetArg < viewport.offsetMax &&
      offsetArg % $bytesPerRow === 0
        ? offsetArg + 1
        : offsetArg

    const relativeFileLine = Math.floor(offset / $bytesPerRow)
    const relativeFileOffset = relativeFileLine * $bytesPerRow
    const lineTopBoundary = Math.floor($viewport.length / $bytesPerRow) - 20
    let relativeTargetLine = relativeFileLine
    let viewportStartOffset = $viewport.fileOffset

    // make sure that the offset is within the loaded viewport
    if (
      offset < $viewport.fileOffset ||
      offset > viewportBoundary ||
      relativeTargetLine > lineTopBoundary
    ) {
      let adjustedFileOffset = Math.max(0, relativeFileOffset - 512)
      const fetchPastFileBoundary = fileSize - adjustedFileOffset < 1024
      if (fetchPastFileBoundary)
        adjustedFileOffset = byte_count_divisible_offset(
          fileSize - 1024,
          $bytesPerRow,
          1
        )

      viewportStartOffset = adjustedFileOffset
      relativeTargetLine = fetchPastFileBoundary
        ? viewport_offset_to_line_num(
            offset,
            viewportStartOffset,
            $bytesPerRow
          ) -
          (DISPLAYED_DATA_LINES - 1)
        : viewport_offset_to_line_num(offset, viewportStartOffset, $bytesPerRow)
      $dataFeedAwaitRefresh = true

      // NOTE: Scrolling the viewport will make the display bounce until it goes to the correct offset
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the offset in the middle
          scrollOffset: viewportStartOffset,
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
    }

    $dataFeedLineTop = relativeTargetLine
    clearDataDisplays()
  }

  function scrolledToEnd(_: Event) {
    if ($viewportFollowingByteCount > 0) {
      // top the display must be the last page of the current viewport, plus one line
      const topOfLastPagePlusOneLine =
        $viewportEndOffset +
        $bytesPerRow -
        $viewportNumLinesDisplayed * $bytesPerRow

      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the desired offset in the middle
          scrollOffset: $viewportEndOffset - Math.floor($viewportCapacity / 2),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
      seek(topOfLastPagePlusOneLine)
    }
  }

  function scrolledToTop(_: Event) {
    if ($viewportStartOffset > 0) {
      // offset to scroll to after the viewport is scrolled, which should be the previous line in the file
      const topOfFirstPageMinusOneLine = $viewportStartOffset - $bytesPerRow
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the desired offset in the middle
          scrollOffset: Math.max(
            topOfFirstPageMinusOneLine - Math.floor($viewportCapacity / 2),
            0
          ),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
      seek(topOfFirstPageMinusOneLine)
    }
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
    if ($selectionSize < 0) {
      clearDataDisplays()
      return
    }
    requestEditedData()
  }

  function custom_commit_changes(event: CustomEvent<EditEvent>) {
    const action = event.detail.action

    let editedData: Uint8Array
    let originalData = $originalDataSegment
    let editedOffset = $selectionDataStore.startOffset + $viewport.fileOffset

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
        editedData = $editedDataSegment
        break
      case 'delete':
        editedData = new Uint8Array(0)
        break
    }

    vscode.postMessage({
      command: MessageCommand.commit,
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
      command: MessageCommand.undo,
    })
  }

  function redo() {
    vscode.postMessage({
      command: MessageCommand.redo,
    })
  }

  function clearChangeStack() {
    vscode.postMessage({
      command: MessageCommand.clear,
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
    if (kbdEvent.key === 'Enter') {
      enterKeypressEvents.run(document.activeElement.id)
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

  function scrollBoundaryEventHandler(e: CustomEvent) {
    if (e.detail.scrolledTop) {
      scrolledToTop(e)
    }
    if (e.detail.scrolledEnd) {
      scrolledToEnd(e)
    }
  }
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
    on:commitChanges={custom_commit_changes}
    on:handleEditorEvent={handleEditorEvent}
    on:scrolledToTop={scrolledToTop}
    on:scrolledToEnd={scrolledToEnd}
    on:scrollBoundary={scrollBoundaryEventHandler}
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
