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
  import { answer, displayRadix, addressValue, addressDisplay } from '../stores'
  import { writable } from 'svelte/store';


  export const fileByteStart = writable(0)
  export const fileByteEnd = writable(0)
  export const bytesPerRow = writable(16)

  const UInt8Data = writable()

  let addressText = ''
  let physicalOffsetText = ''
  let fileSize = ''

  $: {
    addressText = $addressDisplay
    fileSize = $fileByteEnd.toString()
  }
  addressValue.subscribe(radix => {
    addressDisplay.set(makeAddressRange($fileByteStart, $fileByteEnd, $bytesPerRow, radix))
  })

  UInt8Data.subscribe(data=>{

  })
  const offsetDisplays = {
    16: { text: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>0 1 2 3 4 5 6 7 8 9 A B C D E F  ', spread: 2 },
    10: { text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ', spread: 3 },
    8: { text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ', spread: 3 },
    2: { text: '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666  <br/>01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123  ',
          spread: 1 }
  }
  displayRadix.subscribe(radix => {
    // Change physical offset
    physicalOffsetText = offsetDisplays[radix].text.replaceAll(' ', '&nbsp;'.repeat(offsetDisplays[radix].spread))
    // Change physical displa
    // change logical offset
    // change logical display
  })

  provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDropdown(),
    vsCodeOption(),
    vsCodeTextField()
  )
  const vscode = acquireVsCodeApi()

  enum MessageCommand {
    commit,
    addBreakpoint,
    editorOnChange,
    loadFile,
    addressOnChange,
  }
  type LogicalDisplayState = {
    bytesPerRow: number
  }
  type EditorDisplayState = {
    encoding: BufferEncoding
    start: number
    end: number
    cursor: number
    radix: number
  }
  interface EditorControls {
    bytes_per_line: number
    address_numbering: number
    radix: number
    little_endian: boolean
    logical_encoding: string
    offset: number
    length: number
    edit_byte_size: number
    edit_encoding: BufferEncoding
    lsb_higher_offset: boolean
    bytes_per_row: number
    editor_selection_start: number
    editor_selection_end: number
    editor_cursor_pos: number
    goto_offset: number
  }

  interface EditorMetrics {
    change_count: number
    data_breakpoint_count: number
    file_byte_count: number
    ascii_byte_count: number
    row_count: number
  }

  interface EditorElements {
    data_editor: HTMLElement
    address: HTMLTextAreaElement
    physical: HTMLTextAreaElement
    logical: HTMLTextAreaElement
    editor: HTMLTextAreaElement
    physical_offsets: HTMLElement
    logical_offsets: HTMLElement
    selected_offsets: HTMLElement
    editor_offsets: HTMLElement
    data_view_offset: HTMLElement
    commit_button: HTMLInputElement
    add_data_breakpoint_button: HTMLInputElement
    change_count: HTMLElement
    data_breakpoint_count: HTMLElement
    file_byte_count: HTMLElement
    ascii_byte_count: HTMLElement
    file_type: HTMLElement
    file_name: HTMLElement
    file_metrics_vw: HTMLElement
    goto_offset: HTMLInputElement
    radix: HTMLInputElement
    data_vw: HTMLElement
    b8_dv: HTMLElement
    b16_dv: HTMLElement
    b32_dv: HTMLElement
    b64_dv: HTMLElement
    int8_dv: HTMLInputElement
    uint8_dv: HTMLInputElement
    int16_dv: HTMLInputElement
    uint16_dv: HTMLInputElement
    int32_dv: HTMLInputElement
    uint32_dv: HTMLInputElement
    int64_dv: HTMLInputElement
    uint64_dv: HTMLInputElement
    float32_dv: HTMLInputElement
    float64_dv: HTMLInputElement
  }

  interface EditorState {
    file_content: Uint8Array | null
    edit_content: Uint8Array
    editor_controls: EditorControls
    editor_metrics: EditorMetrics
    editor_elements: EditorElements
  }

  let editor_state: EditorState

  function init() {
    editor_state = {
      file_content: null,
      edit_content: new Uint8Array(0),
      editor_elements: {
        data_editor: document.getElementById('data_editor') as HTMLInputElement,
        address: document.getElementById('address') as HTMLTextAreaElement,
        physical: document.getElementById('physical') as HTMLTextAreaElement,
        logical: document.getElementById('logical') as HTMLTextAreaElement,
        editor: document.getElementById('editor') as HTMLTextAreaElement,
        physical_offsets: document.getElementById(
          'physical_offsets'
        ) as HTMLInputElement,
        logical_offsets: document.getElementById(
          'logical_offsets'
        ) as HTMLInputElement,
        selected_offsets: document.getElementById(
          'selected_offsets'
        ) as HTMLElement,
        editor_offsets: document.getElementById(
          'editor_offsets'
        ) as HTMLElement,
        data_view_offset: document.getElementById('offset_dv') as HTMLElement,
        file_byte_count: document.getElementById(
          'file_byte_cnt'
        ) as HTMLElement,
        change_count: document.getElementById('change_cnt') as HTMLElement,
        data_breakpoint_count: document.getElementById(
          'data_breakpoint_cnt'
        ) as HTMLElement,
        file_metrics_vw: document.getElementById(
          'file_metrics_vw'
        ) as HTMLElement,
        ascii_byte_count: document.getElementById(
          'ascii_byte_cnt'
        ) as HTMLElement,
        file_type: document.getElementById('file_type') as HTMLElement,
        file_name: document.getElementById('file_name') as HTMLElement,
        commit_button: document.getElementById(
          'commit_btn'
        ) as HTMLInputElement,
        add_data_breakpoint_button: document.getElementById(
          'add_data_breakpoint_btn'
        ) as HTMLInputElement,
        goto_offset: document.getElementById('goto_offset') as HTMLInputElement,
        radix: document.getElementById('radix') as HTMLInputElement,
        data_vw: document.getElementById('data_vw') as HTMLElement,
        b8_dv: document.getElementById('b8_dv') as HTMLElement,
        b16_dv: document.getElementById('b16_dv') as HTMLElement,
        b32_dv: document.getElementById('b32_dv') as HTMLElement,
        b64_dv: document.getElementById('b64_dv') as HTMLElement,
        int8_dv: document.getElementById('int8_dv') as HTMLInputElement,
        uint8_dv: document.getElementById('uint8_dv') as HTMLInputElement,
        int16_dv: document.getElementById('int16_dv') as HTMLInputElement,
        uint16_dv: document.getElementById('uint16_dv') as HTMLInputElement,
        int32_dv: document.getElementById('int32_dv') as HTMLInputElement,
        uint32_dv: document.getElementById('uint32_dv') as HTMLInputElement,
        int64_dv: document.getElementById('int64_dv') as HTMLInputElement,
        uint64_dv: document.getElementById('uint64_dv') as HTMLInputElement,
        float32_dv: document.getElementById('float32_dv') as HTMLInputElement,
        float64_dv: document.getElementById('float64_dv') as HTMLInputElement,
      },
      editor_controls: {
        bytes_per_line: 8,
        address_numbering: 10,
        radix: 16,
        little_endian: true,
        logical_encoding: 'latin1',
        offset: 0,
        length: 0,
        edit_byte_size: 8,
        edit_encoding: 'latin1',
        lsb_higher_offset: true,
        bytes_per_row: 16,
        editor_selection_start: 0,
        editor_selection_end: 0,
        editor_cursor_pos: 0,
        goto_offset: 0,
      },
      editor_metrics: {
        change_count: 0,
        data_breakpoint_count: 0,
        file_byte_count: 0,
        ascii_byte_count: 0,
        row_count: 0,
      },
    }
    // add listeners
    editor_state.editor_elements.physical.addEventListener('select', () =>
      handleSelected(
        frameSelectedOnWhitespace(editor_state.editor_elements.physical)
      )
    )
    editor_state.editor_elements.logical.addEventListener('select', () =>
      handleSelected(frameSelected(editor_state.editor_elements.logical))
    )
    editor_state.editor_elements.radix.addEventListener('change', () => {
      editor_state.editor_controls.radix = parseInt(
        editor_state.editor_elements.radix.value
      )
      selectAddressType(editor_state.editor_controls.radix)

      updateDataView()
    })
    editor_state.editor_elements.int8_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt8(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int8_dv.valueAsNumber
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.uint8_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint8(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint8_dv.valueAsNumber
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.int16_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt16(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int16_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.uint16_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint16(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint16_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.int32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setInt32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.int32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.uint32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setUint32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.uint32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.int64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setBigInt64(
        editor_state.editor_controls.editor_cursor_pos,
        BigInt(editor_state.editor_elements.int64_dv.value),
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.uint64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setBigUint64(
        editor_state.editor_controls.editor_cursor_pos,
        BigInt(editor_state.editor_elements.uint32_dv.value),
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.float32_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setFloat32(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.float32_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.float64_dv.addEventListener('change', () => {
      new DataView(editor_state.edit_content.buffer).setFloat64(
        editor_state.editor_controls.editor_cursor_pos,
        editor_state.editor_elements.float64_dv.valueAsNumber,
        editor_state.editor_controls.little_endian
      )
      updateDataView()
      // refreshEditor()
    })
    editor_state.editor_elements.commit_button.addEventListener('click', () => {
      vscode.postMessage({
        command: MessageCommand.commit,
        data: {
          fileOffset: editor_state.editor_controls.offset,
          dataLength: -editor_state.editor_controls.length,
          data: editor_state.editor_elements.editor.value,
          encoding: editor_state.editor_controls.edit_encoding,
        },
      })
    })
    editor_state.editor_elements.add_data_breakpoint_button.addEventListener(
      'click',
      () => {
        vscode.postMessage({ command: 'set_break', data: 'testdata' })
      }
    )

    const advanced_mode = document.getElementById(
      'advanced_mode'
    ) as HTMLInputElement
    advanced_mode.addEventListener('change', () =>
      enableAdvanced(advanced_mode.checked)
    )
    const address_type = document.getElementById(
      'address_numbering'
    ) as HTMLInputElement
    address_type.addEventListener('change', () => {
      editor_state.editor_controls.address_numbering = parseInt(
        address_type.value
      )
      // editor_state.editor_elements.address.innerHTML = makeAddressRange(
      //   0,
      //   Math.ceil(
      //     editor_state.editor_metrics.file_byte_count /
      //       editor_state.editor_controls.bytes_per_row
      //   ),
      //   editor_state.editor_controls.bytes_per_row,
      //   editor_state.editor_controls.address_numbering
      // )
    })
    const edit_encoding = document.getElementById(
      'edit_encoding'
    ) as HTMLInputElement
    editor_state.editor_controls.edit_encoding =
      edit_encoding.value as BufferEncoding
    edit_encoding.addEventListener('change', () =>
      selectEditEncoding(edit_encoding.value)
    )
    const endianness = document.getElementById('endianness') as HTMLInputElement
    endianness.addEventListener('change', () =>
      selectEndianness(endianness.value)
    )
    editor_state.editor_elements.goto_offset.addEventListener('change', () => {
      editor_state.editor_controls.goto_offset = parseInt(
        editor_state.editor_elements.goto_offset.value
      )
      /* number of pixels per line */
      const line_height =
        editor_state.editor_elements.physical.scrollHeight /
        editor_state.editor_metrics.row_count
      /* number of lines to scroll */
      const line =
        Math.ceil(
          editor_state.editor_controls.goto_offset /
            editor_state.editor_controls.bytes_per_row
        ) - 1
      editor_state.editor_elements.physical.scrollTop = line * line_height
    })
    editor_state.editor_elements.editor.addEventListener('change', () => {
      let commitMsg = {
        offset: editor_state.editor_controls.offset,
        length: 0,
        data: null,
      }

      switch (editor_state.editor_controls.edit_encoding) {
        case 'hex':
          commitMsg.length =
            editor_state.editor_elements.editor.value.length / 2
          editor_state.editor_elements.selected_offsets.innerHTML =
            'Selection: ' +
            editor_state.editor_controls.offset +
            ' - ' +
            (editor_state.editor_controls.offset +
              -editor_state.editor_controls.length) +
            ', length: ' +
            commitMsg.length
          break
        default:
          commitMsg.length = editor_state.editor_elements.editor.value.length
      }
    })
    // Track the cursor position
    editor_state.editor_elements.editor.oninput =
      editor_state.editor_elements.editor.onclick =
      editor_state.editor_elements.editor.oncontextmenu =
        storeCursorPos
    editor_state.editor_elements.editor.onkeyup = (keyEvent) => {
      if (
        ['Arrow', 'Page', 'Home', 'End'].some((type) =>
          keyEvent.key.startsWith(type)
        )
      ) {
        storeCursorPos()
      } else {
        keyEvent.preventDefault()
      }
      let len = editor_state.editor_elements.editor.value.length
      if (editor_state.editor_controls.edit_encoding != 'hex') {
        len = len / 2
      }
      editor_state.editor_elements.selected_offsets.innerHTML =
        'Edited: ' +
        editor_state.editor_controls.offset +
        ' - ' +
        (editor_state.editor_controls.offset +
          -editor_state.editor_controls.length) +
        ', length: ' +
        Math.ceil(len)
      updateDataView()
    }
    // Lock the address, physical and logical views scrollbars together
    let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
    editor_state.editor_elements.physical.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'physical') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'physical'
        syncScroll(
          editor_state.editor_elements.physical,
          editor_state.editor_elements.address
        )
        syncScroll(
          editor_state.editor_elements.physical,
          editor_state.editor_elements.logical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
    editor_state.editor_elements.address.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'address') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'address'
        syncScroll(
          editor_state.editor_elements.address,
          editor_state.editor_elements.physical
        )
        syncScroll(
          editor_state.editor_elements.address,
          editor_state.editor_elements.logical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
    editor_state.editor_elements.logical.onscroll = () => {
      if (!currentScrollEvt || currentScrollEvt === 'logical') {
        clearTimeout(scrollSyncTimer)
        currentScrollEvt = 'logical'
        syncScroll(
          editor_state.editor_elements.logical,
          editor_state.editor_elements.address
        )
        syncScroll(
          editor_state.editor_elements.logical,
          editor_state.editor_elements.physical
        )
        scrollSyncTimer = setTimeout(function () {
          currentScrollEvt = null
        }, 100)
      }
    }
  }

  function storeCursorPos() {
    editor_state.editor_controls.editor_cursor_pos =
      editor_state.editor_elements.editor.selectionStart
    editor_state.editor_controls.editor_selection_start =
      editor_state.editor_elements.editor.selectionStart
    editor_state.editor_controls.editor_selection_end =
      editor_state.editor_elements.editor.selectionEnd
    editor_state.editor_elements.editor_offsets.innerHTML =
      editor_state.editor_controls.editor_selection_start ===
      editor_state.editor_controls.editor_selection_end
        ? 'cursor: ' + String(editor_state.editor_controls.editor_cursor_pos)
        : 'start: ' +
          String(editor_state.editor_controls.editor_selection_start) +
          ', end: ' +
          String(editor_state.editor_controls.editor_selection_end) +
          ', cursor: ' +
          String(editor_state.editor_controls.editor_cursor_pos)
    updateDataView()
  }

  function selectEndianness(endianness: string) {
    editor_state.editor_controls.little_endian = endianness == 'le'
    updateDataView()
    editor_state.editor_elements.editor.focus()
    editor_state.editor_elements.editor.setSelectionRange(
      editor_state.editor_controls.editor_selection_start,
      editor_state.editor_controls.editor_selection_end
    )
  }

  async function loadContent(fileData: Uint8Array) {
    editor_state.editor_elements.editor.value = ''
    editor_state.editor_metrics.file_byte_count = fileData.length
    $UInt8Data = fileData
    $fileByteEnd = fileData.length / $bytesPerRow
    addressValue.set(16)
    editor_state.editor_controls.goto_offset = 0
    editor_state.editor_elements.goto_offset.max = String(fileData.length)
    editor_state.editor_elements.goto_offset.value = '0'
    // editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(
    //   10,
    //   1
    // )
    // editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(
    //   10,
    //   2
    // )
    // editor_state.editor_elements.address.innerHTML = makeAddressRange(
    //   0,
    //   Math.ceil(fileData.length / 16),
    //   16,
    //   editor_state.editor_controls.address_numbering
    // )
    editor_state.editor_elements.file_byte_count.innerHTML = String(
      editor_state.editor_metrics.file_byte_count
    )
    editor_state.editor_elements.logical.innerHTML = 'Loading...'
    editor_state.file_content = fileData
    editor_state.editor_metrics.ascii_byte_count = countAscii(
      editor_state.file_content
    )
    editor_state.editor_elements.ascii_byte_count.innerHTML = String(
      editor_state.editor_metrics.ascii_byte_count
    )
    editor_state.editor_metrics.row_count = Math.ceil(
      editor_state.file_content.length /
        editor_state.editor_controls.bytes_per_row
    )
    editor_state.editor_elements.file_metrics_vw.hidden = false
    editor_state.editor_elements.physical.innerHTML = encodeForDisplay(
      editor_state.file_content,
      editor_state.editor_controls.radix,
      editor_state.editor_controls.bytes_per_row
    )
    editor_state.editor_elements.commit_button.disabled = false
    editor_state.editor_elements.add_data_breakpoint_button.disabled = false

  }

  function syncScroll(from: HTMLElement, to: HTMLElement) {
    // Scroll the "to" by the same percentage as the "from"
    const sf = from.scrollHeight - from.clientHeight
    if (sf >= 1) {
      const st = to.scrollHeight - to.clientHeight
      to.scrollTop = (st / 100) * ((from.scrollTop / sf) * 100)
    }
  }

  function selectEditEncoding(editEncoding: string) {
    editor_state.editor_controls.edit_encoding = editEncoding as BufferEncoding
    editor_state.editor_elements.editor.selectionStart =
      editor_state.editor_elements.editor.selectionEnd = 0
    storeCursorPos()

    let editorMsg: EditorDisplayState = {
      start: editor_state.editor_controls.offset,
      end:
        editor_state.editor_controls.offset +
        -editor_state.editor_controls.length,
      cursor: editor_state.editor_controls.editor_cursor_pos,
      encoding: editor_state.editor_controls.edit_encoding,
      radix: editor_state.editor_controls.radix,
    }

    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: { editor: editorMsg },
    })

    editor_state.editor_elements.editor.focus()
  }

  function selectAddressType(radix: number) {
    // editor_state.editor_controls.radix = radix
    let logicalDisplayState: LogicalDisplayState
    if (
      $displayRadix === 2 &&
      !editor_state.editor_elements.data_editor.classList.contains('binary')
    ) {
      // editor_state.editor_controls.radix = 2
      $bytesPerRow = 8
      editor_state.editor_elements.data_editor.classList.add('binary')
      if (editor_state.file_content) {
        editor_state.editor_elements.physical.innerHTML = encodeForDisplay(
          editor_state.file_content,
          editor_state.editor_controls.radix,
          editor_state.editor_controls.bytes_per_row
        )
      }
      // editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(
      //   editor_state.editor_controls.radix,
      //   1
      // )
      // editor_state.editor_elements.address.innerHTML = makeAddressRange(
      //   0,
      //   Math.ceil(
      //     editor_state.editor_metrics.file_byte_count /
      //       editor_state.editor_controls.bytes_per_row
      //   ),
      //   8,
      //   editor_state.editor_controls.address_numbering
      // )
      // editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(
      //   editor_state.editor_controls.radix * -1,
      //   1
      // )
      logicalDisplayState = {
        bytesPerRow: 8,
      }
    } else {
      let pysichalOffsetSpread: number
      $displayRadix === 16
        ? (pysichalOffsetSpread = 2)
        : (pysichalOffsetSpread = 3)
      $bytesPerRow = 16
      if (
        editor_state.editor_elements.data_editor.classList.contains('binary')
      ) {
        editor_state.editor_elements.data_editor.classList.remove('binary')
      }
      if (editor_state.file_content) {
        editor_state.editor_elements.physical.innerHTML = encodeForDisplay(
          editor_state.file_content,
          editor_state.editor_controls.radix,
          editor_state.editor_controls.bytes_per_row
        )
      }

      // editor_state.editor_elements.physical_offsets.innerHTML = makeOffsetRange(
      //   editor_state.editor_controls.radix,
      //   pysichalOffsetSpread
      // )

      // editor_state.editor_elements.address.innerHTML = makeAddressRange(
      //   0,
      //   Math.ceil(
      //     editor_state.editor_metrics.file_byte_count /
      //       editor_state.editor_controls.bytes_per_row
      //   ),
      //   16,
      //   editor_state.editor_controls.address_numbering
      // )
      // editor_state.editor_elements.logical_offsets.innerHTML = makeOffsetRange(
      //   editor_state.editor_controls.radix,
      //   1
      // )
      logicalDisplayState = {
        bytesPerRow: 16,
      }
    }
    vscode.postMessage({
      command: MessageCommand.addressOnChange,
      data: {
        state: logicalDisplayState,
      },
    })
  }

  function updateDataView() {
    let bytePOS: number
    editor_state.editor_controls.edit_encoding === 'hex'
      ? (bytePOS = Math.ceil(
          (editor_state.editor_controls.editor_cursor_pos - 1) / 2
        ))
      : (bytePOS = editor_state.editor_controls.editor_cursor_pos)
    const offset = bytePOS.valueOf()
    const data_view = new DataView(editor_state.edit_content.buffer)
    const little_endian = editor_state.editor_controls.little_endian
    const radix = editor_state.editor_controls.radix
    const look_ahead = data_view.byteLength - offset
    editor_state.editor_elements.data_view_offset.innerHTML = String(
      editor_state.editor_controls.offset +
        offset +
        ', encoding: ' +
        String(radix)
    )
    if (look_ahead >= 8) {
      editor_state.editor_elements.int64_dv.value = data_view
        .getBigInt64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint64_dv.value = data_view
        .getBigUint64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.float64_dv.value = data_view
        .getFloat64(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int32_dv.value = data_view
        .getInt32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint32_dv.value = data_view
        .getUint32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.float32_dv.value = data_view
        .getFloat32(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int16_dv.value = data_view
        .getInt16(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.uint16_dv.value = data_view
        .getUint16(offset, little_endian)
        .toString(radix)
      editor_state.editor_elements.int8_dv.value = data_view
        .getInt8(offset)
        .toString(radix)
      editor_state.editor_elements.uint8_dv.value = data_view
        .getUint8(offset)
        .toString(radix)
      editor_state.editor_elements.b8_dv.hidden = false
      editor_state.editor_elements.b16_dv.hidden = false
      editor_state.editor_elements.b32_dv.hidden = false
      editor_state.editor_elements.b64_dv.hidden = false
    } else {
      editor_state.editor_elements.b64_dv.hidden = true
      editor_state.editor_elements.int64_dv.value = ''
      editor_state.editor_elements.uint64_dv.value = ''
      editor_state.editor_elements.float64_dv.value = ''
      if (look_ahead >= 4) {
        editor_state.editor_elements.int32_dv.value = data_view
          .getInt32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.uint32_dv.value = data_view
          .getUint32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.float32_dv.value = data_view
          .getFloat32(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.int16_dv.value = data_view
          .getInt16(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.uint16_dv.value = data_view
          .getUint16(offset, little_endian)
          .toString(radix)
        editor_state.editor_elements.int8_dv.value = data_view
          .getInt8(offset)
          .toString(radix)
        editor_state.editor_elements.uint8_dv.value = data_view
          .getUint8(offset)
          .toString(radix)
        editor_state.editor_elements.b8_dv.hidden = false
        editor_state.editor_elements.b16_dv.hidden = false
        editor_state.editor_elements.b32_dv.hidden = false
      } else {
        editor_state.editor_elements.b64_dv.hidden = true
        editor_state.editor_elements.b32_dv.hidden = true
        editor_state.editor_elements.int32_dv.value = ''
        editor_state.editor_elements.uint32_dv.value = ''
        editor_state.editor_elements.float32_dv.value = ''
        if (look_ahead >= 2) {
          editor_state.editor_elements.int16_dv.value = data_view
            .getInt16(offset, little_endian)
            .toString(radix)
          editor_state.editor_elements.uint16_dv.value = data_view
            .getUint16(offset, little_endian)
            .toString(radix)
          editor_state.editor_elements.int8_dv.value = data_view
            .getInt8(offset)
            .toString(radix)
          editor_state.editor_elements.uint8_dv.value = data_view
            .getUint8(offset)
            .toString(radix)
          editor_state.editor_elements.b8_dv.hidden = false
          editor_state.editor_elements.b16_dv.hidden = false
        } else {
          editor_state.editor_elements.b64_dv.hidden = true
          editor_state.editor_elements.b32_dv.hidden = true
          editor_state.editor_elements.b16_dv.hidden = true
          editor_state.editor_elements.int16_dv.value = ''
          editor_state.editor_elements.uint16_dv.value = ''
          if (look_ahead >= 1) {
            editor_state.editor_elements.int8_dv.value = data_view
              .getInt8(offset)
              .toString(radix)
            editor_state.editor_elements.uint8_dv.value = data_view
              .getUint8(offset)
              .toString(radix)
            editor_state.editor_elements.b8_dv.hidden = false
          } else {
            editor_state.editor_elements.b64_dv.hidden = true
            editor_state.editor_elements.b32_dv.hidden = true
            editor_state.editor_elements.b16_dv.hidden = true
            editor_state.editor_elements.b8_dv.hidden = true
            editor_state.editor_elements.int8_dv.value = ''
            editor_state.editor_elements.uint8_dv.value = ''
          }
        }
      }
    }
  }

  function handleSelected(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart as number
    let selectionEnd = selected.selectionEnd as number
    let selectionOffsetsByRadix = {
      2: { start: selectionStart / 9, end: (selectionEnd - 8) / 9 + 1 },
      8: { start: selectionStart / 4, end: (selectionEnd - 3) / 4 + 1 },
      10: { start: selectionStart / 4, end: (selectionEnd - 3) / 4 + 1 },
      16: { start: selectionStart / 3, end: (selectionEnd - 2) / 3 + 1 },
    }
    if (selected.id === 'physical') {
      selectionStart =
        selectionOffsetsByRadix[editor_state.editor_controls.radix].start
      selectionEnd =
        selectionOffsetsByRadix[editor_state.editor_controls.radix].end
    } else {
      selectionStart = selectionStart / 2
      selectionEnd = (selectionEnd + 1) / 2
    }
    editor_state.editor_elements.data_vw.hidden = false
    editor_state.editor_controls.editor_cursor_pos = 0
    editor_state.editor_controls.offset = selectionStart
    editor_state.editor_controls.length = selectionStart - selectionEnd
    editor_state.edit_content = editor_state.file_content!.slice(
      selectionStart,
      selectionEnd
    )

    editor_state.editor_elements.editor.scrollTo(0, 0)
    editor_state.editor_elements.selected_offsets.innerHTML =
      selected.id +
      ': ' +
      selectionStart +
      ' - ' +
      selectionEnd +
      ', length: ' +
      (selectionEnd - selectionStart)
    editor_state.editor_elements.data_view_offset.innerHTML =
      String(selectionStart)
    editor_state.editor_elements.editor_offsets.innerHTML = '-'

    let editorMsg: EditorDisplayState = {
      start: selectionStart,
      end: selectionEnd,
      encoding: editor_state.editor_controls.edit_encoding,
      cursor: editor_state.editor_controls.editor_cursor_pos,
      radix: parseInt(editor_state.editor_elements.radix.value),
    }

    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: { editor: editorMsg },
    })

    editor_state.editor_elements.editor.scrollTo(
      0,
      editor_state.editor_elements.editor.scrollHeight
    )

    updateDataView()
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

    // Adjust the start to align with the closest beginning of content
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

    return selected
  }

  function isWhitespace(c: string | undefined): boolean {
    return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
  }

  function countAscii(buf: ArrayBuffer): number {
    return new Uint8Array(buf).reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
  }

  // // determine if the given character is undefined for latin-1 (ref: https://en.wikipedia.org/wiki/ISO/IEC_8859-1)

  function radixBytePad(radix: number): number {
    switch (radix) {
      case 2:
        return 8
      case 8:
        return 3
      case 10:
        return 3
      case 16:
        return 2
    }
    return 0
  }

  function encodeForDisplay(
    arr: Uint8Array,
    radix: number,
    bytes_per_row: number
  ): string {
    let result = ''
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytes_per_row; ++col) {
          result += arr[i++].toString(radix).padStart(pad, '0') + ' '
        }
        result = result.slice(0, result.length - 1)
        if (i === arr.byteLength) {
          break
        }
        result += '\n'
      }
    }
    return result
  }

  function makeAddressRange(
    start: number,
    end: number,
    stride: number,
    radix: number
  ): string {
    let i = start
    let result = (i * stride).toString(radix)
    for (++i; i < end; ++i) {
      result += '\n' + (i * stride).toString(radix)
    }
    return result
  }

  function makeOffsetRange(radix: number, spread: number): string {
    return ((radix_: number): string => {
      switch (radix_) {
        // @formatter:off
        case 16:
          return (
            '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 A B C D E F'
          )
        case 10:
          return (
            '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5'
          )
        case 8:
          return (
            '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7'
          )
        case 2:
          return (
            '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666  <br/>' +
            '01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123  '
          )
        case -2:
          return '0 0 0 0 0 0 0 0 <br>' + '0 1 2 3 4 5 6 7'
        // @formatter:on
      }
      return 'unhandled radix'
    })(radix).replaceAll(' ', '&nbsp;'.repeat(spread))
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
        editor_state.editor_elements.file_name.innerHTML =
          msg.data.metrics.filename
        editor_state.editor_elements.file_type.innerHTML = msg.data.metrics.type
        editor_state.editor_elements.logical.innerHTML =
          msg.data.display.logical
        break
      case MessageCommand.editorOnChange:
        editor_state.editor_elements.editor.value = msg.data.display.editor
        break
      case MessageCommand.addressOnChange:
        editor_state.editor_elements.logical.innerHTML =
          msg.data.display.logical
        break
    }
  })


  // Reactive Declarations
  // $: addressDisplay.set(makeAddressRange($fileByteStart, $fileByteEnd, $bytesPerRow, $addressValue))
  // $: physicalOffsets.set(makeOffsetRange($displayRadix, 2))

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
      <br />Size: <span id="file_byte_cnt">{fileSize}</span>
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
        <option value="16" selected>HEX</option>
        <option value="10">DEC</option>
        <option value="8">OCT</option>
        <option value="2">BIN</option>
      </select>
    </div>
  </fieldset>
  <fieldset class="box">
    <legend>Search</legend>
    <div class="search">
      <vscode-text-field id="search">
        Search:
        <section slot="end" style="display:flex; align-items: center;">
          <vscode-button appearance="icon" aria-label="Case Sensitive">
            <span class="codicon codicon-preserve-case" />
          </vscode-button>
          <vscode-button appearance="icon" aria-label="Case Insensitive">
            <span class="codicon codicon-case-sensitive" />
          </vscode-button>
        </section>
      </vscode-text-field>
      <vscode-text-field id="replace"> Replace: </vscode-text-field>
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
      </label><br />The Answer: {$answer}
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
      <option value="16" selected>Hexadecimal</option>
      <option value="10">Decimal</option>
      <option value="8">Octal</option>
      <!-- <option value="2">Binary</option> -->
    </select>
  </div>
  <div class="measure"><span contenteditable='true' id="physical_offsets" bind:innerHTML={physicalOffsetText}/></div>
  <div class="measure"><span id="logical_offsets" /></div>
  <div class="measure">
    <div>
      <span id="selected_offsets" />
      <span id="editor_offsets" />
    </div>
  </div>
  <textarea class="address_vw" id="address" contenteditable="true" readonly bind:innerHTML={addressText}/>
  <textarea class="physical_vw" id="physical" readonly />
  <textarea class="logicalView" id="logical" readonly />
  <div class="editView" id="edit_view">
    <textarea class="selectedContent" id="editor" readonly />
    <fieldset class="box">
      <legend>content controls</legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div>
            <vscode-button id="commit_btn" disabled
              >commit changes</vscode-button
            >
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
              <label for="endianness"
                >Endianness:
                <vscode-dropdown id="endianness">
                  <option value="le">Little</option>
                  <option value="be">Big</option>
                </vscode-dropdown>
              </label>
            </div>
            <div>
              <label for="edit_encoding"
                >Encoding:
                <select id="edit_encoding">
                  <optgroup label="Binary Encodings">
                    <option value="hex">Hexadecimal</option>
                    <option value="binary">Binary</option>
                    <option value="base64">Base64</option>
                  </optgroup>
                  <optgroup label="Single-Byte Character Encodings">
                    <option value="ascii">ASCII (7-bit)</option>
                    <option value="latin1">ISO-8859-1 (8-bit)</option>
                  </optgroup>
                  <optgroup label="Multi-Byte Character Encodings">
                    <option value="ucs2">UCS-2</option>
                    <option value="utf-8" selected>UTF-8</option>
                    <option value="utf-16le">UTF-16LE</option>
                  </optgroup>
                </select>
              </label>
            </div>
            <div class="advanced">
              <label for="lsb"
                >Least significant bit:
                <vscode-dropdown id="lsb">
                  <option value="h">Higher Offset</option>
                  <option value="l">Lower Offset</option>
                </vscode-dropdown>
              </label>
            </div>
            <div class="advanced">
              <label for="logical_byte_size"
                >Logical byte size:
                <vscode-dropdown id="logical_byte_size">
                  <option>8</option>
                  <option>7</option>
                  <option>6</option>
                </vscode-dropdown>
              </label>
            </div>
          </div>
          <div class="grid-container-column">
            <div id="data_vw" hidden>
              &nbsp;Offset: <span id="offset_dv">-</span>
              <span id="b8_dv">
                <br /><label for="int8_dv"
                  >&nbsp;&nbsp;&nbsp;int8: <vscode-text-field
                    id="int8_dv"
                  /></label
                >
                <br /><label for="uint8_dv"
                  >&nbsp;&nbsp;uint8: <vscode-text-field id="uint8_dv" /></label
                >
              </span>
              <span id="b16_dv">
                <br /><label for="int16_dv"
                  >&nbsp;&nbsp;int16: <vscode-text-field id="int16_dv" /></label
                >
                <br /><label for="uint16_dv"
                  >&nbsp;uint16: <vscode-text-field id="uint16_dv" /></label
                >
              </span>
              <span id="b32_dv">
                <br /><label for="int32_dv"
                  >&nbsp;&nbsp;int32: <vscode-text-field id="int32_dv" /></label
                >
                <br /><label for="uint32_dv"
                  >&nbsp;uint32: <vscode-text-field id="uint32_dv" /></label
                >
                <br /><label for="float32_dv"
                  >float32: <vscode-text-field id="float32_dv" /></label
                >
              </span>
              <span id="b64_dv">
                <br /><label for="int64_dv"
                  >&nbsp;&nbsp;int64: <vscode-text-field id="int64_dv" /></label
                >
                <br /><label for="uint64_dv"
                  >&nbsp;uint64: <vscode-text-field id="uint64_dv" /></label
                >
                <br /><label for="float64_dv"
                  >float64: <vscode-text-field id="float64_dv" /></label
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  </div>
</main>

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
</style>
