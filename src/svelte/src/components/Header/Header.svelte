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
  import FileMetrics from './fieldsets/FileMetrics.svelte'
  import { fileMetrics } from './fieldsets/FileMetrics'
  import SearchReplace from './fieldsets/SearchReplace.svelte'
  import Settings from './fieldsets/Settings.svelte'
  import FlexContainer from '../layouts/FlexContainer.svelte'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  let hideChildren = false
</script>

{#if hideChildren}
  <FlexContainer>
    <FlexContainer --justify-content="space-between" --align-items="center">
      <div class="filename-display"><b>File:</b> {$fileMetrics.name}</div>
      <button
        class={$UIThemeCSSClass + ' minmax-icon'}
        on:click={() => {
          hideChildren = hideChildren ? false : true
        }}><span class="material-symbols-outlined">expand_all</span></button
      >
    </FlexContainer>
  </FlexContainer>
{:else}
  <FlexContainer --height="150pt">
    <header>
      <FlexContainer --height="fit-content">
        <FileMetrics on:clearChangeStack on:redo on:undo />
        <SearchReplace on:seek on:clearDataDisplays />
        <Settings on:seek />
      </FlexContainer>
    </header>
    <div class="display-icons">
      <button
        class={$UIThemeCSSClass + ' minmax-icon'}
        on:click={() => {
          hideChildren = hideChildren ? false : true
        }}><span class="material-symbols-outlined">expand_all</span></button
      >
    </div>
  </FlexContainer>
{/if}

<style>
  header {
    display: flex;
    justify-content: center;
    width: 100%;
    max-height: 120pt;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header div.display-icons {
    justify-content: space-between;
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

  button.minmax-icon {
    min-width: 14px;
    font-weight: bold;
    width: fit-content;
  }
  div.filename-display {
    font-size: medium;
    padding: 5px;
  }
</style>
