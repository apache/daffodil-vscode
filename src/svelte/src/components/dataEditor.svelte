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
  import {
    displayRadix,
    addressValue,
    fileName,
    diskFileSize,
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    editedDataSegment,
    selectionStartOffset,
    selectionEndOffset,
    editorSelection,
    editorEncoding,
    selectionSize,
    commitable,
    byteOffsetPos,
    cursorPos,
    dataViewEndianness,
    commitErrMsg,
    viewportData,
    gotoOffset,
    gotoOffsetInput,
    gotoOffsetMax,
    gotoable,
    int8,
    uint8,
    int16,
    uint16,
    int32,
    uint32,
    float32,
    int64,
    uint64,
    float64,
    rawEditorSelectionTxt,
    searching,
    searchData,
    allowCaseInsensitiveSearch,
    searchCaseInsensitive,
    searchable,
    searchResults,
    replaceData,
    replaceable,
    replaceErrMsg,
    selectionOriginalEnd,
    searchErrMsg,
    computedFileSize,
    saveable,
    requestable,
    undoCount,
    changeCount,
    editByte,
    editMode,
    editByteWindowHidden,
    focusedViewportId,
    replacing,
    replacementsCount,
    searchIndex,
    headerHidden,
    originalDataSegment,
    editedByteIsOriginalByte,
    selectionActive,
    dataViewOffsetText,
  } from '../stores'
  import {
    radixOpt,
    encoding_groups,
    endiannessOpt,
    lsbOpt,
    byteSizeOpt,
    addressOpt,
    dvHighlightTag,
    getOffsetDisplay,
    encodeForDisplay,
    makeAddressRange,
    isWhitespace,
    syncScroll,
    setSelectionOffsetInfo,
    radixBytePad,
  } from '../utilities/display'
  import {
    CSSThemeClass,
    UIThemeCSSClass,
    darkUITheme,
  } from '../utilities/colorScheme'
  import { vscode } from '../utilities/vscode'
  import { MessageCommand } from '../utilities/message'
  import { writable } from 'svelte/store'
  import { radixToString } from '../utilities/display.js'

  let addressText: string
  let physicalOffsetText: string
  let physicalDisplayText: string
  let logicalOffsetText: string
  let logicalDisplayText: string = ''
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let omegaEditPort: number
  let serverVersion: string = 'Connecting...'
  let serverLatency: number
  let physical_vwRef: HTMLTextAreaElement
  let address_vwRef: HTMLTextAreaElement
  let logical_vwRef: HTMLTextAreaElement
  let isScrolledToTop = true
  let isScrolledToEnd = false

  const editByteWindow = writable(
    document.getElementById('editByteWindow') as HTMLDivElement
  )
  // Reactive Declarations - ORDER MATTERS
  $: clearOnEditModeChange($editMode)

  $: addressText = makeAddressRange(
    $fileByteStart,
    $fileByteEnd,
    $bytesPerRow,
    $addressValue
  )

  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $selectionStartOffset,
    $selectionEndOffset,
    $selectionSize
  )

  $: {
    physicalOffsetText = getOffsetDisplay(
      $addressValue,
      $displayRadix,
      'physical'
    )
    logicalOffsetText = getOffsetDisplay(
      $addressValue,
      $displayRadix,
      'logical'
    )
    if (logical_vwRef) {
      logical_vwRef.style.maxWidth = $displayRadix === 2 ? '105pt' : ''
    }
  }

  $: {
    physicalDisplayText = encodeForDisplay(
      $viewportData,
      $displayRadix,
      $bytesPerRow
    ).toUpperCase()
  }

  $: setSelectionEncoding($editorEncoding)

  $: updateLogicalDisplay($bytesPerRow)

  $: $gotoOffset = parseInt($gotoOffsetInput, $addressValue)

  $: {
    if ($editorSelection.includes(dvHighlightTag.start)) {
      $editorSelection = $editorSelection
        .replaceAll(dvHighlightTag.start, '')
        .replaceAll(dvHighlightTag.end, '')
    }
    $rawEditorSelectionTxt = $editorSelection
  }
  $: $UIThemeCSSClass = $darkUITheme ? CSSThemeClass.Dark : CSSThemeClass.Light

  function clearOnEditModeChange(_: string) {
    closeEphemeralWindows()
    clearDataDisplays()
  }

  function requestEditedData() {
    if ($requestable) {
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          selectionToFileOffset: $selectionStartOffset,
          editedContent: $rawEditorSelectionTxt,
          viewport: $focusedViewportId,
          selectionSize: $selectionSize,
          encoding: $editorEncoding,
          radix: $displayRadix,
          editMode: $editMode,
        },
      })
    }
  }

  // TODO: Look into wiring this so that when $gotoOffset is changed, it will
  // scroll to that offset automatically
  function goTo(offsetArg: number) {
    const offset =
      offsetArg > 0 &&
      offsetArg < $computedFileSize &&
      offsetArg % $bytesPerRow === 0
        ? offsetArg + 1
        : offsetArg

    if (physical_vwRef) {
      const rowCount = Math.ceil($computedFileSize / $bytesPerRow)
      const lineHeight = physical_vwRef.scrollHeight / rowCount
      const targetLine = Math.ceil(offset / $bytesPerRow)
      physical_vwRef.scrollTop =
        (targetLine == 0 ? 0 : targetLine - 1) * lineHeight
    }
    closeEphemeralWindows()
    clearDataDisplays()
  }

  function goToEventHandler(_: Event) {
    goTo($gotoOffset)
  }

  function scrollSearchResults(isNext: boolean) {
    if ($searchResults.length > 0) {
      let index = $searchIndex
      if (isNext) {
        index = index + 1
        if (index >= $searchResults.length) {
          index = 0
        }
      } else {
        index = index - 1
        if (index < 0) {
          index = $searchResults.length - 1
        }
      }
      $searchIndex = index
      $gotoOffsetInput = $searchResults[index].toString($addressValue)
      goTo($gotoOffset)
    }
  }

  function scrollSearchNext() {
    scrollSearchResults(true)
  }

  function scrollSearchPrev() {
    scrollSearchResults(false)
  }

  function updateLogicalDisplay(bytesPerRow) {
    vscode.postMessage({
      command: MessageCommand.updateLogicalDisplay,
      data: {
        viewportData: $viewportData,
        bytesPerRow: bytesPerRow,
      },
    })
  }

  function setSelectionEncoding(editorEncoding: string) {
    if ($editMode === 'simple') {
      vscode.postMessage({
        command: MessageCommand.editorOnChange,
        data: {
          encoding: editorEncoding,
        },
      })
    } else {
      vscode.postMessage({
        command: MessageCommand.editorOnChange,
        data: {
          encoding: editorEncoding,
          selectionData: $editedDataSegment,
        },
      })
    }
  }

  async function loadContent(data: Uint8Array) {
    $viewportData = data
    $gotoOffsetMax = data.length
    $gotoOffset = 0
    // $diskFileSize = $computedFileSize
    vscode.postMessage({
      command: MessageCommand.updateLogicalDisplay,
      data: {
        viewportData: $viewportData,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function scrollHandle(e: Event) {
    const element = e.target as HTMLElement
    isScrolledToTop = element.scrollTop === 0
    isScrolledToEnd =
      element.scrollTop >= element.scrollHeight - element.clientHeight
    if (!currentScrollEvt || currentScrollEvt === element.id) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element.id
      switch (currentScrollEvt) {
        case 'physical':
          syncScroll(physical_vwRef, address_vwRef)
          syncScroll(physical_vwRef, logical_vwRef)
          break
        case 'logical':
          syncScroll(logical_vwRef, address_vwRef)
          syncScroll(logical_vwRef, physical_vwRef)
          break
        case 'address':
          syncScroll(address_vwRef, physical_vwRef)
          syncScroll(address_vwRef, logical_vwRef)
          break
      }
      // noinspection TypeScriptValidateTypes
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }

  async function handleEditorEvent(_: Event) {
    if ($selectionOriginalEnd - $selectionStartOffset < 0) {
      clearDataDisplays()
      return
    }

    $cursorPos = document.getSelection().anchorOffset
    requestEditedData()
  }

  function frameSelected(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart as number
    let selectionEnd = selected.selectionEnd as number

    if (selectionStart % 2 === 1) {
      ++selectionStart
    }
    if (selectionEnd % 2 === 0) {
      --selectionEnd
    }

    selected.selectionStart = selectionStart
    selected.selectionEnd = selectionEnd
    return selected
  }

  function frameSelectedOnWhitespace(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd
    if (selectionStart != undefined && selectionEnd != undefined) {
      if (
        isWhitespace(selected.value.at(selectionStart)) &&
        selectionStart % 2
      ) {
        ++selectionStart
      } else {
        while (
          selectionStart &&
          !isWhitespace(selected.value.at(selectionStart - 1))
        ) {
          --selectionStart
        }
      }
      selected.selectionStart = selectionStart

      // Adjust the end to align with the closest ending of content
      if (isWhitespace(selected.value.at(selectionEnd))) {
        --selectionEnd
      } else {
        while (
          selectionEnd < selected.value.length &&
          !isWhitespace(selected.value.at(selectionEnd + 1))
        ) {
          ++selectionEnd
        }
      }
      selected.selectionEnd =
        selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
    }

    const selectionOffsetsByRadix = {
      2: {
        start: Math.floor(selectionStart / 9),
        end: Math.floor((selectionEnd - 8) / 9 + 1),
      },
      8: {
        start: Math.floor(selectionStart / 4),
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      10: {
        start: Math.floor(selectionStart / 4),
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      16: {
        start: Math.floor(selectionStart / 3),
        end: Math.floor((selectionEnd - 2) / 3 + 1),
      },
    }

    $selectionStartOffset =
      selected.id === 'logical'
        ? Math.floor(selectionStart / 2)
        : selectionOffsetsByRadix[$displayRadix].start

    $selectionEndOffset =
      selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[$displayRadix].end

    $selectionOriginalEnd =
      selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[$displayRadix].end

    $selectionActive = true
  }

  /**
   * Handle Click vs Select in Viewport Additional function was needed due to event propagation from textarea to
   * editByteWindow causing another 'select' Event when closing the editByteWindow.
   *
   * Capture and cancelling event propagation did not resolve due to not parent / child coupling.
   */
  function handleViewportClickEvent(event: Event) {
    clearDataDisplays()
    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    let selectionRangeValid: boolean
    $focusedViewportId === 'physical'
      ? (selectionRangeValid =
          areaRef.selectionEnd - areaRef.selectionStart ===
          radixBytePad($displayRadix))
      : (selectionRangeValid =
          areaRef.selectionEnd - areaRef.selectionStart === 1)

    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionStartOffset + 8)
      )
    })

    if ($editMode === 'simple' && selectionRangeValid) {
      const clickEvent = event as MouseEvent
      const windowX = clickEvent.clientX
      const windowY = clickEvent.clientY
      $editByteWindow.style.left = (windowX + 2).toString() + 'px'
      $editByteWindow.style.top = (windowY + 2).toString() + 'px'
      $editByteWindow.style.display = 'flex'

      if ($displayRadix === 2) {
        $editByteWindow.style.width = '195pt'
      } else {
        $editByteWindow.style.width = '95pt'
      }
      $editByteWindowHidden = false
      $editorSelection = $editByte
      document.getElementById('editByteInput').focus()
    }
  }

  function handleSelectionEvent(event: Event) {
    clearDataDisplays()
    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionEndOffset + 1)
      )
    })
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionStartOffset,
        selectionData: $editedDataSegment,
        encoding: $editorEncoding,
        selectionSize: $selectionSize,
      },
    })
  }

  const editedDataStore = writable(new Uint8Array(0))
  function commitChanges(event: Event) {
    const commitEvent = event as PointerEvent
    const buttonPressed = commitEvent.target as HTMLButtonElement

    let editedData: Uint8Array
    let editedOffset = $selectionStartOffset
    let originalData = $originalDataSegment

    if ($editMode === 'full') {
      editedData = $editedDataSegment
    } else {
      switch (buttonPressed.id) {
        case 'insert-after':
          ++editedOffset // offset is 1 byte after this byte
        // intentional fall through
        case 'insert-before':
          originalData = new Uint8Array(0) // there is no original data for insert
        // intentional fall through
        case 'insert-replace':
          editedData = $editedDataSegment.subarray(0, 1) // 1 byte
          break
        case 'insert-delete':
          editedData = new Uint8Array(0) // there is no edited data for delete
          break
      }
    }
    $editedDataStore = editedData
    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        offset: editedOffset,
        originalSegment: originalData,
        editedSegment: editedData,
      },
    })
    closeEphemeralWindows()
    clearDataDisplays()
  }

  function search() {
    $searchResults = []
    $searchIndex = 0
    $replacementsCount = 0
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchData,
        caseInsensitive: $searchCaseInsensitive,
      },
    })
    $searching = true
    closeEphemeralWindows()
    clearDataDisplays()
  }

  function searchAndReplace() {
    $searchResults = []
    $searchIndex = 0
    $replacementsCount = 0
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchData,
        caseInsensitive: $searchCaseInsensitive,
        replaceData: $replaceData,
      },
    })
    $replacing = true
    closeEphemeralWindows()
    clearDataDisplays()
  }

  function saveToDisk() {
    vscode.postMessage({
      command: MessageCommand.save,
    })
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

  function clearDataViewHighlight(_: Event) {
    editorSelection.update((str) => {
      return str
        .replaceAll(dvHighlightTag.start, '')
        .replaceAll(dvHighlightTag.end, '')
    })
  }

  function getHighlightLenModifier(editorEncoding: string): 1 | 2 | 8 {
    switch (editorEncoding) {
      case 'hex':
        return 2
      case 'binary':
        return 8
      default:
        return 1
    }
  }

  function getHighlightByteOffset(
    eventId: string,
    highlightLenModifier: number
  ): number {
    switch (eventId) {
      case 'b8_dv':
        return highlightLenModifier
      case 'b16_dv':
        return 2 * highlightLenModifier
      case 'b32_dv':
        return 4 * highlightLenModifier
      case 'b64_dv':
        return 8 * highlightLenModifier
    }
  }

  function highlightDataView(event: Event) {
    const highlightLenModifier = getHighlightLenModifier($editorEncoding)
    const highlightByteOffset = getHighlightByteOffset(
      (event.target as HTMLElement).id,
      highlightLenModifier
    )
    const pos = $byteOffsetPos * highlightLenModifier

    editorSelection.update((str) => {
      const seg1 = str.substring(0, pos) + dvHighlightTag.start
      const seg2 =
        str.substring(pos, pos + highlightByteOffset) + dvHighlightTag.end
      const seg3 = str.substring(pos + highlightByteOffset)
      return seg1 + seg2 + seg3
    })
  }

  function elementMinMax(event: Event) {
    const button = event.target as HTMLButtonElement
    const headerTag = document.querySelector(
      '.header-container'
    ) as HTMLDivElement
    if ($headerHidden) {
      button.style.transform = ''
      headerTag.style.display = 'flex'
      $headerHidden = false
    } else {
      const headerTag = document.querySelector(
        '.header-container'
      ) as HTMLDivElement
      headerTag.style.display = 'none'
      $headerHidden = true
    }
  }

  function closeEphemeralWindows() {
    const windows = document.querySelectorAll('.ephemeral')
    windows.forEach((element) => {
      const window = element as HTMLElement
      window.style.display = 'none'
    })
  }

  function closeEditByteWindow() {
    $editByteWindow.style.display = 'none'
    $editByteWindowHidden = true
  }

  function clearDataDisplays() {
    $selectionStartOffset = 0
    $selectionEndOffset = 0
    $selectionOriginalEnd = 0
    $cursorPos = 0
    $editorSelection = ''
    $selectionActive = false
    $editedDataSegment = new Uint8Array(0)
  }

  function moveEditByteWindow() {
    switch ($focusedViewportId) {
      case 'physical':
        {
          const byteTextPxWidth = logical_vwRef.clientWidth / $bytesPerRow
          const byteRowPos = $selectionStartOffset % $bytesPerRow
          const editByteWindowX =
            logical_vwRef.offsetLeft + byteRowPos * byteTextPxWidth
          $editByteWindow.style.left = editByteWindowX.toString() + 'px'
          $focusedViewportId = 'logical'
        }
        break
      case 'logical':
        {
          const byteTextPxWidth = physical_vwRef.clientWidth / $bytesPerRow
          const byteRowPos = $selectionStartOffset % $bytesPerRow
          const editByteWindowX =
            physical_vwRef.offsetLeft + byteRowPos * byteTextPxWidth
          $editByteWindow.style.left = editByteWindowX.toString() + 'px'
          $focusedViewportId = 'physical'
        }
        break
    }
    $editorSelection = $editByte
    document.getElementById('editByteInput').focus()
  }

  function handleKeybind(event: Event) {
    if ($editMode === 'full') return
    const kevent = event as KeyboardEvent
    switch (kevent.key) {
      case 'Escape':
        closeEditByteWindow()
        clearDataDisplays()
        return
    }
  }

  function updateAddressValue(event: Event) {
    const addrSelect = event.target as HTMLSelectElement
    const newGotoInput = $gotoOffset.toString(parseInt(addrSelect.value))
    $gotoOffsetInput = newGotoInput === 'NaN' ? '0' : newGotoInput
    $gotoOffset = parseInt($gotoOffsetInput, $addressValue)
    $addressValue = parseInt(addrSelect.value)
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.replacementsResults:
        $replacing = false
        $replacementsCount = msg.data.data.replacementsCount
        break

      case MessageCommand.heartBeat:
        omegaEditPort = msg.data.data.omegaEditPort
        serverVersion = msg.data.data.serverVersion
        serverLatency = msg.data.data.serverLatency
        break

      case MessageCommand.viewportSubscribe:
        loadContent(msg.data.data.viewportData)
        break

      case MessageCommand.editorOnChange:
        $editorSelection = msg.data.display
        break

      case MessageCommand.requestEditedData:
        $editorSelection = msg.data.data.dataDisplay
        if ($editMode === 'full') {
          $editedDataSegment = new Uint8Array(msg.data.data.data)
        } else {
          $editedDataSegment[0] = msg.data.data.data
        }
        $cursorPos = document.getSelection().anchorOffset
        $selectionEndOffset =
          $selectionStartOffset + $editedDataSegment.byteLength - 1
        break

      case MessageCommand.updateLogicalDisplay:
        logicalDisplayText = msg.data.data.logicalDisplay
        break

      case MessageCommand.fileInfo:
        if ('fileName' in msg.data.data) {
          $fileName = msg.data.data.fileName
        }
        if ('diskFileSize' in msg.data.data) {
          $diskFileSize = msg.data.data.diskFileSize
        }
        if ('computedFileSize' in msg.data.data) {
          $computedFileSize = msg.data.data.computedFileSize
        }
        if ('changeCount' in msg.data.data) {
          $changeCount = msg.data.data.changeCount
        }
        if ('undoCount' in msg.data.data) {
          $undoCount = msg.data.data.undoCount
        }
        break

      case MessageCommand.search:
        $searchResults = msg.data.searchResults
        $searching = false
        if ($searchResults.length > 0) {
          $searchIndex = 1
          scrollSearchResults(false)
        }
        break
      case MessageCommand.setUITheme:
        $darkUITheme = msg.data.theme === 2
        break
    }
  })
