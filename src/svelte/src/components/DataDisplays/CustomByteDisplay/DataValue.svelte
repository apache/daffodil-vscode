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
    latin1Undefined,
    type ByteValue,
    type ViewportDataType,
  } from './BinaryData'
  import type { ByteDivWidth } from '../../../utilities/display'

  export let id: ViewportDataType
  export let byte: ByteValue
  export let disabled = false
  export let width: ByteDivWidth = '20px'
  export let categoryIndicationSelectors: string
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if disabled}
  <div class="byte disabled" style:width={id === 'logical' ? '20px' : width} />
{:else if id === 'physical'}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class={'byte ' + categoryIndicationSelectors}
    id={id + '-' + byte.offset.toString()}
    style:width
    offset={byte.offset}
  >
    {byte.text}
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class={'byte ' + categoryIndicationSelectors}
    id={id + '-' + byte.offset.toString()}
    style:width={'20px'}
    class:latin1Undefined={latin1Undefined(byte.value)}
    offset={byte.offset}
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
    border-style: solid;
    border-width: 2px;
    border-color: transparent;
    height: 20px;
    text-align: center;
    transition: all 0.25s;
    border-radius: 5px;
    user-select: none;
  }
  div.byte.selected {
    background-color: var(--color-secondary-light);
    color: var(--color-secondary-darkest);
  }
  div.byte.searchresult {
    border-color: var(--color-search-result);
  }
  div.byte.replacement {
    border-color: var(--color-replace-result);
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
