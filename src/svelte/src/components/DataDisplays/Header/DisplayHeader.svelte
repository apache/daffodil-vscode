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
    seekOffset,
    seekOffsetInput,
    seekOffsetSearchType,
    bytesPerRow,
    visableViewports,
  } from '../../../stores'
  import {
    ADDRESS_RADIX_OPTIONS,
    type RadixValues,
    type BytesPerRow,
    RADIX_OPTIONS,
  } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import { OffsetSearchType } from '../../Header/fieldsets/SearchReplace'
  import { byteDivWidthFromRadix } from '../../../utilities/display'
  let bitIndexStr = '01234567'
  let offsetLine: string[] = []

  $: {
    offsetLine = generate_offset_headers(
      $addressRadix,
      $displayRadix,
      $bytesPerRow
    )
  }

  function generate_offset_headers(
    addressRadix: RadixValues,
    displayRadix: RadixValues,
    bytesPerRow: BytesPerRow
  ) {
    let ret: string[] = []

    if (displayRadix != RADIX_OPTIONS.Binary) {
      for (let i = 0; i < bytesPerRow; i++) {
        ret.push(i.toString(addressRadix).padStart(2, '0'))
      }
    } else {
      for (let i = 0; i < bytesPerRow; i++) {
        ret.push(i.toString(addressRadix))
      }
    }
    return ret
  }

  export function setSelectionOffsetInfo(
    from: string,
    start: number,
    end: number,
    size: number,
    radix: RadixValues
  ): string {
    return `${from} [${start.toString(radix)} - ${end.toString(
      radix
    )}] Size: ${size.toString(radix)} `
  }

  function updateAddressValue(event: Event) {
    const addrSelect = event.target as HTMLSelectElement
    const newAddrRadix = parseInt(addrSelect.value) as RadixValues

    if ($seekOffsetSearchType === OffsetSearchType.RELATIVE) {
      const sign = $seekOffsetInput.substring(0, 1)
      const value = parseInt(
        $seekOffsetInput.substring(1),
        $addressRadix
      ).toString(newAddrRadix)
      $seekOffsetInput = value === 'NaN' ? '0' : sign + value
    } else {
      const newSeekInput = $seekOffset.toString(parseInt(addrSelect.value))
      $seekOffsetInput = newSeekInput === 'NaN' ? '0' : newSeekInput
    }
    $addressRadix = newAddrRadix
  }
</script>

<div class="headers">
  <div class="hdr address-header" style:min-width="110px">
    <div class={$UIThemeCSSClass + ' hd'}>Address</div>
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
  {#if $visableViewports === 'physical' || $visableViewports === 'all'}
    <div class="hdr physical-header">
      <div class={$UIThemeCSSClass + ' hd'}>Physical</div>
      <div class={$UIThemeCSSClass + ' measure physical-viewport-header'}>
        {#if $displayRadix === RADIX_OPTIONS.Binary}
          {#each offsetLine as offset}
            <div
              class="physical-addr-seg binary"
              style:min-width={byteDivWidthFromRadix($displayRadix)}
            >
              <div><b>{offset}</b></div>
              <div><b>{bitIndexStr}</b></div>
            </div>
          {/each}
        {:else}
          {#each offsetLine as offset}
            <div
              class="physical-addr-seg"
              style:min-width={byteDivWidthFromRadix($displayRadix)}
            >
              <b>{offset}</b>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
  {#if $visableViewports === 'logical' || $visableViewports === 'all'}
    <div class="hdr logical-header">
      <div class={$UIThemeCSSClass + ' hd'}>Logical</div>
      <div
        class={$UIThemeCSSClass + ' measure logical logical-viewport-header'}
        style:align-items={$displayRadix === RADIX_OPTIONS.Binary
          ? 'flex-end'
          : 'normal'}
      >
        {#each offsetLine as offset}
          <div
            class="logical-addr-seg"
            style:min-width={byteDivWidthFromRadix(RADIX_OPTIONS.Hexadecimal)}
          >
            {offset}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  div.hdr {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  div.hdr .measure {
    flex-direction: row;
  }
  div.headers {
    display: flex;
    flex-direction: row;
  }
  div.logical-addr-seg,
  div.physical-addr-seg {
    writing-mode: vertical-lr;
    text-orientation: upright;
    cursor: default;
    border-width: 0 2px 0 2px;
    border-style: solid;
    border-color: transparent;
  }
  div.logical-addr-seg {
    width: 20px;
  }
  div.physical-addr-seg.binary {
    writing-mode: horizontal-tb;
    text-orientation: sideways;
  }
  div.physical-viewport-header {
    padding-left: 2px;
  }
  div.physical-viewport-header,
  div.logical-viewport-header {
    display: flex;
  }
  div.physical-header,
  div.logical-header,
  div.address-header {
    background: #2f3e4f;
  }
  div.logical-header,
  div.physical-header {
    border: 1px solid transparent;
  }
</style>
