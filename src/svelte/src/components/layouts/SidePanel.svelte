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
  // position for the side panel: top-left, top-right, bottom-left, bottom-right
  export let position = 'top-left'

  // title for the side panel
  export let title = 'Side Panel Title'

  // whether the side panel is open or not
  export let open = false

  export let panelWidth = '300px' // Default width
</script>

{#if open}
  <div class="overlay" on:click={() => (open = false)} />
{/if}

<div
  class={`side-panel ${position} ${open ? 'open' : ''}`}
  style="width: {panelWidth};"
>
  <div class="tab" on:click={() => (open = false)}>
    <span>{title}</span>
  </div>
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .side-panel {
    position: fixed;
    height: 100vh;
    background-color: #21262a;
    transition: 0.4s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 999;
    font-family: var(--monospace-font);
    color: #ffffff;
  }

  .top-left {
    top: 0;
    left: 0;
    transform: translateX(-100%);
  }

  .top-right {
    top: 0;
    right: 0;
    transform: translateX(100%);
  }

  .bottom-left {
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
  }

  .bottom-right {
    bottom: 0;
    right: 0;
    transform: translateX(100%);
  }

  .open {
    transform: translateX(0);
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 65%);
    z-index: 998;
    transition: opacity 0.3s;
    cursor: pointer;
  }

  .open + .overlay {
    opacity: 1;
    pointer-events: auto;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    background-color: #444;
    cursor: pointer;
    border-bottom: 4px solid #555;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .tab span {
    font-weight: bold;
  }

  .content {
    padding: 4px;
  }
</style>
