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
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    editedDataSegment,
    editMode,
    editorEncoding,
    focusedViewportId,
    selectionDataStore,
    selectionSize,
    selectedByte,
    fileMetrics,
    searchQuery,
    editorActionsAllowed,
    dataFeedLineTop,
    seekOffsetInput,
  } from '../../../stores'
  import {
    EditByteModes,
    NUM_LINES_DISPLAYED,
    type RadixValues,
    EditActionRestrictions,
    VIEWPORT_SCROLL_INCREMENT,
  } from '../../../stores/configuration'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import {
    byte_value_string,
    null_byte,
    type ByteSelectionEvent,
    type ByteValue,
    type ViewportData_t,
  } from './BinaryData'
  import DataValue from './DataValue.svelte'
  import FileTraversalIndicator from './FileTraversalIndicator.svelte'
  import {
    byteDivWidthFromRadix,
    line_num_to_file_offset,
    viewport_offset_to_line_num,
  } from '../../../utilities/display'
  import SelectedByteEdit from './SelectedByteEdit.svelte'
  import {
    UIThemeCSSClass,
    type CSSThemeClass,
  } from '../../../utilities/colorScheme'
  import {
    selectionHighlights,
    searchResultsHighlights,
    updateSearchResultsHighlights,
    searchResultsUpdated,
  } from '../../../utilities/highlights'
  import { bytesPerRow } from '../../../stores'
  export let awaitViewportSeek: boolean
  export let dataRadix: RadixValues = 16
  export let addressRadix: RadixValues = 16
  export let viewportData: ViewportData_t

  const DEBOUNCE_TIMEOUT_MS = 20
  const CONTAINER_ID = 'viewportData-container'
  const eventDispatcher = createEventDispatcher()

  function OFFSET_FETCH_ADJUSTMENT(
    direction: ViewportScrollDirection,
    numLinesToScroll: number
  ) {
    const newLineTopOffset =
      numLinesToScroll * $bytesPerRow + $dataFeedLineTop * $bytesPerRow
    let scroll_count = Math.floor(newLineTopOffset / VIEWPORT_SCROLL_INCREMENT)

    if (direction === ViewportScrollDirection.INCREMENT) {
      const fetchBound =
        viewportData.fileOffset + scroll_count * VIEWPORT_SCROLL_INCREMENT
      if (fetchBound > $fileMetrics.computedSize)
        return (
          ($fileMetrics.computedSize / $bytesPerRow) * $bytesPerRow -
          NUM_LINES_DISPLAYED * $bytesPerRow
        )

      return fetchBound
    } else {
      const validBytesRemaining =
        viewportData.fileOffset + scroll_count * VIEWPORT_SCROLL_INCREMENT > 0
      if (!validBytesRemaining) return 0
      else {
        return (
          viewportData.fileOffset + scroll_count * VIEWPORT_SCROLL_INCREMENT
        )
      }
    }
  }

  const INCREMENT_LINE = () => {
    $seekOffsetInput = line_num_to_file_offset(
      $dataFeedLineTop + 1,
      viewportData.fileOffset,
      $bytesPerRow
    ).toString(addressRadix)
    eventDispatcher('seek')
  }
  const DECREMENT_LINE = () => {
    $seekOffsetInput = line_num_to_file_offset(
      $dataFeedLineTop - 1,
      viewportData.fileOffset,
      $bytesPerRow
    ).toString(addressRadix)
    eventDispatcher('seek')
  }
  const INCREMENT_SEGMENT = () => {
    $seekOffsetInput = line_num_to_file_offset(
      $dataFeedLineTop + NUM_LINES_DISPLAYED,
      viewportData.fileOffset,
      $bytesPerRow
    ).toString(addressRadix)
    eventDispatcher('seek')
  }
  const DECREMENT_SEGMENT = () => {
    $seekOffsetInput = line_num_to_file_offset(
      $dataFeedLineTop - NUM_LINES_DISPLAYED,
      viewportData.fileOffset,
      $bytesPerRow
    ).toString(addressRadix)
    eventDispatcher('seek')
  }
  const SCROLL_TO_END = () => {
    $seekOffsetInput = $fileMetrics.computedSize.toString(addressRadix)
    eventDispatcher('seek')
  }
  const SCROLL_TO_TOP = () => {
    $seekOffsetInput = '0'
    eventDispatcher('seek')
  }

  let totalLinesPerFilesize = 0
  let totalLinesPerViewport = 0
  let lineTopMaxViewport = 64
  let lineTopMaxFile = 64
  let atViewportHead = true
  let atViewportTail = false
  let atFileHead = true
  let atFileTail = false
  let lineTopOnRefresh = 0
  let scrollDebounce: NodeJS.Timeout | null = null
  let percentageTraversed = 0.0

  let disableIncrement = false
  let disableDecrement = false

  type ViewportLineData = {
    offset: string
    fileLine: number
    bytes: Array<ByteValue>
    highlight: 'even' | 'odd'
  }

  enum ViewportScrollDirection {
    DECREMENT = -1,
    NONE = 0,
    INCREMENT = 1,
  }

  let height = `calc(${NUM_LINES_DISPLAYED} * 20)px`
  let viewportLines: Array<ViewportLineData> = []
  let viewportDataContainer: HTMLDivElement
  let selectedByteElement: HTMLDivElement
  let themeClass: CSSThemeClass
  let activeSelection: Uint8Array
  let lineTopFileOffset: number
  let searchResults: Uint8Array

  onMount(() => {
    viewportDataContainer = document.getElementById(
      CONTAINER_ID
    ) as HTMLDivElement
    viewportDataContainer.addEventListener('wheel', navigation_wheel_event)
  })

  $: themeClass = $UIThemeCSSClass
  $: {
    totalLinesPerFilesize = Math.ceil($fileMetrics.computedSize / $bytesPerRow)
    totalLinesPerViewport = Math.ceil(viewportData.data.length / $bytesPerRow)
    lineTopMaxFile = Math.max(totalLinesPerFilesize - NUM_LINES_DISPLAYED, 0)
    lineTopMaxViewport = Math.max(
      totalLinesPerViewport - NUM_LINES_DISPLAYED,
      0
    )

    atViewportHead = $dataFeedLineTop === 0
    atViewportTail = $dataFeedLineTop === lineTopMaxViewport
    atFileHead = viewportData.fileOffset === 0
    atFileTail = viewportData.bytesLeft === 0

    disableDecrement =
      $selectionDataStore.active || (atViewportHead && atFileHead)
    disableIncrement =
      $selectionDataStore.active || (atViewportTail && atFileTail)
    lineTopFileOffset = $dataFeedLineTop * $bytesPerRow
  }

  $: {
    activeSelection = $selectionHighlights
    searchResults = $searchResultsHighlights
    if (
      (viewportData.fileOffset >= 0 &&
        !awaitViewportSeek &&
        $dataFeedLineTop >= 0) ||
      $searchResultsUpdated
    ) {
      if (
        viewportLines.length !== 0 &&
        $bytesPerRow !== viewportLines[0].bytes.length
      ) {
        $dataFeedLineTop = viewport_offset_to_line_num(
          parseInt(viewportLines[0].offset, addressRadix),
          viewportData.fileOffset,
          $bytesPerRow
        )
      }

      viewportLines = generate_line_data(
        $dataFeedLineTop,
        dataRadix,
        addressRadix
      )
      $searchResultsUpdated = false
    }
  }
  $: byteElementWidth = byteDivWidthFromRadix(dataRadix)

  function generate_line_data(
    startIndex: number,
    dataRadix: RadixValues,
    addressRadix: RadixValues,
    endIndex: number = startIndex + (NUM_LINES_DISPLAYED - 1)
  ): Array<ViewportLineData> {
    let ret = []
    for (let i = startIndex; i <= endIndex; i++) {
      const viewportLineOffset = i * $bytesPerRow
      const fileOffset = viewportLineOffset + viewportData.fileOffset

      let bytes: Array<ByteValue> = []
      const highlight = i % 2 === 0

      for (let bytePos = 0; bytePos < $bytesPerRow; bytePos++) {
        let byteOffset = viewportLineOffset + bytePos
        bytes.push({
          offset: byteOffset,
          value: viewportData.data[byteOffset],
          text:
            byteOffset < viewportData.length
              ? byte_value_string(viewportData.data[byteOffset], dataRadix)
              : '',
        })
      }

      ret.push({
        offset: fileOffset.toString(addressRadix).padStart(8, '0'),
        fileLine: fileOffset / $bytesPerRow,
        bytes: bytes,
        highlight: highlight ? 'even' : 'odd',
      })
    }
    return ret
  }

  function navigation_keydown_event(event: KeyboardEvent) {
    const { key, shiftKey } = event
    if (key === 'PageDown' || key === 'ArrowDown')
      shiftKey ? INCREMENT_SEGMENT() : INCREMENT_LINE()
    else if (key === 'PageUp' || key === 'ArrowUp')
      shiftKey ? DECREMENT_SEGMENT() : DECREMENT_LINE()
    else if (key === 'Home') DECREMENT_SEGMENT()
    else if (key === 'End') INCREMENT_SEGMENT()
  }

  function navigation_wheel_event(event: WheelEvent) {
    event.preventDefault()

    if (scrollDebounce) clearTimeout(scrollDebounce)

    scrollDebounce = setTimeout(() => {
      scrollDebounce = null
      const direction: ViewportScrollDirection = Math.sign(event.deltaY)

      handle_navigation(direction)
    }, DEBOUNCE_TIMEOUT_MS)
  }

  function at_scroll_boundary(direction: ViewportScrollDirection): boolean {
    return direction === ViewportScrollDirection.DECREMENT
      ? atViewportHead && atFileHead
      : atViewportTail && atFileTail
  }

  function direction_of_scroll(
    numLinesToScroll: number
  ): ViewportScrollDirection {
    return Math.sign(numLinesToScroll) as ViewportScrollDirection
  }

  function handle_navigation(numLinesToScroll: number) {
    const navDirection = direction_of_scroll(numLinesToScroll)

    if (at_scroll_boundary(navDirection)) return

    if (at_fetch_boundary(navDirection, numLinesToScroll)) {
      const viewportOffset = viewportData.fileOffset
      const lineTopOffset = viewportLines[0].bytes[0].offset
      const nextViewportOffset = OFFSET_FETCH_ADJUSTMENT(
        navDirection,
        numLinesToScroll
      )

      eventDispatcher('traverse-file', {
        nextViewportOffset: nextViewportOffset,
        lineTopOnRefresh:
          Math.floor(
            (viewportOffset + lineTopOffset - nextViewportOffset) / $bytesPerRow
          ) + numLinesToScroll,
      })
      return
    }

    const newLine = $dataFeedLineTop + numLinesToScroll
    $dataFeedLineTop = Math.max(0, Math.min(newLine, lineTopMaxViewport))
  }

  function at_fetch_boundary(
    direction: ViewportScrollDirection,
    linesToMove: number = direction
  ): boolean {
    if (linesToMove != direction)
      return direction === ViewportScrollDirection.INCREMENT
        ? $dataFeedLineTop + linesToMove >= lineTopMaxViewport && !atFileTail
        : $dataFeedLineTop + linesToMove <= 0 && !atFileHead

    return direction === ViewportScrollDirection.INCREMENT
      ? atViewportTail && !atFileTail
      : atViewportHead && !atFileHead
  }

  function mousedown(event: CustomEvent<ByteSelectionEvent>) {
    selectionDataStore.update((selections) => {
      selections.active = false
      selections.startOffset = event.detail.targetByte.offset
      selections.endOffset = -1
      selections.originalEndOffset = -1
      return selections
    })
  }

  function mouseup(event: CustomEvent<ByteSelectionEvent>) {
    selectionDataStore.update((selections) => {
      selections.active = true
      selections.endOffset = event.detail.targetByte.offset
      selections.originalEndOffset = event.detail.targetByte.offset
      adjust_event_offsets()
      return selections
    })

    if (!$selectionDataStore.isValid()) {
      selectionDataStore.reset()
      return
    }

    set_byte_selection(event.detail)
  }

  function adjust_event_offsets() {
    const start = $selectionDataStore.startOffset
    const end = $selectionDataStore.endOffset

    if (start > end) {
      $selectionDataStore.startOffset = end
      $selectionDataStore.originalEndOffset = start
      $selectionDataStore.endOffset = start
    }
  }

  function set_byte_selection(selectionEvent: ByteSelectionEvent) {
    $focusedViewportId = selectionEvent.fromViewport

    $selectedByte =
      $editMode === EditByteModes.Single
        ? selectionEvent.targetByte
        : null_byte()

    selectedByteElement = selectionEvent.targetElement

    editedDataSegment.update(() => {
      return viewportData.data.slice(
        $selectionDataStore.startOffset,
        $selectionDataStore.originalEndOffset + 1
      )
    })

    $editMode === EditByteModes.Single
      ? postEditorOnChangeMsg('hex')
      : postEditorOnChangeMsg()
  }

  function postEditorOnChangeMsg(forcedEncoding?: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionDataStore.startOffset + viewportData.fileOffset,
        selectionData: $editedDataSegment,
        encoding: forcedEncoding ? forcedEncoding : $editorEncoding,
        selectionSize: $selectionSize,
        editMode: $editMode,
      },
    })
  }

  function handleClickedIndicator(e: CustomEvent) {
    // the offset will be the offset of the byte at the start of the line
    const offset =
      Math.ceil(
        ($fileMetrics.computedSize * (percentageTraversed / 100.0)) /
          $bytesPerRow
      ) * $bytesPerRow
    const firstPageThreshold = $bytesPerRow * NUM_LINES_DISPLAYED
    const lastPageThreshold = $fileMetrics.computedSize - firstPageThreshold
    if (offset <= firstPageThreshold) {
      // scroll to the top because we are somewhere in the first page
      SCROLL_TO_TOP()
    } else if (offset >= lastPageThreshold) {
      // scroll to the end because we are somewhere in the last page
      SCROLL_TO_END()
    } else {
      // scroll to the offset since we are not in the first or last page
      $seekOffsetInput = offset.toString(addressRadix)
      eventDispatcher('seek')
      lineTopOnRefresh = lineTopMaxViewport
      awaitViewportSeek = true
    }
  }

  $: {
    if ($selectionDataStore.active) {
      window.removeEventListener('keydown', navigation_keydown_event)
      if (viewportDataContainer)
        viewportDataContainer.removeEventListener(
          'wheel',
          navigation_wheel_event
        )
    } else {
      window.addEventListener('keydown', navigation_keydown_event)
      if (viewportDataContainer)
        viewportDataContainer.addEventListener('wheel', navigation_wheel_event)
    }
  }

  window.addEventListener('keydown', navigation_keydown_event)
  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.viewportRefresh:
        if (awaitViewportSeek) {
          awaitViewportSeek = false
          $dataFeedLineTop = Math.max(
            0,
            Math.min(lineTopMaxViewport, $dataFeedLineTop)
          )
          if ($selectionDataStore.active)
            selectedByteElement = document.getElementById(
              $selectedByte.offset.toString()
            ) as HTMLDivElement

          updateSearchResultsHighlights(
            $searchQuery.searchResults,
            viewportData.fileOffset,
            $searchQuery.byteLength
          )
        }
        break
    }
  })
