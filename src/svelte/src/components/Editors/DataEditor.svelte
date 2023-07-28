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
  import { editorSelection, editMode, selectionDataStore } from '../../stores'
  import { EditByteModes } from '../../stores/configuration'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import { createEventDispatcher } from 'svelte'
  import ContentControls from '../DataDisplays/Fieldsets/ContentControls.svelte'
  import FlexContainer from '../layouts/FlexContainer.svelte'
  import DataView from '../DataDisplays/Fieldsets/DataView.svelte'
  const eventDispatcher = createEventDispatcher()

  function handleEditorEvent(event: Event) {
    switch (event.type) {
      case 'input':
        {
          const eventDetails = event as InputEvent
          const editorElement = eventDetails.target as HTMLTextAreaElement
          $editorSelection = editorElement.value
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
</script>

<div class="editView" id="edit_view">
  {#if $editMode === EditByteModes.Multiple && $selectionDataStore.active}
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
      <ContentControls on:commitChanges />
    </FlexContainer>
  {:else}
    <FlexContainer>
      <DataView on:commitChanges />
    </FlexContainer>
  {/if}
</div>