</script>

<svelte:window on:keydown|nonpassive={handleKeybind} />
<body class={$UIThemeCSSClass}>
  <header>
    <div class="header-container">
      <fieldset class="box file-metrics">
        <legend>File Metrics</legend>
        <div class="flex-container row wrap">
          <div class="row-item flex-container col">
            <label for="file_name" class="col-item file-metrics">Path</label>
            <div id="file_name" class="col-item file-name">{$fileName}</div>
          </div>
        </div>
        <hr />
        <div class="flex-container row" style="padding-top: 5pt;">
          <div class="two-row-items flex-container col">
            <label class="col-item file-metrics" for="disk_file_size"
              >Disk Size</label
            >
            <div class="col-item" id="disk_file_size">{$diskFileSize}</div>
          </div>
          <div class="two-row-item flex-container col">
            <label class="col-item file-metrics" for="computed_file_size"
              >Computed Size</label
            >
            <div class="col-item" id="computed_file_size">
              {$computedFileSize}
            </div>
          </div>
        </div>
        <hr />
        <div>
          {#if $saveable}
            <button class={$UIThemeCSSClass} on:click={saveToDisk}>Save</button>
          {:else}
            <button class={$UIThemeCSSClass} disabled>Save</button>
          {/if}
        </div>
      </fieldset>
      <fieldset class="box search-replace">
        <legend>Search</legend>
        <div class="flex-container col">
          <div class="col-item">
            Search:
            {#if $searchData.length > 0 && !$searchable}
              <span class="errMsg">{$searchErrMsg}</span>
            {/if}
            <input class={$UIThemeCSSClass} bind:value={$searchData} />
          </div>
          {#if $allowCaseInsensitiveSearch}
            <div class="case col-item flex-container row center">
              <label for="search_case_insensitive" class="row-item search-case"
                >Case Insensitive:</label
              >
              <input
                type="checkbox"
                id="search_case_insensitive"
                class={$UIThemeCSSClass + ' row-item search-case'}
                bind:checked={$searchCaseInsensitive}
              />
            </div>
          {/if}
          <div class="col-item">
            Replace:
            {#if $replaceData.length > 0 && !$replaceable}
              <span class="errMsg">{$replaceErrMsg}</span>
            {/if}
            <input class={$UIThemeCSSClass} bind:value={$replaceData} />
          </div>
          <div class="col-item flex-container row center">
            {#if !$searchable}
              <button class={$UIThemeCSSClass} id="search_btn" disabled
                >Search</button
              >
            {:else}
              <button class={$UIThemeCSSClass} id="search_btn" on:click={search}
                >Search</button
              >
            {/if}
            {#if !$replaceable}
              <button class={$UIThemeCSSClass} id="replace_btn" disabled
                >Replace</button
              >
            {:else}
              <button
                class={$UIThemeCSSClass}
                id="replace_btn"
                on:click={searchAndReplace}>Replace</button
              >
            {/if}
            {#if $searching || $replacing}
              <svg class="loader sm" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" />
              </svg>
            {/if}
          </div>
          <div class="col-item flex-container row center">
            {#if $searchResults.length > 0}
              <button
                class={$UIThemeCSSClass}
                id="search_prev"
                on:click={scrollSearchPrev}>Prev</button
              >
              <button
                class={$UIThemeCSSClass}
                id="search_next"
                on:click={scrollSearchNext}>Next</button
              >
              <sub>{$searchIndex + 1} / {$searchResults.length} Results </sub>
            {:else if $replacementsCount > 0}
              <sub>{$replacementsCount} Replacements</sub>
            {/if}
          </div>
        </div>
      </fieldset>
      <fieldset class="box">
        <legend>Settings</legend>
        <div class="flex-container col">
          <div class="col-item flex-container row center">
            <div class="two-row-items">
              <label for="edit_mode">Byte Edit Mode:</label>
            </div>
            <div class="two-row-items">
              <select
                id="edit_mode"
                class={$UIThemeCSSClass + ' row-item'}
                bind:value={$editMode}
                on:change={closeEphemeralWindows}
              >
                <option value="simple">Single</option>
                <option value="full">Multiple</option>
              </select>
            </div>
          </div>
          <div class="col-item flex-container row center">
            <div class="two-row-items">
              <label for="radix">Byte Display Radix: </label>
            </div>
            <div class="two-row-items">
              <select
                id="radix"
                class={$UIThemeCSSClass + ' row-item'}
                bind:value={$displayRadix}
                on:change={closeEphemeralWindows}
              >
                {#each radixOpt as { name, value }}
                  <option {value}>{name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="col-item flex-container row center">
            <div class="two-row-items">
              <label for="radix" class="row-item">Edit Encoding: </label>
            </div>
            <div class="two-row-items">
              <select
                class={$UIThemeCSSClass + ' row-item'}
                id="edit_encoding"
                bind:value={$editorEncoding}
              >
                {#each encoding_groups as { group, encodings }}
                  <optgroup label={group}>
                    {#each encodings as { name, value }}
                      <option {value}>{name}</option>
                    {/each}
                  </optgroup>
                {/each}
              </select>
            </div>
          </div>
          <hr />
          <div
            class="col-item flex-container row center"
            style="justify-content: flex-end;flex-wrap: wrap;"
          >
            <div class="col-item flex-container row center" style="width:100%;">
              <div class="two-row-items">Offset:</div>
              <div class="two-row-items">
                <input
                  class={$UIThemeCSSClass + ' row-item'}
                  type="text"
                  id="goto_offset"
                  bind:value={$gotoOffsetInput}
                />
              </div>
            </div>
            <div class="col-item" style="font-size: 9pt; text-align: right;">
              <div class="row-item flex-container row end center-items">
                {#if !$gotoable.valid}
                  <div class="margin-right" style="color: red;">
                    {$gotoable.gotoErrMsg}
                  </div>
                  <button class={$UIThemeCSSClass + ' no-margin goto'} disabled
                    >Go To</button
                  >
                {:else}
                  <button
                    class={$UIThemeCSSClass + ' no-margin goto'}
                    on:click={goToEventHandler}>Go To</button
                  >
                {/if}
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
    {#if $headerHidden}
      <div class="display-icons flex-container row center" style="width: 100%;">
        <div>{$fileName}</div>
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}>&#8691;</button
        >
      </div>
    {:else}
      <div class="display-icons">
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}>&#8691;</button
        >
      </div>
    {/if}
  </header>

  <main class="dataEditor" id="data_editor">
    <div class={$UIThemeCSSClass + ' hd'}>Address</div>
    <div class={$UIThemeCSSClass + ' hd'}>Physical</div>
    <div class={$UIThemeCSSClass + ' hd'}>Logical</div>
    <div class={$UIThemeCSSClass + ' hd'}>Edit</div>
    <div class={$UIThemeCSSClass + ' measure'} style="align-items: center;">
      <select
        class={$UIThemeCSSClass + ' address_type'}
        id="address_numbering"
        on:change={updateAddressValue}
      >
        {#each addressOpt as { name, value }}
          <option {value}>{name}</option>
        {/each}
      </select>
    </div>
    <div class={$UIThemeCSSClass + ' measure'}>
      <span id="physical_offsets">
        {@html physicalOffsetText}
      </span>
    </div>
    <div class={$UIThemeCSSClass + ' measure'}>
      <span id="logical_offsets">
        {@html logicalOffsetText}
      </span>
    </div>
    <div class={$UIThemeCSSClass + ' measure selection'}>
      {#if $editMode === 'full'}
        {#if $selectionActive}
          <div
            class="clear-selection"
            title="Clear selection data"
            on:click={clearDataDisplays}
            on:keypress={clearDataDisplays}
          >
            &#10006;
          </div>
          <!-- on:keypress is needed to silence warning from Svelte A11y, see below
              == (!) Plugin svelte: A11y: visible, non-interactive elements with an on:click event must be accompanied by an on:keydown, on:keyup, or on:keypress event. ==
          -->
        {:else}
          <div class="clear-selection" />
        {/if}
        <div>
          {selectionOffsetText}{#if $cursorPos} | cursor: {$cursorPos} {/if}
        </div>
      {:else}
        <div>
          <sub
            ><i
              >The pop-up, single byte, edit window is available upon byte
              selection, press ESC to close.<br />The edit window below is
              deactivated in single byte edit mode.</i
            ></sub
          >
        </div>
      {/if}
    </div>
    <div
      class="flex-container col edit-byte-window ephemeral"
      id="editByteWindow"
      bind:this={$editByteWindow}
    >
      <div class="flex-container row col-item">
        <input
          title="byte position {$selectionStartOffset.toString(
            $addressValue
          )} {radixToString($addressValue)}"
          type="text"
          id="editByteInput"
          class={$UIThemeCSSClass}
          bind:value={$editorSelection}
          on:input={handleEditorEvent}
        />
        {#if $commitable}
          <button
            title="insert byte before this location"
            id="insert-before"
            class="insert"
            on:click={commitChanges}>&#8676;</button
          >
          <button
            title="replace byte at this location"
            id="insert-replace"
            class="submit"
            on:click={commitChanges}>&#8645;</button
          >
          <button
            title="insert byte after this location"
            id="insert-after"
            class="insert"
            on:click={commitChanges}>&#8677;</button
          >
          <button
            title="delete this byte"
            id="insert-delete"
            class="delete"
            on:click={commitChanges}>✖</button
          >
        {:else if $editedByteIsOriginalByte}
          <button
            title="insert byte before this location"
            id="insert-before"
            class="insert"
            on:click={commitChanges}>&#8676;</button
          >
          <button class="submit" disabled>&#8645;</button>
          <button
            title="insert byte after this location"
            id="insert-after"
            class="insert"
            on:click={commitChanges}>&#8677;</button
          >
          <button
            title="delete this byte"
            id="insert-delete"
            class="delete"
            on:click={commitChanges}>✖</button
          >
        {:else}
          <button
            title="delete this byte"
            id="insert-delete"
            class="delete"
            on:click={commitChanges}>✖</button
          >
          <button class="insert" disabled>&#8676;</button>
          <button class="submit" disabled>&#8645;</button>
          <button class="insert" disabled>&#8677;</button>
        {/if}
      </div>
      {#if $focusedViewportId === 'physical'}
        <button
          class={$UIThemeCSSClass +
            ' flex-container row col-item switch-viewport'}
          title="Show in Logical View"
          on:click={moveEditByteWindow}>&#8649;</button
        >
      {:else}
        <button
          class={$UIThemeCSSClass +
            ' flex-container row col-item switch-viewport'}
          title="Show in Physical View"
          on:click={moveEditByteWindow}>&#8647;</button
        >
      {/if}
      {#if !$commitable && $commitErrMsg.length > 0}
        <div
          style="background-color: black; opacity: 0.75; border-radius: 5px; margin: 4px; padding: 4px;"
        >
          <span class="errMsg">{$commitErrMsg}</span>
        </div>
      {/if}
    </div>
    <textarea
      class={$UIThemeCSSClass + ' address_vw'}
      id="address"
      contenteditable="true"
      readonly
      bind:this={address_vwRef}
      bind:innerHTML={addressText}
      on:scroll={scrollHandle}
    />
    {#if $editMode === 'simple'}
      <textarea
        class={$UIThemeCSSClass}
        id="physical"
        contenteditable="true"
        readonly
        bind:this={physical_vwRef}
        bind:innerHTML={physicalDisplayText}
        on:scroll={scrollHandle}
        on:click={handleViewportClickEvent}
      />
      <textarea
        class={$UIThemeCSSClass}
        id="logical"
        contenteditable="true"
        readonly
        bind:this={logical_vwRef}
        bind:innerHTML={logicalDisplayText}
        on:scroll={scrollHandle}
        on:click={handleViewportClickEvent}
      />
    {:else}
      <textarea
        class={$UIThemeCSSClass}
        id="physical"
        contenteditable="true"
        readonly
        bind:this={physical_vwRef}
        bind:innerHTML={physicalDisplayText}
        on:select={handleSelectionEvent}
        on:scroll={scrollHandle}
      />
      <textarea
        class={$UIThemeCSSClass}
        id="logical"
        contenteditable="true"
        readonly
        bind:this={logical_vwRef}
        bind:innerHTML={logicalDisplayText}
        on:select={handleSelectionEvent}
        on:scroll={scrollHandle}
      />
    {/if}
    <div class="editView" id="edit_view">
      {#if $editMode === 'full'}
        <textarea
          class={$UIThemeCSSClass}
          id="selectedContent"
          contenteditable="true"
          bind:value={$editorSelection}
          on:keyup|nonpassive={handleEditorEvent}
          on:click={handleEditorEvent}
          on:input={handleEditorEvent}
        />
      {:else}
        <textarea class={$UIThemeCSSClass} id="selectedContent" disabled />
      {/if}
      <!-- Full Mode Content Controls -->
      {#if $editMode === 'full'}
        <fieldset class="box margin-top">
          <legend
            >Content Controls
            {#if !$commitable}
              <span class="errMsg">{$commitErrMsg}</span>
            {/if}
          </legend>
          <div class="contentControls" id="content_controls">
            <!-- Commitable was not reactable to selection data zeroing -->
            {#if $commitable}
              <button
                class={$UIThemeCSSClass}
                id="commit_btn"
                on:click={commitChanges}>Commit</button
              >
            {:else}
              <button class={$UIThemeCSSClass} id="commit_btn" disabled
                >Commit</button
              >
            {/if}
            <span>
              {#if $undoCount > 0}
                <button class={$UIThemeCSSClass} on:click={redo}
                  >Redo ({$undoCount})</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Redo</button>
              {/if}
              {#if $changeCount > 0}
                <button class={$UIThemeCSSClass} on:click={undo}
                  >Undo ({$changeCount})</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Undo</button>
              {/if}
              {#if $undoCount + $changeCount > 0}
                <button class={$UIThemeCSSClass} on:click={clearChangeStack}
                  >Revert All</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Revert All</button>
              {/if}
            </span>
          </div>
        </fieldset>
        <fieldset class="box margin-top">
          <legend>Data View</legend>
          <div class="flex-container col">
            <div class="flex-container col-item center row">
              <div class="flex-container row center row-item">
                <label for="endianness">Endianness: </label>
                <select
                  id="endianness"
                  class={$UIThemeCSSClass}
                  bind:value={$dataViewEndianness}
                >
                  {#each endiannessOpt as { name, value }}
                    <option {value}>{name}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="flex-container col-item center row">
              <div class="grid-container-column">
                <div id="data_vw">
                  <label for="offset_dv"
                    >&nbsp;Offset: <text-field
                      id="offset_dv"
                    />{$dataViewOffsetText}</label
                  >
                  <span id="b8_dv">
                    <br /><label for="int8_dv"
                      >&nbsp;&nbsp;&nbsp;int8: <text-field
                        id="int8_dv"
                      />{$int8}</label
                    >
                    <br /><label for="uint8_dv"
                      >&nbsp;&nbsp;uint8: <text-field
                        id="uint8_dv"
                      />{$uint8}</label
                    >
                  </span>
                  <span id="b16_dv">
                    <br /><label for="int16_dv"
                      >&nbsp;&nbsp;int16: <text-field
                        id="int16_dv"
                      />{$int16}</label
                    >
                    <br /><label for="uint16_dv"
                      >&nbsp;uint16: <text-field
                        id="uint16_dv"
                      />{$uint16}</label
                    >
                  </span>
                  <span id="b32_dv">
                    <br /><label for="int32_dv"
                      >&nbsp;&nbsp;int32: <text-field
                        id="int32_dv"
                      />{$int32}</label
                    >
                    <br /><label for="uint32_dv"
                      >&nbsp;uint32: <text-field
                        id="uint32_dv"
                      />{$uint32}</label
                    >
                    <br /><label for="float32_dv"
                      >float32: <text-field id="float32_dv" />{$float32}</label
                    >
                  </span>
                  <span id="b64_dv">
                    <br /><label for="int64_dv"
                      >&nbsp;&nbsp;int64: <text-field
                        id="int64_dv"
                      />{$int64}</label
                    >
                    <br /><label for="uint64_dv"
                      >&nbsp;uint64: <text-field
                        id="uint64_dv"
                      />{$uint64}</label
                    >
                    <br /><label for="float64_dv"
                      >float64: <text-field id="float64_dv" />{$float64}</label
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
        <!-- Simple Mode Content Controls -->
      {:else}
        <fieldset class="box margin-top">
          <legend>Content Controls </legend>
          <div class="contentControls" id="content_controls">
            <span>
              {#if $undoCount > 0}
                <button class={$UIThemeCSSClass} on:click={redo}
                  >Redo ({$undoCount})</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Redo</button>
              {/if}
              {#if $changeCount > 0}
                <button class={$UIThemeCSSClass} on:click={undo}
                  >Undo ({$changeCount})</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Undo</button>
              {/if}
              {#if $undoCount + $changeCount > 0}
                <button class={$UIThemeCSSClass} on:click={clearChangeStack}
                  >Revert All</button
                >
              {:else}
                <button class={$UIThemeCSSClass} disabled>Revert All</button>
              {/if}
            </span>
          </div>
        </fieldset>
        <fieldset class="box margin-top">
          <legend>Data View</legend>

          <div class="grid-container-single-column">
            <div class="grid-container-column">
              <div class="flex-container col-item center row">
                <div class="flex-container row center row-item">
                  <label for="endianness">Endianness: </label>
                  <select
                    id="endianness"
                    class={$UIThemeCSSClass}
                    bind:value={$dataViewEndianness}
                  >
                    {#each endiannessOpt as { name, value }}
                      <option {value}>{name}</option>
                    {/each}
                  </select>
                </div>
              </div>
              <div class="grid-container-column">
                <div id="data_vw">
                  <label for="offset_dv"
                    >&nbsp;Offset: <text-field
                      id="offset_dv"
                    />{$dataViewOffsetText}</label
                  >
                  <span id="b8_dv">
                    <br /><label for="int8_dv"
                      >&nbsp;&nbsp;&nbsp;int8: <text-field
                        id="int8_dv"
                      />{$int8}</label
                    >
                    <br /><label for="uint8_dv"
                      >&nbsp;&nbsp;uint8: <text-field
                        id="uint8_dv"
                      />{$uint8}</label
                    >
                  </span>
                  <span id="b16_dv">
                    <br /><label for="int16_dv"
                      >&nbsp;&nbsp;int16: <text-field
                        id="int16_dv"
                      />{$int16}</label
                    >
                    <br /><label for="uint16_dv"
                      >&nbsp;uint16: <text-field
                        id="uint16_dv"
                      />{$uint16}</label
                    >
                  </span>
                  <span id="b32_dv">
                    <br /><label for="int32_dv"
                      >&nbsp;&nbsp;int32: <text-field
                        id="int32_dv"
                      />{$int32}</label
                    >
                    <br /><label for="uint32_dv"
                      >&nbsp;uint32: <text-field
                        id="uint32_dv"
                      />{$uint32}</label
                    >
                    <br /><label for="float32_dv"
                      >float32: <text-field id="float32_dv" />{$float32}</label
                    >
                  </span>
                  <span id="b64_dv">
                    <br /><label for="int64_dv"
                      >&nbsp;&nbsp;int64: <text-field
                        id="int64_dv"
                      />{$int64}</label
                    >
                    <br /><label for="uint64_dv"
                      >&nbsp;uint64: <text-field
                        id="uint64_dv"
                      />{$uint64}</label
                    >
                    <br /><label for="float64_dv"
                      >float64: <text-field id="float64_dv" />{$float64}</label
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      {/if}
    </div>
  </main>
  <hr />
  <div class="omega-latency flex-container row center">
    <div>Powered by Ωedit v{serverVersion} on port {omegaEditPort}</div>
    <div class="latency-group flex-container row center">
      <svg class="latency-indicator">
        {#if serverLatency < 20}
          <circle cx="50%" cy="50%" r="4pt" fill="green" />
        {:else if serverLatency < 35}
          <circle cx="50%" cy="50%" r="4pt" fill="yellow" />
        {:else if serverLatency > 50}
          <circle cx="50%" cy="50%" r="4pt" fill="red" />
        {:else}
          <circle cx="50%" cy="50%" r="4pt" fill="grey" />
        {/if}
      </svg>
      <div class="latency-text">{serverLatency}ms</div>
    </div>
  </div>
</body>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  body.light {
    color: #02060b;
  }
  body.dark {
    color: #e1e3e5;
  }
  div.flex-container {
    display: flex;
  }

  div.flex-container.wrap {
    flex-wrap: wrap;
  }

  div.flex-container.row {
    flex-direction: row;
  }

  div.flex-container.row .row-item {
    width: 100%;
  }

  div.flex-container.row .two-row-items {
    width: 50%;
  }

  div.flex-container.row .row-item.search-case {
    width: 50%;
  }

  div.flex-container.row .row-item.search-case input {
    width: 0;
    width: 50%;
  }

  div.flex-container.col {
    flex-direction: column;
  }

  div.col-item {
    margin-top: 2pt;
  }

  div.flex-container.center {
    align-items: center;
  }

  div.flex-container.end {
    justify-content: flex-end;
  }

  div.flex-container.center-items {
    align-items: center;
  }

  div.omega-latency {
    width: 100%;
    height: 25pt;
    font-style: italic;
    opacity: 0.8;
  }

  div.omega-latency div.latency-group div.latency-text {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }

  div.omega-latency div.latency-group {
    width: auto;
    height: 100%;
  }

  div.omega-latency div.latency-group:hover div.latency-text {
    opacity: 1;
  }

  div.border-sm {
    border-width: 1pt;
    border-color: white;
    border-style: solid;
  }

  div.file-name {
    hyphens: none;
    overflow-wrap: anywhere;
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

  @keyframes spin {
    100% {
      rotate: 360deg;
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  svg.loader.sm {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  svg.loader circle {
    fill: none;
    stroke: #727272;
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 0.75s ease-in-out infinite;
  }

  svg.latency-indicator {
    height: 100%;
    width: 15pt;
  }
  /* fonts */
  main {
    font-family: monospace;
    min-height: 100%;
  }

  legend {
    font-weight: bold;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    max-height: 150pt;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header fieldset {
    width: 100%;
  }

  header label.file-metrics {
    font-weight: bold;
  }

  header fieldset button {
    min-width: 50pt;
    margin: 0;
    margin-right: 5pt;
    margin-top: 5pt;
  }

  header div.header-container {
    display: flex;
    justify-content: center;
    width: 100%;
    transition: all 0.5s;
  }

  header div.display-icons {
    justify-content: space-between;
    margin-top: 5px;
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

  header div.flex-container-col {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  header div.file-metrics span {
    font-weight: normal;
  }

  header div.grid-container-two-columns {
    display: flex;
    padding-top: 5px;
  }

  header div.grid-container-single-column {
    padding-top: 5px;
    width: 100%;
  }

  header div.grid-container-two-columns div.grid-container-column {
    width: 50%;
  }

  header div.grid-container-column {
    width: 100%;
  }

  header input {
    width: 95%;
  }

  fieldset {
    padding: 5px;
  }

  fieldset.file-metrics {
    min-width: 200pt;
  }

  fieldset.search-replace {
    overflow: scroll;
  }

  input,
  select {
    border-width: 0;
    padding-top: 2px;
    padding-bottom: 2px;
    font-weight: bold;
    border-width: 1pt;
    border-style: solid;
  }

  input.dark {
    background-color: #101821;
    color: #e1e3e5;
    border-color: #687483;
  }

  select.dark {
    background-color: #101821;
    color: #e1e3e5;
    border-color: #687483;
  }

  input.light {
    background-color: #e1e3e5;
    color: #02060b;
    border-color: #2f3e4f;
  }

  select.light {
    background-color: #e1e3e5;
    color: #02060b;
    border-color: #2f3e4f;
  }

  textarea {
    color: inherit;
    background-color: inherit;
    font: inherit;
    resize: none;
    width: auto;
    border: 0;
  }

  button {
    padding: 5px;
    display: inline-block;
    border-radius: 4px;
    border-width: 0;
    font-weight: bold;
    margin-bottom: 5px;
    cursor: pointer;
    border-width: 1pt;
    border-style: solid;
  }

  button.dark {
    background-color: #322716;
    color: #fffdfa;
    border-color: #c8b69b;
  }

  button.light {
    background-color: #c8b69b;
    color: #322716;
    border-color: #322716;
  }

  .dataEditor {
    display: grid;
    /* I think this should be 32em instead of 19em for 32 characters, but that didn't work */
    grid-template-columns: max-content max-content max-content auto;
    grid-template-rows: max-content max-content auto;
    gap: 1px;
    overflow: auto;
    min-height: 640px;
    height: 100%;
    font-family: monospace;
  }

  /* display of binary encoded data takes more space in the physical view */
  .dataEditor.binary {
    /* I think this should be 16em instead of 10em for 16 characters, but that didn't work */
    grid-template-columns: max-content max-content 10em auto;
  }

  .dataEditor div {
    resize: none;
  }

  .dataEditor div.hd {
    text-align: center;
    font-weight: bold;
    color: #fffdfa;
  }

  .dataEditor div.hd.dark {
    background-color: #2f3e4f;
  }

  .dataEditor div.hd.light {
    background-color: #687483;
  }

  .dataEditor div.measure {
    display: flex;
  }

  .dataEditor div.measure.dark {
    display: flex;
    background-color: #101821;
    color: #e1e3e5;
  }

  .dataEditor div.measure.light {
    display: flex;
    background-color: #e1e3e5;
    color: #02060b;
  }

  .dataEditor div.measure.selection {
    flex-direction: row;
  }

  .dataEditor div.measure.selection sub {
    opacity: 0.6;
  }

  .dataEditor div.measure span {
    align-self: flex-end;
  }

  .dataEditor div.measure div {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .dataEditor div.measure div.clear-selection {
    width: 20pt;
    font-size: 11pt;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s;
  }

  .dataEditor div.measure div.clear-selection:hover {
    font-size: 14pt;
  }

  .dataEditor div.contentControls .grid-container-two-columns {
    display: flex;
  }

  .dataEditor
    div.contentControls
    .grid-container-two-columns
    div.grid-container-column {
    width: 50%;
    padding: 5px;
  }

  .dataEditor div.content-select-column {
    width: 50%;
  }

  .dataEditor div.content-select-container {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .dataEditor div.content-select-container label {
    width: 100%;
  }

  .dataEditor div.edit-byte-window {
    width: 95pt;
    height: 16pt;
    display: none;
    position: absolute;
    transition: all 0.1s;
    z-index: 1;
  }

  .dataEditor div.edit-byte-window input {
    width: 30%;
    border-width: 1px;
    text-align: center;
  }

  .dataEditor div.edit-byte-window input.dark {
    background-color: #322716;
  }

  .dataEditor div.edit-byte-window input.light {
    background-color: #fffdfa;
  }

  .dataEditor div.edit-byte-window button {
    padding: 0;
    margin: 0;
    height: 100%;
    width: 20pt;
  }

  .dataEditor div.edit-byte-window button.switch-viewport {
    padding: 1pt;
    background-color: lightyellow;
    color: darkslategrey;
  }

  .dataEditor div.edit-byte-window button:disabled {
    opacity: 0.6;
  }

  button.submit {
    background: green;
    color: #e1e3e5;
  }

  button.delete {
    background: red;
    color: #e1e3e5;
  }

  button.insert {
    background: darkorchid;
    color: #e1e3e5;
  }

  button.goto {
    max-width: 15pt;
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    color: var(--vscode-button-foreground);
  }

  .dataEditor textarea {
    display: block;
    word-break: break-all;
    white-space: break-spaces;
    box-sizing: content-box;
    height: 100%;
    width: 100%;
  }

  .dataEditor textarea.address_vw {
    text-align: right;
    direction: rtl;
    user-select: none;
    cursor: not-allowed;
    pointer-events: none;
    max-width: 100px;
    padding-right: 10pt;
    font-weight: 700;
  }

  .dataEditor select.address_type {
    height: 100%;
  }

  .dataEditor textarea.dark {
    background-color: #101821;
    color: #fffdfa;
  }

  .dataEditor textarea.light {
    background-color: #e1e3e5;
    color: #02060b;
  }

  .dataEditor div.editView {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr max-content;
    overflow-x: hidden;
    word-break: break-all;
  }

  .dataEditor textarea.selectedContent {
    background: #2c2c2c;
  }

  .dataEditor textarea.selectedContent:disabled {
    background: #252526;
  }

  .dataEditor button {
    padding: 10px;
    margin-right: 5px;
    transition: all 0.5s;
  }

  .dataEditor select.content-select {
    float: right;
    max-width: 110px;
  }

  .grid-container-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .errMsg {
    color: red;
    max-width: 95%;
  }

  .warningMsg {
    color: yellow;
    max-width: 95%;
  }

  .margin-top {
    margin-top: 5px;
  }

  .search {
    min-width: 250px;
    max-width: 250px;
  }

  .x-hidden {
    overflow-x: hidden;
  }

  .no-margin {
    margin: 0 0 0 0;
  }

  .margin-right {
    margin-right: 5pt;
  }

  #address_numbering {
    min-width: 100%;
  }
</style>
