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
  import { tooltipsEnabled } from '../../stores'

  const NULL = () => {}
  const TOOLTIP_MIN_WIDTH = 50
  const TOOLTIP_MIN_HEIGHT = 25
  export let description: string
  export let alwaysEnabled = false
  export let tooltipSizeExtended = false
  let showTooltip = false
  let left = 0,
    top = 0

  function renderTooltip(event: MouseEvent) {
    const targetElement = event.target as HTMLElement

    switch (event.type) {
      case 'mouseenter':
        const clientWidth = document.body.clientWidth
        const targetOffsetLeft = targetElement.offsetLeft
        const clientHeight = window.innerHeight
        const targetOffsetTop = targetElement.offsetTop
        const targetHeight = targetElement.offsetHeight

        left =
          clientWidth - targetOffsetLeft + TOOLTIP_MIN_WIDTH > targetOffsetLeft
            ? targetOffsetLeft
            : targetOffsetLeft - TOOLTIP_MIN_WIDTH

        top =
          targetOffsetTop + targetHeight + TOOLTIP_MIN_HEIGHT <
          clientHeight - TOOLTIP_MIN_HEIGHT
            ? targetOffsetTop + targetHeight + 5
            : targetOffsetTop - TOOLTIP_MIN_HEIGHT

        showTooltip = true
        break
      case 'mouseleave':
        showTooltip = false
        break
    }
  }
</script>

{#if ($tooltipsEnabled || alwaysEnabled) && description.length > 0}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    on:mouseenter={showTooltip ? NULL : renderTooltip}
    on:mouseleave={showTooltip ? renderTooltip : NULL}
  >
    <slot />
  </span>

  {#if showTooltip}
    <div
      class="tooltip {tooltipSizeExtended ? 'extended' : 'fit-content'}"
      style:left={left.toString() + 'px'}
      style:top={top.toString() + 'px'}
    >
      {description}
    </div>
  {/if}
{:else}
  <span><slot /></span>
{/if}

<style lang="scss">
  .tooltip {
    position: absolute;
    display: flex;
    align-content: center;
    align-items: center;
    text-align: center;
    font-size: 12px;
    background-color: var(--color-secondary-darkest);
    color: var(--color-secondary-lightest);
    border: 2px solid var(--color-tertiary-mid);
    opacity: 0.85;
    z-index: 99;
  }
  .extended {
    width: 250px;
    height: 300px;
    padding: 5px;
  }

  .fit-content {
    max-width: 150px;
    min-width: 50px;
    max-height: 50px;
    min-height: 25px;
    padding: 2px;
  }
</style>
