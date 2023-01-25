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
    vsCodeTextField,
  } from '@vscode/webview-ui-toolkit'
  import {
    displayRadix, 
    addressValue,
    filesize,
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    UInt8Data,
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
    makeAddressRange,
    encodeForDisplay } from '../utilities/display';
  import { vscode } from '../utilities/vscode'
  import { MessageCommand } from '../utilities/message'
  import type{ EditorDisplayState } from '../utilities/message'
  import { writable, derived, readable } from 'svelte/store';

  provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDropdown(),
    vsCodeOption(),
    vsCodeTextField()
  )

  let addressText = ''
  let physicalOffsetText = ''
  let physicalDisplayText = ''
  let logicalOffsetText = ''
  let logicalDisplayText = ''
  let testOutput = ''
  let editorTextDisplay = ''
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let phyiscal_vwRef: HTMLTextAreaElement, address_vwRef: HTMLTextAreaElement, logical_vwRef: HTMLTextAreaElement

  // let selectedContent: HTMLTextAreaElement
  const selectedContent = readable(document.getElementById('selectedContent') as HTMLTextAreaElement)

  // Reactive Declarations
  $: addressText = makeAddressRange($fileByteStart, $fileByteEnd, $bytesPerRow, $addressValue)
  $: selectionOffsetText = setSelectionOffsetInfo('Selection', $selectionStartStore, $selectionEndStore, $editedCount, $cursorPos)
  $: {
    physicalOffsetText = getOffsetText($displayRadix, 'physical')
    logicalOffsetText = getOffsetText($displayRadix, 'logical')
  }
  $: physicalDisplayText = encodeForDisplay($UInt8Data, $displayRadix, $bytesPerRow)
  $: testOutput = $UInt8Data.subarray($selectionStartStore, $selectionEndStore).toString()
  $: setSelectionEncoding($editorEncoding)

  // interface EditorControls {
  //   bytes_per_line: number
  //   address_numbering: number
  //   radix: number
  //   little_endian: boolean
  //   logical_encoding: string
  //   offset: number
  //   length: number
  //   edit_byte_size: number
  //   edit_encoding: BufferEncoding
  //   lsb_higher_offset: boolean
  //   bytes_per_row: number
  //   editor_selection_start: number
  //   editor_selection_end: number
  //   editor_cursor_pos: number
  //   goto_offset: number
  // }

  // interface EditorMetrics {
  //   change_count: number
  //   data_breakpoint_count: number
  //   file_byte_count: number
  //   ascii_byte_count: number
  //   row_count: number
  // }

  // interface EditorElements {
  //   data_editor: HTMLElement
  //   address: HTMLTextAreaElement
  //   physical: HTMLTextAreaElement
  //   logical: HTMLTextAreaElement
  //   editor: HTMLTextAreaElement
  //   physical_offsets: HTMLElement
  //   logical_offsets: HTMLElement
  //   selected_offsets: HTMLElement
  //   editor_offsets: HTMLElement
  //   data_view_offset: HTMLElement
  //   commit_button: HTMLInputElement
  //   add_data_breakpoint_button: HTMLInputElement
  //   change_count: HTMLElement
  //   data_breakpoint_count: HTMLElement
  //   file_byte_count: HTMLElement
  //   ascii_byte_count: HTMLElement
  //   file_type: HTMLElement
  //   file_name: HTMLElement
  //   file_metrics_vw: HTMLElement
  //   goto_offset: HTMLInputElement
  //   radix: HTMLInputElement
  //   data_vw: HTMLElement
  //   b8_dv: HTMLElement
  //   b16_dv: HTMLElement
  //   b32_dv: HTMLElement
  //   b64_dv: HTMLElement
  //   int8_dv: HTMLInputElement
  //   uint8_dv: HTMLInputElement
  //   int16_dv: HTMLInputElement
  //   uint16_dv: HTMLInputElement
  //   int32_dv: HTMLInputElement
  //   uint32_dv: HTMLInputElement
  //   int64_dv: HTMLInputElement
  //   uint64_dv: HTMLInputElement
  //   float32_dv: HTMLInputElement
  //   float64_dv: HTMLInputElement
  // }

  // interface EditorState {
  //   file_content: Uint8Array | null
  //   edit_content: Uint8Array
  //   editor_controls: EditorControls
  //   editor_metrics: EditorMetrics
  //   editor_elements: EditorElements
  // }

  // let editor_state: EditorState

  function setSelectionEncoding(encoding: string) {
    if($selectionEndStore > 0) {
      let editorMsg: EditorDisplayState = {
        start: $selectionStartStore,
        end: $selectionEndStore,
        encoding: encoding as BufferEncoding,
        cursor: $cursorPos,
      } 
      vscode.postMessage({
        command: MessageCommand.editorOnChange,
        data: { editor: editorMsg },
      })
      console.log(editorMsg)
    }
  }

  function init() {
    phyiscal_vwRef = document.getElementById('phyiscal_vw')
    address_vwRef = document.getElementById('address_vw')
    logical_vwRef = document.getElementById('logical_vw')
    // editor_state.editor_elements.goto_offset.addEventListener('change', () => {
    //   editor_state.editor_controls.goto_offset = parseInt(
    //     editor_state.editor_elements.goto_offset.value
    //   )
    //   /* number of pixels per line */
    //   const line_height =
    //     editor_state.editor_elements.physical.scrollHeight /
    //     editor_state.editor_metrics.row_count
    //   /* number of lines to scroll */
    //   const line =
    //     Math.ceil(
    //       editor_state.editor_controls.goto_offset /
    //         editor_state.editor_controls.bytes_per_row
    //     ) - 1
    //   editor_state.editor_elements.physical.scrollTop = line * line_height
    // })
    // editor_state.editor_elements.editor.addEventListener('change', () => {
    //   let commitMsg = {
    //     offset: editor_state.editor_controls.offset,
    //     length: 0,
    //     data: null,
    //   }

    //   switch (editor_state.editor_controls.edit_encoding) {
    //     case 'hex':
    //       commitMsg.length =
    //         editor_state.editor_elements.editor.value.length / 2
    //       editor_state.editor_elements.selected_offsets.innerHTML =
    //         'Selection: ' +
    //         editor_state.editor_controls.offset +
    //         ' - ' +
    //         (editor_state.editor_controls.offset +
    //           -editor_state.editor_controls.length) +
    //         ', length: ' +
    //         commitMsg.length
    //       break
    //     default:
    //       commitMsg.length = editor_state.editor_elements.editor.value.length
    //   }
    // })
    // editor_state.editor_elements.physical.onscroll = () => {
    //   if (!currentScrollEvt || currentScrollEvt === 'physical') {
    //     clearTimeout(scrollSyncTimer)
    //     currentScrollEvt = 'physical'
    //     syncScroll(
    //       editor_state.editor_elements.physical,
    //       editor_state.editor_elements.address
    //     )
    //     syncScroll(
    //       editor_state.editor_elements.physical,
    //       editor_state.editor_elements.logical
    //     )
    //     scrollSyncTimer = setTimeout(function () {
    //       currentScrollEvt = null
    //     }, 100)
    //   }
    // }
    // editor_state.editor_elements.address.onscroll = () => {
    //   if (!currentScrollEvt || currentScrollEvt === 'address') {
    //     clearTimeout(scrollSyncTimer)
    //     currentScrollEvt = 'address'
    //     syncScroll(
    //       editor_state.editor_elements.address,
    //       editor_state.editor_elements.physical
    //     )
    //     syncScroll(
    //       editor_state.editor_elements.address,
    //       editor_state.editor_elements.logical
    //     )
    //     scrollSyncTimer = setTimeout(function () {
    //       currentScrollEvt = null
    //     }, 100)
    //   }
    // }
    // editor_state.editor_elements.logical.onscroll = () => {
    //   if (!currentScrollEvt || currentScrollEvt === 'logical') {
    //     clearTimeout(scrollSyncTimer)
    //     currentScrollEvt = 'logical'
    //     syncScroll(
    //       editor_state.editor_elements.logical,
    //       editor_state.editor_elements.address
    //     )
    //     syncScroll(
    //       editor_state.editor_elements.logical,
    //       editor_state.editor_elements.physical
    //     )
    //     scrollSyncTimer = setTimeout(function () {
    //       currentScrollEvt = null
    //     }, 100)
    //   }
    // }
  }

  async function loadContent(fileData: Uint8Array) {
    
    UInt8Data.update(() => {
      return Uint8Array.from(fileData)
    })

    filesize.update(() => {
      return fileData.length
    })

    displayRadix.update(() => {
      return 16
    })

    // editor_state.editor_controls.goto_offset = 0
    // editor_state.editor_elements.goto_offset.max = String(fileData.length)
    // editor_state.editor_elements.goto_offset.value = '0'
    // editor_state.editor_metrics.ascii_byte_count = countAscii(
    //   editor_state.file_content
    // )
    // editor_state.editor_elements.ascii_byte_count.innerHTML = String(
    //   editor_state.editor_metrics.ascii_byte_count
    // )
    // editor_state.editor_metrics.row_count = Math.ceil(
    //   editor_state.file_content.length /
    //     editor_state.editor_controls.bytes_per_row
    // )
    // editor_state.editor_elements.file_metrics_vw.hidden = false
    // editor_state.editor_elements.commit_button.disabled = false
    // editor_state.editor_elements.add_data_breakpoint_button.disabled = false

  }
  function scrollHandle(element: string){
    if (!currentScrollEvt || currentScrollEvt === element){
      console.log(currentScrollEvt)
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element
      switch(currentScrollEvt){
        case 'physical':
          syncScroll(
            phyiscal_vwRef,
            address_vwRef
          )
          syncScroll(
            phyiscal_vwRef,
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
            phyiscal_vwRef,
          )
        break
        case 'address':
          syncScroll(
            address_vwRef,
            phyiscal_vwRef,
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

  function handleSelectionEvent(e: Event){
    frameSelectedOnWhitespace(e.target as HTMLTextAreaElement)
    $editedCount = 0

    let editorMsg: EditorDisplayState = {
      start: $selectionStartStore,
      end: $selectionEndStore,
      encoding: $editorEncoding as BufferEncoding,
      cursor: 0,
      // radix: $displayRadix,
    }

    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: { editor: editorMsg },
    })
  }

  function setSelectionOffsetInfo(from: string, start: number, end: number, size: number, cursorPos?: number):string {
    return `${from} [${start} - ${end}] Size: ${$selectionSize} `
  }

  function handleEditorEvent(e: Event) {
    switch(e.type) {
      case 'keydown':
        const kevent = e as KeyboardEvent
        console.log(kevent.key)
        if (['Up','Right','Home'].some((type) => kevent.key.includes(type))) {
          cursorPos.update(pos=>{
            if(pos+1 > $editorSelection.length)
              return pos
            return ++pos
          })
        }
        else if(['Backspace', 'Return', 'Delete'].some((type)=> kevent.key.startsWith(type))) {
          --$editedCount
          cursorPos.update(pos=>{
            return --pos
          })
        }
        else if (['Down','Left','End'].some((type) => kevent.key.includes(type))) {
          cursorPos.update(pos=>{
            return --pos
          })
        }
        else if($editorEncoding === 'hex' && (/^[0-9A-Fa-f]+$/).test(kevent.key)){
          $editedCount++
        }
        else if($editorEncoding === 'ascii' && (/^[\x20-\x7Ea-zA-Z0-9]+$/).test(kevent.key)) {
          $editedCount++
        }
        else {
          e.preventDefault()
        }
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
      selected.selectionEnd =
        selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
    }

    const selectionOffsetsByRadix = {
      2: { start: selected.selectionStart / 9, end: (selected.selectionEnd - 8) / 9 + 1 },
      8: { start: selected.selectionStart / 4, end: (selected.selectionEnd  - 3) / 4 + 1 },
      10: { start: selected.selectionStart / 4, end: (selected.selectionEnd  - 3) / 4 + 1 },
      16: { start: selected.selectionStart / 3, end: (selected.selectionEnd  - 2) / 3 + 1 },
    }

    selectionStartStore.update(()=>{
      if(selected.id === 'logical')
        return selected.selectionStart / 2
      return selectionOffsetsByRadix[$displayRadix].start
    })
    selectionEndStore.update(()=>{
      if(selected.id === 'logical')
        return (selected.selectionEnd + 1) / 2
      return selectionOffsetsByRadix[$displayRadix].end
    })
  }

  function isWhitespace(c: string | undefined): boolean {
    return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
  }

  function countAscii(buf: ArrayBuffer): number {
    return new Uint8Array(buf).reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
  }

  function enableAdvanced(enable: boolean) {
    const advanced_elements = document.getElementsByClassName('advanced')
    for (let i = 0; i < advanced_elements.length; ++i) {
      const el = advanced_elements[i] as HTMLElement
      el.hidden = !enable
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.loadFile:
        loadContent(msg.data.editor.fileData)
        // editor_state.editor_elements.file_name.innerHTML =
        //   msg.data.metrics.filename
        // editor_state.editor_elements.file_type.innerHTML = msg.data.metrics.type
        logicalDisplayText = msg.data.display.logical
        break
      case MessageCommand.editorOnChange:
        editorSelection.update(()=>{
          return msg.data.display.editor
        })
        break
      case MessageCommand.addressOnChange:
        logicalDisplayText = msg.data.display.logical
        break
    }
  })

  window.onload = () => {
    init()
  }

</script>

<header>
  <fieldset class="box">
    <legend>File Metrics</legend>
    <div id="file_metrics_vw">
      File: <span id="file_name" />
      <hr />
      Type:<span id="file_type" />
      <br />Size: <span id="file_byte_cnt">{$filesize}</span>
      <br />ASCII count: <span id="ascii_byte_cnt"> 0</span>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Offset</legend>
    <div class="goto_offset">
      <input type="number" id="goto_offset" min="0" max="0" />
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
      <text-field id="search">
        Search:
        <section slot="end" style="display:flex; align-items: center;">
          <vscode-button appearance="icon" aria-label="Case Sensitive">
            <span class="codicon codicon-preserve-case" />
          </vscode-button>
          <vscode-button appearance="icon" aria-label="Case Insensitive">
            <span class="codicon codicon-case-sensitive" />
          </vscode-button>
        </section>
      </text-field>
      <text-field id="replace"> Replace: </text-field>
      <br /><vscode-button id="search_btn" disabled>Search</vscode-button>
      <vscode-button id="replace_btn" disabled>Replace</vscode-button>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>misc</legend>
    <div class="misc">
      <label for="advanced_mode"
        >Advanced Mode
        <vscode-checkbox id="advanced_mode" checked />
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
  <div class="measure"><span contenteditable='true' id="physical_offsets" bind:innerHTML={physicalOffsetText}/></div>
  <div class="measure"><span contenteditable='true' id="logical_offsets" bind:innerHTML={logicalOffsetText}/></div>
  <div class="measure">
    <div>
      <span id="selected_offsets" contenteditable="true">{selectionOffsetText}
      {#if $editedCount > 0}
      <span style="color: green;">({$editedCount})</span>
      {:else if $editedCount < 0}
      <span style="color: red;">({$editedCount})</span>
      {/if}
      {#if $cursorPos}
      <span> | cursor: {$cursorPos}</span>
      {/if}
      <span id="editor_offsets" />
    </div>
  </div>
  <textarea class="address_vw" id="address" contenteditable="true" readonly bind:this={address_vwRef} bind:innerHTML={addressText} on:scroll={scrollHandle('address')}/>
  <textarea class="physical_vw" id="physical" contenteditable="true" readonly bind:this={phyiscal_vwRef} bind:innerHTML={physicalDisplayText} on:select={handleSelectionEvent} on:scroll={scrollHandle('physical')}/>
  <textarea class="logicalView" id="logical" contenteditable="true" readonly bind:this={logical_vwRef} bind:innerHTML={logicalDisplayText} on:select={handleSelectionEvent} on:scroll={scrollHandle('logical')}/>
  <div class="editView" id="edit_view">
    <textarea class="selectedContent" id="editor" contenteditable="true" bind:this={$selectedContent} bind:value={$editorSelection} on:keydown|nonpassive={handleEditorEvent} on:click={handleEditorEvent} on:input={handleEditorEvent}/>
    <!-- <textarea class="selectedContent" id="editor" contenteditable="true" bind:this={selectedContent} bind:value={$editorSelection} on:click={storeCursorPos} on:input={storeCursorPos}/> -->
    <fieldset class="box">
      <legend>Content Controls</legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div>
          {#if $commitable}
            <vscode-button id="commit_btn">commit changes</vscode-button>
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
            <div class="advanced">
              <label for="lsb">Least significant bit:
                <select id="lsb">
                {#each lsbOpt as {name, value}}
                <option {value}>{name}</option>
                {/each}
                </select>
              </label>
            </div>
            <div class="advanced">
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

<!-- <div contenteditable="true">
  {#if $selectionActive}
  <h3>Selection: {$selectionStartStore} - {$selectionEndStore} Len: {$editorSelection.length}({$selectionSize}) | Encoding: {$editorEncoding} | cursor: {$cursorPos} | bytePOS: {$byteOffsetPos}</h3>
  <hr>
  {$editorSelection}<hr>
  {$dataView.buffer}
  <hr><br><br>
  {/if}
  <h3>BytesPerRow: {$bytesPerRow}</h3>
  <h3>Radix: {$displayRadix}</h3>
  <h3>Data<br></h3><hr>
  <subscript>{$UInt8Data}</subscript>
</div> -->
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
  #address_numbering {
    min-width: 100%;
  }
  #edited_count {
    color: green
  }
</style>
