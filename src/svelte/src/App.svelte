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
  import { onMount } from 'svelte'

  import {
    bytesPerRow,
    editedDataSegment,
    editMode,
    editorSelection,
    seekOffset,
    originalDataSegment,
    requestable,
    selectionDataStore,
    selectionSize,
    dataFeedLineTop,
    SelectionData_t,
    dataFeedAwaitRefresh,
    viewport,
    searchQuery,
    focusedViewportId,
    displayRadix,
    editorEncoding,
    dataDislayLineAmount,
  } from 'stores'
  import {
    CSSThemeClass,
    UIThemeCSSClass,
    darkUITheme,
  } from 'utilities/colorScheme'
  import Header from './components/Header/Header.svelte'
  import Main from './Main.svelte'
  import ServerMetrics from './components/ServerMetrics/ServerMetrics.svelte'
  import {
    elementKeypressEventMap,
    key_is_mappable,
  } from './utilities/elementKeypressEvents'
  import type {
    EditEvent,
    ViewportData_t,
  } from './components/DataDisplays/CustomByteDisplay/BinaryData'
  import { byte_count_divisible_offset } from './utilities/display'
  import Help from 'layout/Help.svelte'
  import { EditByteModes, type BytesPerRow } from 'ext_types'
  import { VIEWPORT_SCROLL_INCREMENT } from './stores/configuration'
  import { vscode } from './utilities/vscode'
  import { isRegularSizedFile } from './components/Header/fieldsets/FileMetrics.svelte.ts'
  import { viewportByteIndicators } from 'utilities/highlights.ts'
  import {
    getUIMessegnerCtx,
    setUIMessegnerCtx,
  } from 'utilities/messageContext.svelte.ts'

  let { mountTarget }: { mountTarget: HTMLElement } = $props<{
    mountTarget: HTMLElement
  }>()

  const uiMsgId = mountTarget.attributes['extension_msg_id'].value
  setUIMessegnerCtx(vscode.getMessenger(uiMsgId))
  const { addListener, postMessage } = getUIMessegnerCtx()

  onMount(() => {
    postMessage('webviewReady')
    postMessage('scrollViewport', {
      startOffset: 0,
      bytesPerRow: $bytesPerRow,
      numLinesDisplayed: $dataDislayLineAmount,
    })
  })

  function requestEditedData() {
    if ($requestable) {
      postMessage('requestEditedData', {
        selectionToFileOffset: $selectionDataStore.startOffset,
        editedContent: $editorSelection,
        viewport: $focusedViewportId as 'physical' | 'logical',
        selectionSize: $selectionSize,
        encodingStr: $editorEncoding,
        radix: $displayRadix,
        editMode: $editMode,
      })
    }
  }

  function offset_to_viewport_line_number(
    offset: number,
    bytesPerRow: BytesPerRow,
    viewportStartOffset: number = $viewport.fileOffset
  ): number {
    const nearestBPRdivisibleTargetFileOffset = byte_count_divisible_offset(
      offset,
      bytesPerRow
    )
    const nearestBPRdivisibleViewportFileOffset = byte_count_divisible_offset(
      viewportStartOffset,
      bytesPerRow
    )
    return (
      (nearestBPRdivisibleTargetFileOffset -
        nearestBPRdivisibleViewportFileOffset) /
      bytesPerRow
    )
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

    const fetchOffset = Math.max(
      0,
      byte_count_divisible_offset(
        offsetArg - (VIEWPORT_SCROLL_INCREMENT - $bytesPerRow),
        $bytesPerRow
      )
    )

    $dataFeedLineTop = offset_to_viewport_line_number(
      offsetArg,
      $bytesPerRow,
      fetchOffset
    )

    postMessage('scrollViewport', {
      startOffset: fetchOffset,
      bytesPerRow: $bytesPerRow,
      numLinesDisplayed: $dataDislayLineAmount,
    })
    clearDataDisplays()
  }

  function seekEventHandler(_: CustomEvent) {
    seek($seekOffset)
  }

  function traversalEventHandler(navigationEvent: CustomEvent) {
    const navigationData = navigationEvent.detail
    $dataFeedAwaitRefresh = true

    postMessage('scrollViewport', {
      startOffset: navigationData.nextViewportOffset,
      bytesPerRow: $bytesPerRow,
    })

    $dataFeedLineTop = navigationData.lineTopOnRefresh
    clearDataDisplays()
  }

  function handleEditorEvent(event: CustomEvent) {
    if (!event.detail) {
      const sizeRegularity = isRegularSizedFile()
      if (sizeRegularity && $selectionSize < 0) {
        clearDataDisplays()
        return
      }
      if (!sizeRegularity && $editorSelection.length == 0) return
    } else {
      const { eventType } = event.detail
      if (eventType === 'byte-edit') {
      }
    }

    requestEditedData()
  }

  function custom_apply_changes(event: CustomEvent<EditEvent>) {
    const action = event.detail.action
    const sizeRegularity = isRegularSizedFile()

    let editedData: Uint8Array
    let originalData = $originalDataSegment
    let editedOffset = sizeRegularity
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
          !sizeRegularity && $editorSelection.length == 0
            ? new Uint8Array(0)
            : $editedDataSegment
        break
      case 'delete':
        editedData = new Uint8Array(0)
        break
    }
    postMessage('applyChanges', {
      offset: editedOffset,
      original_segment: originalData,
      edited_segment: editedData,
    })

    clearDataDisplays()
    clearQueryableData()
  }

  function undo() {
    postMessage('undoChange')
  }

  function redo() {
    postMessage('redoChange')
  }

  function clearChangeStack() {
    postMessage('clearChanges')
  }

  function clearDataDisplays() {
    $selectionDataStore = new SelectionData_t()
    $editorSelection = ''
    $editedDataSegment = new Uint8Array(0)
    viewportByteIndicators.clearIndication('replacement')
    viewportByteIndicators.clearIndication('searchresult')
  }

  function clearQueryableData() {
    searchQuery.clear()
  }

  function handleKeyBind(event: Event) {
    const kbdEvent = event as KeyboardEvent
    if (key_is_mappable(kbdEvent.key)) {
      if (document.activeElement)
        // document.activeElement is possibly undefined / null
        elementKeypressEventMap.run(document.activeElement.id, kbdEvent)
      return
    }
    switch (kbdEvent.key) {
      case 'Escape':
        clearDataDisplays()
        return
    }
  }

  addListener('editorOnChange', (data) => {
    if ($editMode === EditByteModes.Multiple) $editorSelection = data.encodedStr
  })
  addListener('requestEditedData', (data) => {
    $editorSelection = data.dataDisplay
    if ($editMode === EditByteModes.Multiple) {
      $editedDataSegment = new Uint8Array(data.data)
    } else {
      $editedDataSegment[0] = data.data[0]
    }
    $selectionDataStore.endOffset =
      $selectionDataStore.startOffset + $editedDataSegment.byteLength - 1
    viewportByteIndicators.updateSelectionIndications($selectionDataStore)
  })
  addListener('setUITheme', (kind) => {
    $darkUITheme = kind === 2
    $UIThemeCSSClass = $darkUITheme ? CSSThemeClass.Dark : CSSThemeClass.Light
  })
  addListener('viewportRefresh', (payload) => {
    const { data, fileOffset, length, bytesLeft } = payload
    const byteData = Uint8Array.from(data)

    $viewport = {
      data: byteData,
      fileOffset: fileOffset,
      length: length,
      bytesLeft: bytesLeft,
    } as ViewportData_t
    console.log($viewport)
  })
</script>

<svelte:window on:keydown|nonpassive={handleKeyBind} />
<!-- <body class={$UIThemeCSSClass}> -->
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

<Help />
<hr />
<ServerMetrics />

<!-- </body> -->

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
