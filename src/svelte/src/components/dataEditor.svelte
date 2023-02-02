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
    filesize,
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    selectedFileData,
    selectionStartStore,
    selectionEndStore,
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
    gotoOffsetMax,
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
    asciiCount,
    searching,
    searchData,
    searchable,
    editCount,
    searchResults,
    replaceData,
    replaceable,
    replaceErrMsg,
    selectionOriginalEnd,
    searchErrMsg,
    computedFilesize,
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
  } from '../utilities/display'
  import { vscode } from '../utilities/vscode'
  import { MessageCommand } from '../utilities/message'
  import { writable } from 'svelte/store'

  let filename = ''
  let filetype = ''
  let addressText: string
  let physicalOffsetText: string
  let physicalDisplayText = ''
  let logicalOffsetText: string
  let logicalDisplayText = ''
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let physical_vwRef: HTMLTextAreaElement,
    address_vwRef: HTMLTextAreaElement,
    logical_vwRef: HTMLTextAreaElement

  const selectedContent = writable(
    document.getElementById('selectedContent') as HTMLTextAreaElement
  )
  // Reactive Declarations
  $: addressText = makeAddressRange(
    $fileByteStart,
    $fileByteEnd,
    $bytesPerRow,
    $addressValue
  )
  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $selectionStartStore,
    $selectionEndStore,
    $selectionSize
  )
  $: {
    physicalOffsetText = getOffsetDisplay($displayRadix, 'physical')
    logicalOffsetText = getOffsetDisplay($displayRadix, 'logical')
  }
  $: physicalDisplayText = encodeForDisplay(
    $viewportData,
    $displayRadix,
    $bytesPerRow
  )
  $: setSelectionEncoding($editorEncoding)
  $: updateLogicalDisplay($bytesPerRow)
  $: goTo($gotoOffset)
  $: $rawEditorSelectionTxt = $editorSelection
    .replaceAll(dvHighlightTag.start, '')
    .replaceAll(dvHighlightTag.end, '')

  function requestEditedData(type: string) {
    if ($commitable) {
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          editType: type,
          editor: {
            selectionToFileOffset: $selectionStartStore,
            editedContent: $rawEditorSelectionTxt,
          },
          encoding: $editorEncoding,
        },
      })
    }
  }

  function goTo(offset: number) {
    if (physical_vwRef) {
      const rowCount = Math.ceil(physicalDisplayText.length / $bytesPerRow)
      const lineHeight = physical_vwRef.scrollHeight / rowCount
      const targetLine = Math.ceil(offset / $bytesPerRow)
      physical_vwRef.scrollTop = targetLine * lineHeight
    }
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

  function setSelectionEncoding(encoding: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        encoding: $editorEncoding,
        selectionData: $selectedFileData,
      },
    })
  }

  async function loadContent(data: Uint8Array) {
    viewportData.update(() => {
      return data
    })

    displayRadix.update(() => {
      return 16
    })

    $gotoOffset = 0
    $gotoOffsetMax = data.length

    vscode.postMessage({
      command: MessageCommand.updateLogicalDisplay,
      data: {
        viewportData: $viewportData,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function scrollHandle(e: Event) {
    let element = e.target.id
    if (!currentScrollEvt || currentScrollEvt === element) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element
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

  async function handleEditorEvent(e: Event) {
    switch (e.type) {
      case 'keyup':
        const kevent = e as KeyboardEvent
        $cursorPos = document.getSelection().anchorOffset
        if (
          ['Backspace', 'Return', 'Delete'].some((type) =>
            kevent.key.startsWith(type)
          )
        ) {
          editorSelection.update((str) => {
            $editCount -= 1
            return str
          })
          requestEditedData('remove')
        } else {
          editorSelection.update((str) => {
            $editCount += 1
            return str
          })
          requestEditedData('insert')
        }
        break
      default:
        editorSelection.update((str) => {
          return str
        })
        $cursorPos = document.getSelection().anchorOffset
        break
      case 'click':
        $cursorPos = document.getSelection().anchorOffset
        break
    }
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
      if (isWhitespace(selected.value.at(selectionStart))) {
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
        start: selectionStart / 9,
        end: Math.floor((selectionEnd - 8) / 9 + 1),
      },
      8: {
        start: selectionStart / 4,
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      10: {
        start: selectionStart / 4,
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      16: {
        start: selectionStart / 3,
        end: Math.floor((selectionEnd - 2) / 3 + 1),
      },
    }

    selectionStartStore.update(() => {
      if (selected.id === 'logical') return selected.selectionStart / 2
      return selectionOffsetsByRadix[$displayRadix].start
    })
    selectionEndStore.update(() => {
      if (selected.id === 'logical')
        return Math.floor(selected.selectionEnd / 2)
      return selectionOffsetsByRadix[$displayRadix].end
    })
    selectionOriginalEnd.update(() => {
      if (selected.id === 'logical')
        return Math.floor(selected.selectionEnd / 2)
      return selectionOffsetsByRadix[$displayRadix].end
    })
  }

  function handleSelectionEvent(e: Event) {
    frameSelectedOnWhitespace(e.target as HTMLTextAreaElement)
    selectedFileData.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartStore, $selectionEndStore + 1)
      )
    })
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        selectionData: $selectedFileData,
        encoding: $editorEncoding,
      },
    })
  }

  function enableAdvanced(enable: boolean) {
    const advanced_elements = document.getElementsByClassName('advanced')
    for (let i = 0; i < advanced_elements.length; ++i) {
      const el = advanced_elements[i] as HTMLElement
      el.hidden = !enable
    }
  }

  function commitChanges() {
    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        selectionStart: $selectionStartStore,
        selectionData: $selectedFileData,
        selectionDataLen: $selectionOriginalEnd - $selectionStartStore,
      },
    })
  }

  function search() {
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchData,
        caseInsensitive: false,
      },
    })
    $searching = true
  }

  function searchAndReplace() {
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchData,
        caseInsensitive: false,
        replaceData: $replaceData,
      },
    })
  }

  function clearDataViewHighlight(event: Event) {
    editorSelection.update((str) => {
      return str
        .replaceAll(dvHighlightTag.start, '')
        .replaceAll(dvHighlightTag.end, '')
    })
  }

  function highlightDataView(event: Event) {
    const hoverEvent = event as MouseEvent
    let highlightLenModifier: number
    let highlightByteOffset: number
    let pos: number

    switch ($editorEncoding) {
      case 'hex':
        highlightLenModifier = 2
        break
      case 'binary':
        highlightLenModifier = 8
        break
      default:
        highlightLenModifier = 1
        break
    }
    switch (event.target.id) {
      case 'b8_dv':
        highlightByteOffset = highlightLenModifier
        break
      case 'b16_dv':
        highlightByteOffset = 2 * highlightLenModifier
        break
      case 'b32_dv':
        highlightByteOffset = 4 * highlightLenModifier
        break
      case 'b64_dv':
        highlightByteOffset = 8 * highlightLenModifier
        break
    }
    pos = $byteOffsetPos * highlightLenModifier
    editorSelection.update((str) => {
      let seg1 = str.substring(0, pos) + dvHighlightTag.start
      let seg2 =
        str.substring(pos, pos + highlightByteOffset) + dvHighlightTag.end
      let seg3 = str.substring(pos + highlightByteOffset)
      return seg1 + seg2 + seg3
    })
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case 'vpAll':
        loadContent(msg.data.viewportData)
        $editCount = 0
        break
      case MessageCommand.editorOnChange:
        editorSelection.update(() => {
          return msg.data.display
        })
        break
      case MessageCommand.requestEditedData:
        editorSelection.update(() => {
          return msg.data.display
        })
        selectedFileData.update(() => {
          return new Uint8Array(msg.data.data)
        })
        cursorPos.update(() => {
          return document.getSelection().anchorOffset
        })
        selectionEndStore.update(() => {
          return $selectionStartStore + $selectedFileData.byteLength - 1
        })
        break
      case MessageCommand.updateLogicalDisplay:
        logicalDisplayText = msg.data.data.logicalDisplay
        break
      case MessageCommand.fileInfo:
        if (typeof msg.data.data.filename !== 'undefined') {
          filename = msg.data.data.filename
        }
        if (typeof msg.data.data.filetype !== 'undefined') {
          filetype = msg.data.data.filetype
        }
        if (typeof msg.data.data.filesize !== 'undefined') {
          $filesize = msg.data.data.filesize
        }
        if (typeof msg.data.data.computedFilesize !== 'undefined') {
          $computedFilesize = msg.data.data.computedFilesize
        }
        break
      case MessageCommand.search:
        $searchResults = msg.data.searchResults
        $searching = false
        break
    }
  })
