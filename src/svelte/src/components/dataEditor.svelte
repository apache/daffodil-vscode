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
    provideVSCodeDesignSystem,
    vsCodeButton,
    vsCodeCheckbox,
    vsCodeDropdown,
    vsCodeOption,
    vsCodeTextField, } from '@vscode/webview-ui-toolkit'
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
    selectionActive,
    commitable,
    dataView, 
    byteOffsetPos,
    dataViewLookAhead,
    editedCount,
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
    float64
    } from '../stores'
  import { 
    radixOpt, 
    encoding_groups, 
    endiannessOpt, 
    lsbOpt, 
    byteSizeOpt, 
    addressOpt, 
    getOffsetDisplay as getOffsetText,
    encodeForDisplay,
    makeAddressRange, 
    countAscii } from '../utilities/display';
  import { vscode } from '../utilities/vscode'
  import { MessageCommand } from '../utilities/message'
  import { writable, derived, readable } from 'svelte/store';

  provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDropdown(),
    vsCodeOption(),
    vsCodeTextField()
  )
  let filename = ''
  let filetype = ''
  let addressText = ''
  let physicalOffsetText = ''
  let physicalDisplayText = ''
  let logicalOffsetText = ''
  let logicalDisplayText = ''
  let editorTextDisplay = ''
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let physical_vwRef: HTMLTextAreaElement, address_vwRef: HTMLTextAreaElement, logical_vwRef: HTMLTextAreaElement

  const selectedContent = readable(document.getElementById('selectedContent') as HTMLTextAreaElement)
  const asciiCount = derived(viewportData, $viewportData=>{
    return countAscii($viewportData)
  })
  // Reactive Declarations
  $: addressText = makeAddressRange($fileByteStart, $fileByteEnd, $bytesPerRow, $addressValue)
  $: selectionOffsetText = setSelectionOffsetInfo('Selection', $selectionStartStore, $selectionEndStore, $cursorPos)
  $: {
    physicalOffsetText = getOffsetText($displayRadix, 'physical')
    logicalOffsetText = getOffsetText($displayRadix, 'logical')
  }
  $: physicalDisplayText = encodeForDisplay($viewportData, $displayRadix, $bytesPerRow)
  $: setSelectionEncoding($editorEncoding)
  $: updateLogicalDisplay($bytesPerRow)
  $: goTo($gotoOffset)

  function requestEditedData(type: string) {
    if($commitable){
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          editType: type,
          editor: {
            selectionToFileOffset: $selectionStartStore,
            editedContent: $editorSelection
          },
          encoding: $editorEncoding
        }
      })
    }

  }

  function goTo(offset: number){
    if(physical_vwRef){
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
        bytesPerRow: bytesPerRow
      } 
    })
  }

  function setSelectionEncoding(encoding: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        encoding: $editorEncoding,
        selectionData?: $selectedFileData
      }
    })
  }

  async function loadContent(data: Uint8Array) {
    
    viewportData.update(() => {
      return data
    })

    filesize.update(() => {
      return data.length
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
        bytesPerRow: $bytesPerRow
      }
    })
  }

  function scrollHandle(e: Event){
    let element = e.target.id
    if (!currentScrollEvt || currentScrollEvt === element){
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element
      switch(currentScrollEvt){
        case 'physical':
          syncScroll(
            physical_vwRef,
            address_vwRef
          )
          syncScroll(
            physical_vwRef,
            logical_vwRef
          )
        break
        case 'logical':
          syncScroll(
            logical_vwRef,
            address_vwRef
          )
          syncScroll(
            logical_vwRef,
            physical_vwRef,
          )
        break
        case 'address':
          syncScroll(
            address_vwRef,
            physical_vwRef,
          )
          syncScroll(
            address_vwRef,
            logical_vwRef
          )
        break
      }
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }

  function syncScroll(from: HTMLElement, to: HTMLElement) {
    // Scroll the "to" by the same percentage as the "from"
    if(from && to) {
      const sf = from.scrollHeight - from.clientHeight
      if (sf >= 1) {
        const st = to.scrollHeight - to.clientHeight
        to.scrollTop = (st / 100) * ((from.scrollTop / sf) * 100)
      }
    }
  }

  function setSelectionOffsetInfo(from: string, start: number, end: number, size: number, cursorPos?: number):string {
    return `${from} [${start} - ${end}] Size: ${$selectionSize} `
  }

  async function handleEditorEvent(e: Event) {
    let editedType: string
    switch(e.type) {
      case 'keyup':
        const kevent = e as KeyboardEvent
        if (['Up','Right','Home'].some((type) => kevent.key.includes(type))) {
          cursorPos.update(pos=>{
            if(pos+1 > $editorSelection.length)
              return pos
            return ++pos
          })
        }
        else if(['Backspace', 'Return', 'Delete'].some((type)=> kevent.key.startsWith(type))) {
          editorSelection.update(str=>{
            return str
          })
          cursorPos.update(pos=>{
            if($commitable)
              return --pos
            return pos
          })
          requestEditedData('remove')
        }
        else if (['Down','Left','End'].some((type) => kevent.key.includes(type))) {
          cursorPos.update(pos=>{
            if(pos-1 < 0)
              return pos
            return --pos
          })
        }
        else {
          editorSelection.update(str=>{
            return str
          })
          cursorPos.update(pos=>{
            if($commitable)
              return ++pos
            return pos
          })
          requestEditedData('insert')
        }
      break
      default:
        editorSelection.update(str=>{
          return str
        })
        cursorPos.update(()=>{
          return $selectedContent.selectionStart
        })
      break
      case 'click':
        cursorPos.update(()=>{
          return $selectedContent.selectionStart
        })
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
      selected.selectionEnd = selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
    }
    const selectionOffsetsByRadix = {
      2: { start: selectionStart / 9, end: Math.floor((selectionEnd - 8) / 9 + 1) },
      8: { start: selectionStart / 4, end: Math.floor((selectionEnd - 3) / 4 + 1) },
      10: { start: selectionStart / 4, end: Math.floor((selectionEnd  - 3) / 4 + 1) },
      16: { start: selectionStart / 3, end: Math.floor((selectionEnd  - 2) / 3 + 1) },
    }

    selectionStartStore.update(()=>{
      if(selected.id === 'logical')
        return selected.selectionStart / 2
      return selectionOffsetsByRadix[$displayRadix].start
    })
    selectionEndStore.update(()=>{
      if(selected.id === 'logical')
        return Math.floor(selected.selectionEnd / 2)
      return selectionOffsetsByRadix[$displayRadix].end
    })
  }

  function handleSelectionEvent(e: Event){
    frameSelectedOnWhitespace(e.target as HTMLTextAreaElement)
    selectedFileData.update(()=>{
      return Uint8Array.from($viewportData.subarray($selectionStartStore, $selectionEndStore+1))
    })
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        selectionData: $selectedFileData,
        encoding: $editorEncoding        
      }
    })
  }

  function isWhitespace(c: string | undefined): boolean {
    return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
  }

  function enableAdvanced(enable: boolean) {
    const advanced_elements = document.getElementsByClassName('advanced')
    for (let i = 0; i < advanced_elements.length; ++i) {
      const el = advanced_elements[i] as HTMLElement
      el.hidden = !enable
    }
  }

  function commitChanges(){
    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        selectionStart: $selectionStartStore,
        selectionData: $selectedFileData,
        selectionDataLen: $selectedFileData.byteLength
      }
    })
  }

  const searchData = writable('')
  const searching = writable(false)
  function search(){
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchData,
        filesize: $filesize,
        caseInsensitive: false
      }
    })
    $searching = true
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case 'vpAll':
        loadContent(msg.data.viewportData)
        break
      case MessageCommand.editorOnChange:
        editorSelection.update(()=>{
          return msg.data.display
        })
        break
      case MessageCommand.requestEditedData:
        editorSelection.update(()=>{
          return msg.data.display
        })
        selectedFileData.update(()=>{
          return new Uint8Array(msg.data.data)
        })
        cursorPos.update(()=>{
          return $selectedContent.selectionStart
        })
        selectionEndStore.update(()=>{
          return $selectionStartStore + $selectedFileData.byteLength-1 
        })
        break
      case MessageCommand.updateLogicalDisplay:
        logicalDisplayText = msg.data.data.logicalDisplay
        break
      case MessageCommand.fileInfo:
        filename = msg.data.data.filename
        filetype = msg.data.data.filetype
        break
      case MessageCommand.search:
        let results = msg.data.searchResults
        $searching = false
        console.log(results)
        break
      }
  })

