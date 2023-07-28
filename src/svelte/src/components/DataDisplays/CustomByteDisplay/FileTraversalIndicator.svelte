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

  const eventDispatcher = createEventDispatcher()

  export let totalLines = 0
  export let currentLine = 0
  export let fileOffset = 0
  export let bytesPerRow = 16
  export let percentageTraversed
  export let maxDisplayLines = 20

  let indicatorContainer: HTMLElement
  let indicatorClickDisabled: boolean = false

  $: {
    if (totalLines <= maxDisplayLines) {
      percentageTraversed = 100.0
      indicatorClickDisabled = true
      if (indicatorContainer)
        indicatorContainer.removeEventListener(
          'click',
          updatePercentageTraversed
        )
    } else {
      indicatorClickDisabled = false
      percentageTraversed =
        ((currentLine + (fileOffset / bytesPerRow + 20)) / totalLines) * 100.0
      if (indicatorContainer)
        indicatorContainer.addEventListener('click', updatePercentageTraversed)
    }
  }

  function updatePercentageTraversed(e: MouseEvent) {
    // Calculate the position of the click relative to the indicator container
    const relativeClickPosition =
      e.clientX - indicatorContainer.getBoundingClientRect().left

    // Calculate the width of the indicator container
    const indicatorContainerWidth =
      indicatorContainer.getBoundingClientRect().width

    // Calculate the percentage into the file
    percentageTraversed =
      (relativeClickPosition / indicatorContainerWidth) * 100.0
    eventDispatcher('indicatorClicked', percentageTraversed)
  }
</script>

<div class="traversal-container" bind:this={indicatorContainer}>
  <div class="traversal-thumb" style:width="{percentageTraversed}%" />
</div>

<style lang="scss">
  div.traversal-container {
    background-color: var(--color-secondary-dark);
  }
  div.traversal-thumb {
    background-color: var(--color-secondary-light);
    transition: all 0.5s;
  }
  div.traversal-container,
  div.traversal-thumb {
    height: 8px;
  }
  div.traversal-container:hover {
    cursor: pointer;
  }
</style>
