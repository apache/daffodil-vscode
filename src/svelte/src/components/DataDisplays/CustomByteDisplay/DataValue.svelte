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
  import { createEventDispatcher } from 'svelte'
  import {
    latin1Undefined,
    type ByteSelectionEvent,
    type ByteValue,
    type ViewportDataType,
  } from './BinaryData'
  import type { SelectionData_t } from '../../../stores'
  import type { ByteDivWidth } from '../../../utilities/display'
  import type { RadixValues } from '../../../stores/configuration'
  import { selectionHighlightMask } from '../../../utilities/highlights'

  export let id: ViewportDataType
  export let byte: ByteValue
  export let selectionData: SelectionData_t
  export let radix: RadixValues
  export let disabled = false
  export let width: ByteDivWidth = '20px'
  export let isSelected = false
  export let possibleSelection = false
  export let isSearchResult = 0

  const eventDispatcher = createEventDispatcher()

  let makingSelection = false

  $: {
    makingSelection =
      selectionData.startOffset >= 0 && selectionData.active === false
    $selectionHighlightMask = makingSelection === true ? 1 : 0
  }

  function mouse_enter_handle(event: MouseEvent) {
    if (!makingSelection) return
    if (disabled) {
      selectionData.endOffset = -1
      makingSelection = false
      return
    }
    selectionData.endOffset = byte.offset
  }
  function mouse_leave_handle(event: MouseEvent) {
    if (!makingSelection) return
    selectionData.endOffset = -1
  }
  function mouse_event_handle(event: MouseEvent) {
    const type = event.type
    const targetElement = event.target
    if (id === 'logical') byte.text = String.fromCharCode(byte.value)
    eventDispatcher(type, {
      targetElement: targetElement,
      targetByte: byte,
      fromViewport: id,
    } as ByteSelectionEvent)
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if disabled}
  <div class="byte disabled" style:width={id === 'logical' ? '20px' : width} />
{:else if id === 'physical'}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="byte"
    class:isSelected
    class:isSearchResult
    class:possibleSelection
    id={id + '-' + byte.offset.toString()}
    style:width
    on:mouseup={mouse_event_handle}
    on:mousedown={mouse_event_handle}
    on:mouseenter={mouse_enter_handle}
    on:mouseleave={mouse_leave_handle}
  >
    {byte.text}
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="byte"
    class:isSelected
    class:isSearchResult
    class:possibleSelection
    id={id + '-' + byte.offset.toString()}
    style:width={'20px'}
    class:latin1Undefined={latin1Undefined(byte.value)}
    on:mouseup={mouse_event_handle}
    on:mousedown={mouse_event_handle}
    on:mouseenter={mouse_enter_handle}
    on:mouseleave={mouse_leave_handle}
  >
    {latin1Undefined(byte.value) ? '' : String.fromCharCode(byte.value)}
  </div>
{/if}

<style>
  div.byte {
    background-color: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: var(--monospace-font);
    /* border-radius: 5px; */
    border-style: solid;
    border-width: 2px;
    border-color: transparent;
    height: 20px;
    text-align: center;
    transition: all 0.25s;
  }
  div.byte.isSelected,
  div.byte.isSearchResult,
  div.byte.possibleSelection {
    border-radius: 5px;
  }
  div.byte.isSelected {
    background-color: var(--color-secondary-light);
    color: var(--color-secondary-darkest);
  }
  div.byte.isSearchResult {
    background-color: var(--color-tertiary-light);
    color: var(--color-secondary-darkest);
  }
  div.byte.possibleSelection {
    border-color: var(--color-secondary-light);
  }
  div.byte:hover {
    border-color: var(--color-secondary-mid);
    cursor: pointer;
  }
  div.byte::selection {
    background-color: transparent;
  }
  div.latin1Undefined::after {
    content: '?';
    font-size: 16px;
    filter: brightness(0.75);
  }
  div.disabled {
    background-color: var(--color-primary-darkest);
    color: var(--color-primary-darkest);
    cursor: default;
  }
</style>