</script>

<header>
  <fieldset class="box">
    <legend>File Metrics</legend>
    <div id="file_metrics_vw">
      File: <span id="file_name">{filename}</span>
      <hr />
      Type:<span id="file_type">{filetype}</span>
      <br />Size: <span id="file_byte_cnt">{$filesize}</span>
      <br />ASCII count: <span id="ascii_byte_cnt">{$asciiCount}</span>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Offset</legend>
    <div class="goto_offset">
      <input type="number" id="goto_offset" min="0" max={$gotoOffsetMax} bind:value={$gotoOffset}/>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Radix</legend>
    <div class="radix">
      <select id="radix" bind:value={$displayRadix}>
        {#each radixOpt as {name, value}}
          <option {value}>{name}</option>
        {/each}
      </select>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Search</legend>
    <div class="search">
        Search:
      <input id="search_input" bind:value={$searchData}/>
        <!-- <section slot="end" style="display:flex; align-items: center;">
          <vscode-button appearance="icon" aria-label="Case Sensitive">
            <span class="codicon codicon-preserve-case" />
          </vscode-button>
          <vscode-button appearance="icon" aria-label="Case Insensitive">
            <span class="codicon codicon-case-sensitive" />
          </vscode-button>
        </section> -->
      Replace:<input id="replace_input" disabled/> 
      <br />
      <vscode-button id="search_btn" on:click={search}>Search</vscode-button>
      <vscode-button id="replace_btn" disabled>Replace</vscode-button>
      {#if $searching}
        <sub>Searching...</sub>
      {/if}
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Misc</legend>
    <div class="misc">
      <label for="advanced_mode"
        >Advanced Mode
        <vscode-checkbox id="advanced_mode" disabled />
    </div>
  </fieldset>
</header>

<main class="dataEditor" id="data_editor">
  <div class="hd">Address</div>
  <div class="hd">Physical</div>
  <div class="hd">Logical</div>
  <div class="hd">Edit</div>
  <div class="measure" style="align-items: center;">
    <select class="address_type" id="address_numbering" bind:value={$addressValue}>
    {#each addressOpt as {name, value}}
      <option {value}>{name}</option>
    {/each}
    </select>
  </div>
  <div class="measure"><span contenteditable='true' id="physical_offsets" bind:innerHTML={physicalOffsetText} readonly/></div>
  <div class="measure"><span contenteditable='true' id="logical_offsets" bind:innerHTML={logicalOffsetText} readonly/></div>
  <div class="measure">
    <div>
      <span id="selected_offsets" contenteditable="true" readonly>{selectionOffsetText}
      {#if $cursorPos}
      <span> | cursor: {$cursorPos}</span>
      {/if}
      <span id="editor_offsets" readonly/>
    </div>
  </div>
  <textarea class="address_vw" id="address" contenteditable="true" readonly bind:this={address_vwRef} bind:innerHTML={addressText} on:scroll={scrollHandle}/>
  <textarea class="physical_vw" id="physical" contenteditable="true" readonly bind:this={physical_vwRef} bind:innerHTML={physicalDisplayText} on:select={handleSelectionEvent} on:scroll={scrollHandle}/>
  <textarea class="logicalView" id="logical" contenteditable="true" readonly bind:this={logical_vwRef} bind:innerHTML={logicalDisplayText} on:select={handleSelectionEvent} on:scroll={scrollHandle}/>
  <div class="editView" id="edit_view">
    <textarea class="selectedContent" id="editor" contenteditable="true" bind:this={$selectedContent} bind:value={$editorSelection} on:keyup|nonpassive={handleEditorEvent} on:click={handleEditorEvent} on:input={handleEditorEvent}/>
    <fieldset class="box">
      <legend>Content Controls 
      {#if !$commitable}
        <span class='errMsg'>{$commitErrMsg}</span>
      {/if}
      </legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div>
          {#if $commitable}
            <vscode-button id="commit_btn" on:click={commitChanges}>Commit Changes</vscode-button>
          {:else}
            <vscode-button id="commit_btn" disabled>commit changes</vscode-button>
          {/if}
            <br />
            Committed changes: <span id="change_cnt">0</span>
          </div>
          <div>
            <vscode-button id="add_data_breakpoint_btn" disabled
              >set breakpoint</vscode-button
            >
            <br />
            Breakpoints: <span id="data_breakpoint_cnt">0</span>
          </div>
        </div>
        <hr />
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
            <div>
              <label for="endianness">Endianness:
                <select id="endianness" bind:value={$dataViewEndianness}>
                {#each endiannessOpt as {name, value}}
                  <option {value}>{name}</option>
                {/each}
                </select>
              </label>
            </div>
            <div>
              <label for="edit_encoding">Encoding:
                <select id="edit_encoding" bind:value={$editorEncoding}>
                  {#each encoding_groups as {group, encodings}}
                    <optgroup label={group}>
                    {#each encodings as {name, value}}
                      <option {value}>{name}</option>
                    {/each}
                    </optgroup>
                  {/each}
                </select>
              </label>
            </div>
            <div class="advanced" hidden>
              <label for="lsb">Least significant bit:
                <select id="lsb">
                {#each lsbOpt as {name, value}}
                <option {value}>{name}</option>
                {/each}
                </select>
              </label>
            </div>
            <div class="advanced" hidden>
              <label for="logical_byte_size">Logical byte size:
                <select id="logical_byte_size">
                {#each byteSizeOpt as {value}}
                  <option {value}>{value}</option>
                {/each}
                </select>
              </label>
            </div>
          </div>
          <div class="grid-container-column">
            <div id="data_vw" >&nbsp;Offset: <span id="offset_dv" contenteditable='true'>{$byteOffsetPos}</span>
              <span id="b8_dv">
                <br /><label for="int8_dv">&nbsp;&nbsp;&nbsp;int8: <text-field id="int8_dv" contenteditable='true' bind:textContent={$int8}></text-field></label>
                <br /><label for="uint8_dv">&nbsp;&nbsp;uint8: <text-field id="uint8_dv" contenteditable='true' bind:textContent={$uint8}></text-field></label>
              </span>
              <span id="b16_dv">
                <br /><label for="int16_dv">&nbsp;&nbsp;int16: <text-field id="int16_dv" contenteditable='true' bind:textContent={$int16}></text-field></label>
                <br /><label for="uint16_dv">&nbsp;uint16: <text-field id="uint16_dv" contenteditable='true' bind:textContent={$uint16}></text-field></label>
              </span>
              <span id="b32_dv">
                <br /><label for="int32_dv">&nbsp;&nbsp;int32: <text-field id="int32_dv" contenteditable='true' bind:textContent={$int32}></text-field></label>
                <br /><label for="uint32_dv">&nbsp;uint32: <text-field id="uint32_dv" contenteditable='true' bind:textContent={$uint32}></text-field></label>
                <br /><label for="float32_dv">float32: <text-field id="float32_dv" contenteditable='true' bind:textContent={$float32}></text-field></label>
              </span>
              <span id="b64_dv">
                <br /><label for="int64_dv">&nbsp;&nbsp;int64: <text-field id="int64_dv" contenteditable='true' bind:textContent={$int64}></text-field></label>
                <br /><label for="uint64_dv">&nbsp;uint64: <text-field id="uint64_dv" contenteditable='true' bind:textContent={$uint64}></text-field></label>
                <br /><label for="float64_dv">float64: <text-field id="float64_dv" contenteditable='true' bind:textContent={$float64}></text-field></label>
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  </div>
</main>
<div contenteditable="true">
  {#if $selectionActive}
  <h3>Selection: {$selectionStartStore} - {$selectionEndStore} Len: {$editorSelection.length}({$selectionSize}) | Encoding: {$editorEncoding} | cursor: {$cursorPos} | bytePOS: {$byteOffsetPos}</h3>
  <hr>
  {$editorSelection}
  <hr>
  <hr>
  {$selectedFileData}
  <hr>
  {/if}
  <h3>BytesPerRow: {$bytesPerRow}</h3>
  <h3>Radix: {$displayRadix}</h3>
  <h3>Data<br></h3><hr>
  <subscript>{$viewportData}</subscript>
  {#if $editorEncoding}
  {$editorEncoding}
  {/if}
</div>
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

  textarea {
    color: inherit;
    background-color: inherit;
    font: inherit;
    resize: none;
    width: auto;
    border: 0;
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
    overflow-x: scroll;
  }

  .dataEditor textarea.selectedContent {
    background: #2c2c2c;
  }

  .grid-container-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .errMsg {
    color: red;
  }

  #address_numbering {
    min-width: 100%;
  }
  .search {
    min-width: 200px;
  }
  #search_input {
    min-width: 100px;
  }
  #replace_input {
    min-width: 100px
  }
  
</style>