</script>

<header>
  <fieldset class="box">
    <legend>File Metrics</legend>
    <div class="file-metrics">
      <label for="file_name" class="file-metrics">File: </label><span id="file_name">{filename}</span>
      <hr />
      <label for="file_type" class="file-metrics">Type: </label><span id="file_type">{filetype}</span>
      <br /><label for="file_size" class="file-metrics">File Size: </label><span id="file_byte_cnt">{$filesize}</span>
      <br /><label for="computed_byte_cnt" class="file-metrics">Computed File Size: </label><span id="computed_byte_cnt">{$computedFilesize}</span>
      <br /><label for="ascii_count" class="file-metrics">ASCII count: </label><span id="ascii_byte_cnt">{$asciiCount}</span>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Offset</legend>
    <div class="goto_offset">
      <input
        type="number"
        id="goto_offset"
        min="0"
        max={$gotoOffsetMax}
        bind:value={$gotoOffset}
      />
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Radix</legend>
    <div class="radix">
      <select id="radix" bind:value={$displayRadix}>
        {#each radixOpt as { name, value }}
          <option {value}>{name}</option>
        {/each}
      </select>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Search</legend>
    <div class="search">
      Search:
      {#if $searchData.length > 0 && !$searchable}
        <span class="errMsg">{$searchErrMsg}</span>
      {/if}
      <input bind:value={$searchData} />
      <br />
      Replace:
      {#if $replaceData.length > 0 && !$replaceable}
        <span class="errMsg">{$replaceErrMsg}</span>
      {/if}
      <input bind:value={$replaceData} />
      <br />
      {#if !$searchable}
        <button id="search_btn" disabled>Search</button>
      {:else}
        <button id="search_btn" on:click={search}>Search</button>
      {/if}
      {#if !$replaceable}
        <button id="replace_btn" disabled>Replace</button>
      {:else}
        <button id="replace_btn" on:click={searchAndReplace}>Replace</button>
      {/if}
      {#if $searching}
        <sub>Searching...</sub>
      {:else if $searchResults.length > 0}
        <sub>{$searchResults.length} Results </sub>
      {/if}
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Misc</legend>
    <div class="misc">
      <label for="advanced_mode">Advanced Mode</label>
      <input type="checkbox" id="advanced_mode" disabled />
    </div>
  </fieldset>
</header>

<main class="dataEditor" id="data_editor">
  <div class="hd">Address</div>
  <div class="hd">Physical</div>
  <div class="hd">Logical</div>
  <div class="hd">Edit</div>
  <div class="measure" style="align-items: center;">
    <select
      class="address_type"
      id="address_numbering"
      bind:value={$addressValue}
    >
      {#each addressOpt as { name, value }}
        <option {value}>{name}</option>
      {/each}
    </select>
  </div>
  <div class="measure">
    <span id="physical_offsets">
    {@html physicalOffsetText}
    </span>
  </div>
  <div class="measure">
    <span id="logical_offsets">
    {@html logicalOffsetText}
    </span>
  </div>
  <div class="measure">
    <div>
      <span id="selected_offsets"
        >{selectionOffsetText}</span
      >
      {#if $cursorPos}
        <span> | cursor: {$cursorPos}</span>
      {/if}
      <span id="editor_offsets"></span>
    </div>
  </div>
  <textarea
    class="address_vw"
    id="address"
    contenteditable="true"
    readonly
    bind:this={address_vwRef}
    bind:innerHTML={addressText}
    on:scroll={scrollHandle}></textarea>
  <textarea
    class="physical_vw"
    id="physical"
    contenteditable="true"
    readonly
    bind:this={physical_vwRef}
    bind:innerHTML={physicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}></textarea>
  <textarea
    class="logicalView"
    id="logical"
    contenteditable="true"
    readonly
    bind:this={logical_vwRef}
    bind:innerHTML={logicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}></textarea>
  <div class="editView" id="edit_view">
    <div
      class="selectedContent"
      id="editor"
      contenteditable="true"
      bind:this={$selectedContent}
      bind:innerHTML={$editorSelection}
      on:keyup|nonpassive={handleEditorEvent}
      on:click={handleEditorEvent}
      on:input={handleEditorEvent}
    />
    <fieldset class="box margin-top">
      <legend
        >Content Controls
        {#if !$commitable}
          <span class="errMsg">{$commitErrMsg}</span>
        {/if}
      </legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div>
            {#if $commitable}
              <button id="commit_btn" on:click={commitChanges}
                >Commit Changes</button
              >
            {:else}
              <button id="commit_btn" disabled>Commit Changes</button>
            {/if}
            <br />
            Committed changes: <span id="change_cnt">0</span>
          </div>
          <div>
            <button id="add_data_breakpoint_btn" disabled>Set Breakpoint</button
            >
            <br />
            Breakpoints: <span id="data_breakpoint_cnt">0</span>
          </div>
        </div>
        <hr />
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
            <div class="content-select-column">
              <div class="content-select-container">
                <label for="endianness">Endianness:</label>
                  <select class="content-select" bind:value={$dataViewEndianness}>
                    {#each endiannessOpt as { name, value }}
                      <option {value}>{name}</option>
                    {/each}
                  </select>
              </div>
              <div class="content-select-container">
                <label for="edit_encoding">Encoding:</label>
                  <select class="content-select" bind:value={$editorEncoding}>
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
            <div class="advanced" hidden>
              <label for="lsb"
                >Least significant bit:
                <select id="lsb">
                  {#each lsbOpt as { name, value }}
                    <option {value}>{name}</option>
                  {/each}
                </select>
              </label>
            </div>
            <div class="advanced" hidden>
              <label for="logical_byte_size"
                >Logical byte size:
                <select id="logical_byte_size">
                  {#each byteSizeOpt as { value }}
                    <option {value}>{value}</option>
                  {/each}
                </select>
              </label>
            </div>
          </div>
          <div class="grid-container-column">
            <div id="data_vw">
              &nbsp;Offset: <span id="offset_dv" contenteditable="true"
                >{$byteOffsetPos}</span
              >
              <span
                id="b8_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int8_dv"
                  >&nbsp;&nbsp;&nbsp;int8: <text-field
                    id="int8_dv"
                    contenteditable="true"
                    bind:textContent={$int8}></text-field></label
                >
                <br /><label for="uint8_dv"
                  >&nbsp;&nbsp;uint8: <text-field
                    id="uint8_dv"
                    contenteditable="true"
                    bind:textContent={$uint8}></text-field></label
                >
              </span>
              <span
                id="b16_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int16_dv"
                  >&nbsp;&nbsp;int16: <text-field
                    id="int16_dv"
                    contenteditable="true"
                    bind:textContent={$int16}></text-field></label
                >
                <br /><label for="uint16_dv"
                  >&nbsp;uint16: <text-field
                    id="uint16_dv"
                    contenteditable="true"
                    bind:textContent={$uint16}></text-field></label
                >
              </span>
              <span
                id="b32_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int32_dv"
                  >&nbsp;&nbsp;int32: <text-field
                    id="int32_dv"
                    contenteditable="true"
                    bind:textContent={$int32}></text-field></label
                >
                <br /><label for="uint32_dv"
                  >&nbsp;uint32: <text-field
                    id="uint32_dv"
                    contenteditable="true"
                    bind:textContent={$uint32}></text-field></label
                >
                <br /><label for="float32_dv"
                  >float32: <text-field
                    id="float32_dv"
                    contenteditable="true"
                    bind:textContent={$float32}></text-field></label
                >
              </span>
              <span
                id="b64_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int64_dv"
                  >&nbsp;&nbsp;int64: <text-field
                    id="int64_dv"
                    contenteditable="true"
                    bind:textContent={$int64}></text-field></label
                >
                <br /><label for="uint64_dv"
                  >&nbsp;uint64: <text-field
                    id="uint64_dv"
                    contenteditable="true"
                    bind:textContent={$uint64}></text-field></label
                >
                <br /><label for="float64_dv"
                  >float64: <text-field
                    id="float64_dv"
                    contenteditable="true"
                    bind:textContent={$float64}></text-field></label
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  </div>
</main>
<hr />

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  /* CSS reset */
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
    font-weight: normal;
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
    flex: 0 1 auto;
  }

  header fieldset button {
    margin-right: 5px;
    margin-top: 10px;
  }

  header label.file-metrics {
    font-weight: bold;
  }

  header div.file-metrics span {
    font-weight: normal;
  }

  fieldset {
    padding: 5px;
  }

  input,
  select {
    background-color: #3c3c3c;
    color: white;
    border-width: 0;
    padding-top: 2px;
    padding-bottom: 2px;
    font-weight: bold;
  }

  header input {
    padding-left: 5px;
    width: 95%;
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
    background-color: #727272;
    color: #FFFFFF;
    font-weight: bold;
    margin-bottom: 5px;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    color: #3a3838;
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

  .dataEditor textarea {
    display: block;
    word-break: break-all;
    white-space: break-spaces;
    box-sizing: content-box;
    height: 100%;
    width: 100%;
  }

  .dataEditor div.hd {
    background: #767676;
    text-align: center;
    font-weight: bold;
  }

  .dataEditor div.measure {
    display: flex;
  }

  .dataEditor div.measure span {
    align-self: flex-end;
  }

  .dataEditor div.contentControls .grid-container-two-columns {
    display: flex;
    padding: 5px;
  }
  
  .dataEditor div.contentControls .grid-container-two-columns div.grid-container-column {
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

  .dataEditor textarea.address_vw {
    text-align: right;
    direction: rtl;
    user-select: none;
    cursor: not-allowed;
    pointer-events: none;
    max-width: 100px;
  }

  .dataEditor textarea.physical_vw {
    background: #4c4c4c;
  }

  .dataEditor textarea.logicalView {
    background: #3c3c3c;
  }

  .dataEditor div.editView {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr max-content;
    overflow-x: hidden;
    word-break: break-all;
  }

  .dataEditor div.selectedContent {
    background: #2c2c2c;
  }

  .dataEditor button {
    padding: 10px;
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

  #address_numbering {
    min-width: 100%;
  }
</style>
