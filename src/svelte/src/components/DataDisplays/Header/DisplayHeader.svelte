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
    addressRadix,
    displayRadix,
    editMode,
    seekOffset,
    seekOffsetInput,
    selectionDataStore,
    selectionSize,
  } from '../../../stores'
  import {
    EditByteModes,
    ADDRESS_RADIX_OPTIONS,
    type RadixValues,
    type BytesPerRow,
    RADIX_OPTIONS,
  } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import { createEventDispatcher } from 'svelte'
  import { bytesPerRow } from '../CustomByteDisplay/BinaryData'

  type ViewportDivSpread = '24px' | '28px' | '68px'

  const eventDispatcher = createEventDispatcher()
  const bitNumText = '01234567'
  const physicalOffsetSpreads = {
    16: '24px',
    10: '28px',
    8: '28px',
    2: '68px',
  }

  let phyiscalOffsetSpread: ViewportDivSpread
  let selectionOffsetText: string
  let offsetLine = []

  $: {
    offsetLine = generate_offset_headers(
      $addressRadix,
      $displayRadix,
      $bytesPerRow
    )
  }

  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $selectionDataStore.startOffset,
    $selectionDataStore.endOffset,
    $selectionSize
  )

  function generate_offset_headers(
    addressRadix: RadixValues,
    displayRadix: RadixValues,
    bytesPerRow: BytesPerRow
  ) {
    let ret = []

    if (displayRadix != RADIX_OPTIONS.Binary) {
      for (let i = 0; i < bytesPerRow; i++) {
        ret.push(i.toString(addressRadix).padStart(2, '0').toUpperCase())
      }
    } else {
      for (let i = 0; i < 8; i++) {
        ret.push(i.toString(10))
      }
    }
    phyiscalOffsetSpread = physicalOffsetSpreads[
      displayRadix
    ] as ViewportDivSpread
    return ret
  }

  export function setSelectionOffsetInfo(
    from: string,
    start: number,
    end: number,
    size: number
  ): string {
    return `${from} [${start} - ${end}] Size: ${size} `
  }

  function updateAddressValue(event: Event) {
    const addrSelect = event.target as HTMLSelectElement
    const newSeekInput = $seekOffset.toString(parseInt(addrSelect.value))
    $seekOffsetInput = newSeekInput === 'NaN' ? '0' : newSeekInput
    $addressRadix = parseInt(addrSelect.value) as RadixValues
  }

  function clearDataDisplays() {
    eventDispatcher('clearDataDisplays')
  }
</script>

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
    {#each ADDRESS_RADIX_OPTIONS as { name, value }}
      <option {value}>{name}</option>
    {/each}
  </select>
</div>

<div class={$UIThemeCSSClass + ' measure physical-viewport-header'}>
  {#if $displayRadix === RADIX_OPTIONS.Binary}
    {#each offsetLine as offset}
      <div class="phyiscal-addr-seg binary" style:width={phyiscalOffsetSpread}>
        <div>{offset}</div>
        <div>{bitNumText}</div>
      </div>
    {/each}
  {:else}
    {#each offsetLine as offset}
      <div class="physical-addr-seg" style:width={phyiscalOffsetSpread}>
        {offset}
      </div>
    {/each}
  {/if}
</div>

<div class={$UIThemeCSSClass + ' measure logical-viewport-header'}>
  {#each offsetLine as offset}
    <div class="logical-addr-seg">{offset}</div>
  {/each}
</div>

<div class={$UIThemeCSSClass + ' measure selection'}>
  {#if $selectionDataStore.active && $editMode !== EditByteModes.Single}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="clear-selection"
      title="Clear selection data"
      on:click={clearDataDisplays}
      on:keypress={clearDataDisplays}
    >
      &#10006;
    </div>
    <div>
      {selectionOffsetText}
    </div>
  {:else}
    <div>
      <sub
        ><i
          >To edit multiple bytes, highlight (by clicking and dragging) a
          selection of bytes</i
        ></sub
      >
    </div>
  {/if}
</div>

<style lang="scss">
  div.physical-addr-seg,
  div.logical-addr-seg {
    writing-mode: vertical-lr;
    text-orientation: upright;
    cursor: default;
  }
  div.logical-addr-seg {
    width: 24px;
  }
  div.div.physical-addr-seg.binary {
    writing-mode: horizontal-tb;
    text-orientation: sideways;
  }
  div.physical-viewport-header {
    padding-left: 4px;
  }
</style>