</script>

{#if $selectionDataStore.active && $editMode == EditByteModes.Single}
  {#key $selectedByte || selectedByteElement || dataRadix || $editorActionsAllowed == EditActionRestrictions.None}
    <SelectedByteEdit
      byte={$selectedByte}
      on:seek
      on:applyChanges
      on:handleEditorEvent
    />
  {/key}
{/if}

<div class="container" style:height id={CONTAINER_ID}>
  {#each viewportLines as viewportLine, i}
    <div class={`line ${viewportLine.highlight} ${themeClass}`}>
      <div class="address" id="address">
        <b>{viewportLine.offset}</b>
      </div>
      <div
        class="byte-line"
        id="physical-line-{i.toString(16).padStart(2, '0')}"
      >
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            isSelected={activeSelection[byte.offset] === 1}
            possibleSelection={activeSelection[byte.offset] === 2}
            isSearchResult={searchResults[byte.offset] >>
              activeSelection[byte.offset]}
            id={'physical'}
            radix={dataRadix}
            width={byteElementWidth}
            disabled={!byte.value}
            bind:selectionData={$selectionDataStore}
            on:mouseup={mouseup}
            on:mousedown={mousedown}
          />
        {/each}
      </div>
      <div
        class="byte-line"
        id="logical-line-{i.toString(16).padStart(2, '0')}"
      >
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            isSelected={activeSelection[byte.offset] === 1}
            possibleSelection={activeSelection[byte.offset] === 2}
            isSearchResult={searchResults[byte.offset] >>
              activeSelection[byte.offset]}
            id={'logical'}
            radix={dataRadix}
            width={byteElementWidth}
            disabled={!byte.value}
            bind:selectionData={$selectionDataStore}
            on:mouseup={mouseup}
            on:mousedown={mousedown}
          />
        {/each}
      </div>
    </div>
  {/each}

  <FlexContainer --dir="column">
    <FileTraversalIndicator
      totalLines={totalLinesPerFilesize}
      selectionActive={$selectionDataStore.active}
      currentLine={$dataFeedLineTop}
      fileOffset={viewportData.fileOffset}
      maxDisplayLines={NUM_LINES_DISPLAYED}
      bind:percentageTraversed
      on:indicatorClicked={handleClickedIndicator}
    />
    <FlexContainer --dir="row">
      <Button
        fn={SCROLL_TO_END}
        disabledBy={disableIncrement}
        width="30pt"
        description="Navigate to EOF"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >stat_minus_3</span
        >
      </Button>
      <Button
        fn={INCREMENT_SEGMENT}
        disabledBy={disableIncrement}
        width="30pt"
        description="Increment offset by {NUM_LINES_DISPLAYED *
          $bytesPerRow} bytes"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >keyboard_double_arrow_down</span
        >
      </Button>
      <Button
        fn={INCREMENT_LINE}
        disabledBy={disableIncrement}
        width="30pt"
        description="Increment offset by {$bytesPerRow} bytes"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >keyboard_arrow_down</span
        >
      </Button>
      <Button
        fn={DECREMENT_LINE}
        disabledBy={disableDecrement}
        width="30pt"
        description="Decrement offset by {$bytesPerRow} bytes"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >keyboard_arrow_up</span
        >
      </Button>
      <Button
        fn={DECREMENT_SEGMENT}
        disabledBy={disableDecrement}
        width="30pt"
        description="Decrement offset by {NUM_LINES_DISPLAYED *
          $bytesPerRow} bytes"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >keyboard_double_arrow_up</span
        >
      </Button>
      <Button
        fn={SCROLL_TO_TOP}
        disabledBy={disableDecrement}
        width="30pt"
        description="Navigate to offset 0"
        tooltipAlwaysEnabled={true}
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >stat_3</span
        >
      </Button>
    </FlexContainer>
  </FlexContainer>
</div>

<style lang="scss">
  span {
    font-weight: bold;
  }
  div.container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    font-size: 13px;
    font-family: var(--monospace-font);
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;
  }
  div.container div.line {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 24px;
  }
  div.container div.line div {
    display: flex;
    align-items: center;
  }
  div.container div.line div.address {
    width: 110px;
    direction: rtl;
    justify-content: center;
    letter-spacing: 4px;
  }
  div.container div.line div.address b::selection {
    background-color: transparent;
  }
  div.container .line .byte-line {
    display: flex;
    flex-direction: row;
    border-width: 0px 2px 0px 2px;
    border-color: var(--color-primary-darkest);
    border-style: solid;
  }
  div.file-traversal-indicator {
    width: 100%;
    height: 100%;
    background-color: var(--color-secondary-dark);
  }
  div.line.light.even {
    background-color: var(--color-primary-light-hover);
  }
  div.line.light.odd {
    background-color: var(--color-primary-lightest);
  }
  div.line.dark.even {
    background-color: var(--color-primary-mid);
  }
  div.line.dark.odd {
    background-color: var(--color-primary-dark);
  }
</style>
