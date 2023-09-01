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
    currentHelpSectionDisplayed,
    currentHelpSectionEvent,
  } from '../../stores'
  import { AvailableHelpSections } from './Help'

  let displayHelp = false
  let top, left: string

  $: displayHelp = $currentHelpSectionDisplayed.length > 0
  $: {
    let sectionTarget = $currentHelpSectionEvent.target as HTMLElement
    if (sectionTarget) {
      top =
        sectionTarget.offsetTop + 352 > document.body.clientHeight
          ? (document.body.clientHeight - 352).toString() + 'px'
          : sectionTarget.offsetTop.toString() + 'px'
      left =
        sectionTarget.offsetLeft + 402 > document.body.clientWidth
          ? (document.body.clientWidth - 402).toString() + 'px'
          : sectionTarget.offsetLeft.toString() + 'px'
    }
  }
</script>

{#if displayHelp}
  <div class="help-container" style:top style:left>
    <div class="header">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <span
        class="material-symbols-outlined exit"
        on:click={() => {
          $currentHelpSectionDisplayed = ''
        }}
        >close
      </span>
      <h3>Help: {AvailableHelpSections[$currentHelpSectionDisplayed].title}</h3>
    </div>

    {#each AvailableHelpSections[$currentHelpSectionDisplayed].descriptionBody as sectional}
      <div class="help-section-info">
        {@html sectional}
      </div>
    {/each}
  </div>
{/if}

<style lang="scss">
  div.help-container {
    position: absolute;
    max-height: 350px;
    min-height: 200px;
    max-width: 400px;
    min-width: 250px;
    background-color: var(--color-secondary-darkest);
    color: var(--color-secondary-lightest);
    border: 2px solid var(--color-tertiary-mid);
    padding: 0 5px 5px 5px;
    overflow-y: scroll;
  }
  div.help-container .header {
    display: flex;
    align-items: center;
    height: 30px;
    border-width: 0 0 2px 0;
    border-color: grey;
    border-style: solid;
  }
  div.help-container h3 {
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
  span.exit {
    cursor: pointer;
    color: grey;
    font-size: 20px;
  }
  span.exit:hover {
    color: white;
  }
</style>
