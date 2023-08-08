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
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    byteDivWidthFromRadix,
    type ByteDivWidth,
    radixBytePad,
  } from '../../../utilities/display'
  import {
    editorSelection,
    displayRadix,
    editByte,
    selectionDataStore,
    commitErrMsg,
    committable,
    seekOffsetInput,
    addressRadix,
    rerenderActionElements,
    focusedViewportId,
  } from '../../../stores'
  import { enterKeypressEvents } from '../../../utilities/enterKeypressEvents'
  import { bytesPerRow, type ByteValue, type EditAction } from './BinaryData'
  import {
    UIThemeCSSClass,
    type CSSThemeClass,
  } from '../../../utilities/colorScheme'
  import {
    EditActionRestrictions,
    editorActionsAllowed,
  } from '../../../stores/configuration'

  const eventDispatcher = createEventDispatcher()

  type Actions = 'input' | 'insert-before' | 'insert-after' | 'delete'
  type ActionElementPosition = {
    viewportLine: number
    viewportByteIndex: number
  }
  type ActionElement = {
    id: string
    position: ActionElementPosition
    HTMLRef: HTMLDivElement | HTMLInputElement
  }
  type ActionElements = {
    [k in Actions]: ActionElement
  }
  let actionElements: ActionElements = {
    input: {
      id: 'binary-action-input',
      HTMLRef: undefined as HTMLInputElement,
      position: { viewportLine: -1, viewportByteIndex: -1 },
    },
    'insert-before': {
      id: 'binary-action-before',
      HTMLRef: undefined,
      position: { viewportLine: -1, viewportByteIndex: -1 },
    },
    'insert-after': {
      id: 'binary-action-after',
      HTMLRef: undefined,
      position: { viewportLine: -1, viewportByteIndex: -1 },
    },
    delete: {
      id: 'binary-action-delete',
      HTMLRef: undefined,
      position: { viewportLine: -1, viewportByteIndex: -1 },
    },
  }

  enterKeypressEvents.register({
    id: actionElements.input.id,
    run: () => {
      if (invalid || inProgress) return
      commitChanges('byte-input')
    },
  })

  export let byte: ByteValue
  let target: HTMLDivElement
  let targetParent: HTMLDivElement
  let targetElementId: string
  let BPR = $bytesPerRow

  let editedByteText: string
  let invalid: boolean
  let inProgress: boolean
  let active: boolean

  let elementDivWidth: ByteDivWidth
  let restorationFns: Array<() => void> = []
  let themeClass: CSSThemeClass

  $: themeClass = $UIThemeCSSClass
  $: {
    active = $selectionDataStore.active
    BPR = $bytesPerRow
    elementDivWidth =
      $focusedViewportId === 'physical'
        ? byteDivWidthFromRadix($displayRadix)
        : '20px'
    targetElementId = byteOffsetToElementId(byte.offset)
  }
  $: {
    if (
      !$committable &&
      $commitErrMsg.length > 0 &&
      $editorSelection.length >= radixBytePad($displayRadix)
    ) {
      invalid = true
      inProgress = false
    } else if (
      !$committable &&
      $commitErrMsg.length > 0 &&
      $editorSelection.length < radixBytePad($displayRadix)
    ) {
      invalid = false
      inProgress = true
    } else {
      invalid = false
      inProgress = false
    }
  }

  onMount(() => {
    target = document.getElementById(targetElementId) as HTMLDivElement
    if (target) targetParent = target.parentElement as HTMLDivElement
    else {
      // if byte.offset within viewport but outside of display
      $seekOffsetInput = byte.offset.toString($addressRadix)
      eventDispatcher('seek')
      return
    }

    $editorSelection = byte.text
    grab_action_element_refs()
    initialize_action_elements()

    actionElements['input'].HTMLRef.focus()
    actionElements['input'].HTMLRef.value = ''

    return restore_original_target
  })

  function grab_action_element_refs() {
    for (const element in actionElements)
      actionElements[element as Actions].HTMLRef = document.getElementById(
        actionElements[element].id
      ) as ActionElement['HTMLRef']
  }

  function initialize_action_elements() {
    setup_action_element('input')
    if ($editorActionsAllowed == EditActionRestrictions.OverwriteOnly) return

    setup_action_element('insert-before')
    setup_action_element('insert-after')
  }

  function restore_original_target() {
    const input = document.getElementById(
      'binary-action-input'
    ) as HTMLInputElement
    if (target && input) {
      restorationFns.forEach((fn) => {
        fn()
      })
      restorationFns = []
    }
    if ($rerenderActionElements) $rerenderActionElements = false
  }

  function update_selectedByte(editByte: ByteValue) {
    if (invalid) return
    byte = editByte
  }

  function send_delete(_: Event) {
    commitChanges('delete')
  }

  function setup_action_element(element: Actions) {
    switch (element) {
      case 'input':
        const inputContainer = actionElements[element].HTMLRef
          .parentElement as HTMLDivElement
        apply_element_replacements(targetParent, target, inputContainer)
        break

      case 'insert-before':
        {
          const previousByteId = byteOffsetToElementId(byte.offset - 1)
          const insertBeforeElement = actionElements[element]
            .HTMLRef as HTMLDivElement
          let elementToReplace = document.getElementById(
            previousByteId
          ) as HTMLDivElement

          if (!elementToReplace) break

          targetParent.contains(elementToReplace)
            ? apply_element_replacements(
                targetParent,
                elementToReplace,
                insertBeforeElement
              )
            : apply_element_replacements(
                elementToReplace.parentElement,
                elementToReplace,
                insertBeforeElement
              )
        }
        break

      case 'insert-after':
        {
          const nextByteId = byteOffsetToElementId(byte.offset + 1)
          const insertAfterElement = actionElements[element]
            .HTMLRef as HTMLDivElement

          let elementToReplace = document.getElementById(
            nextByteId
          ) as HTMLDivElement

          if (!elementToReplace) break

          targetParent.contains(elementToReplace)
            ? apply_element_replacements(
                targetParent,
                elementToReplace,
                insertAfterElement
              )
            : apply_element_replacements(
                elementToReplace.parentElement,
                elementToReplace,
                insertAfterElement
              )
        }
        break
    }
  }

  function apply_element_replacements(
    parent: HTMLElement,
    replacee: HTMLDivElement | HTMLInputElement,
    replacer: HTMLDivElement | HTMLInputElement
  ) {
    parent.replaceChild(replacer, replacee)
    restorationFns.push(() => {
      parent.replaceChild(replacee, replacer)
    })
  }

  function send_insert(event: Event) {
    const target = event.target as HTMLElement
    switch (target.id) {
      case actionElements['insert-after'].id:
        commitChanges('insert-after')
        break
      case actionElements['insert-before'].id:
        commitChanges('insert-before')
        break
    }
  }

  function commitChanges(action: EditAction) {
    if (action === 'byte-input') {
      update_selectedByte({
        text: $editorSelection,
        offset: byte.offset,
        value: parseInt(editedByteText, 16),
      })
    }

    eventDispatcher('commitChanges', {
      byte: byte,
      action: action,
    })
  }
  function handleEditorEvent() {
    eventDispatcher('handleEditorEvent')
  }
  function byteOffsetToElementId(byteOffset: number): string {
    return $focusedViewportId + '-' + byteOffset.toString()
  }
  function element_byteline_position(
    targetElement: HTMLDivElement
  ): number | undefined {
    const index = parseInt(targetElement.id) + 1
    return index % BPR
  }
