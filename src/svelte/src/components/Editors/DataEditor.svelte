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
    editorSelection,
    editMode,
    selectionDataStore,
    regularSizedFile,
    viewport,
    selectionSize,
    addressRadix,
  } from '../../stores'
  import { EditByteModes, type RadixValues } from '../../stores/configuration'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import { createEventDispatcher } from 'svelte'
  import ContentControls from '../DataDisplays/Fieldsets/ContentControls.svelte'
  import FlexContainer from '../layouts/FlexContainer.svelte'
  import DataView from '../DataDisplays/Fieldsets/DataView.svelte'
  import HelpIcon from '../layouts/HelpIcon.svelte'
  const eventDispatcher = createEventDispatcher()

  let selectionOffsetText: string
  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $viewport.fileOffset + $selectionDataStore.startOffset,
    $viewport.fileOffset + $selectionDataStore.endOffset,
    $selectionSize,
    $addressRadix
  )

  let displayTextEditorArea: boolean
  $: displayTextEditorArea = $editMode === EditByteModes.Multiple && ($selectionDataStore.active || !$regularSizedFile)

  function clearDataDisplays() {
    eventDispatcher('clearDataDisplays')
  }
  function handleEditorEvent(event: Event) {
    switch (event.type) {
      case 'input':
        {
          const eventDetails = event as InputEvent
          const editorElement = eventDetails.target as HTMLTextAreaElement
          editorSelection.update(() => {
            return editorElement.value
          })
        }

        break
      case 'click':
        {
          const eventDetails = event as MouseEvent
        }
        break
    }
    eventDispatcher('handleEditorEvent', event)
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
</script>

<div 
  class="editView" 
  id="edit_view"
  style:justify-content={displayTextEditorArea ? 'flex-end' : 'flex-start'}
>
  <div class="hdr editor-header" >
    <div class={$UIThemeCSSClass + ' hd'}>Editor <HelpIcon helpSectionId={'edit-instructions'}/></div>
    <div class={$UIThemeCSSClass + " measure selection-content"}>
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
      {/if}
    </div>
  </div>
    {#if displayTextEditorArea}
      <textarea
        class={$UIThemeCSSClass}
        id="selectedContent"
        contenteditable="true"
        on:keyup|nonpassive={handleEditorEvent}
        on:click={handleEditorEvent}
        on:input={handleEditorEvent}
        bind:value={$editorSelection}
      />
  
      <FlexContainer>
        <ContentControls on:applyChanges />
      </FlexContainer>
    {:else}
      <FlexContainer>
        <DataView on:applyChanges />
      </FlexContainer>
    {/if}

</div>

<style lang="scss">
  div.hdr {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #2f3e4f;
    border: 0;
  }
  .selection-content {
    display: flex;
    width: 100%;
  }
</style>