</script>

{#if $editorActionsAllowed == EditActionRestrictions.None}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="insert-before {themeClass}"
    id={actionElements['insert-before'].id}
    style:width={elementDivWidth}
    on:click={send_insert}
  >
    &#8676;
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="insert-after {themeClass}"
    id={actionElements['insert-after'].id}
    style:width={elementDivWidth}
    on:click={send_insert}
  >
    &#8677;
  </div>

  <span>
    <input
      class="insert {themeClass}"
      id={actionElements['input'].id}
      class:invalid
      class:inProgress
      style:width={elementDivWidth}
      placeholder={$editByte}
      bind:value={$editorSelection}
      on:input={handleEditorEvent}
    />

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="delete {themeClass}"
      id={actionElements['delete'].id}
      style:width={elementDivWidth}
      on:click={send_delete}
    >
      &#10006;
    </div>
  </span>
{:else}
  <span>
    <input
      class="insert {themeClass}"
      id={actionElements['input'].id}
      class:invalid
      class:inProgress
      style:width={elementDivWidth}
      placeholder={$editByte}
      bind:value={$editorSelection}
      on:input={handleEditorEvent}
    />
  </span>
{/if}

<style lang="scss">
  @keyframes shake {
    0%,
    100% {
      translate: 0;
    }
    25% {
      translate: -3px;
    }
    75% {
      translate: 3px;
    }
  }
  input,
  div.insert-before,
  div.insert-after,
  div.delete {
    height: 20px;
    font-family: var(--monospace-font);
    font-weight: normal;
    text-align: center;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    border-color: var(--color-primary-dark);
    transition: border-color 0.25s, top 0.15s, left 0.15s, right 0.15s;
    outline: none;
  }
  input {
    padding: 0;
    background-color: var(--color-secondary-light);
    color: var(--color-secondary-darkest);
  }
  input::placeholder {
    font-size: 12px;
    font-style: normal;
  }
  input.invalid {
    border-color: crimson;
    animation: shake 0.15s 3;
  }
  input.inProgress {
    border-color: gold;
  }
  div.insert-before,
  div.insert-after,
  div.delete {
    font-size: 20px;
    line-height: 1;
    z-index: 1;
  }
  div.insert-before,
  div.insert-after {
    font-size: 20px;
    border-style: dashed;
    border-color: var(--color-secondary-mid);
    background-color: transparent;
  }
  div.insert-before:hover,
  div.insert-after:hover {
    color: var(--color-secondary-lightest);
    border-color: var(--color-secondary-light);
    cursor: pointer;
  }
  div.delete {
    position: absolute;
    background-color: crimson;
    border-style: solid;
    color: var(--color-secondary-lightest);
    transition: none;
  }
  div.delete:hover {
    border-color: var(--color-secondary-light);
    cursor: pointer;
  }
</style>
