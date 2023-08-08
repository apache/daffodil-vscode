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
  import { tooltipsEnabled } from '../../utilities/display'

  const NULL = () => {}

  export let description: string
  export let alwaysEnabled = false
  let showTooltip = false
  let left = 0,
    top = 0

  function renderTooltip(event: MouseEvent) {
    const targetElement = event.target as HTMLElement

    switch (event.type) {
      case 'mouseenter':
        left = targetElement.offsetLeft
        top = targetElement.offsetTop + targetElement.offsetHeight + 5
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
    <span
      class="tooltip"
      style:left={left.toString() + 'px'}
      style:top={top.toString() + 'px'}
    >
      {description}
    </span>
  {/if}
{:else}
  <span><slot /></span>
{/if}

<style lang="scss">
  .tooltip {
    position: absolute;
    max-width: 150px;
    max-height: 50px;
    font-size: 12px;
    text-align: center;
    background-color: var(--color-secondary-darkest);
    color: var(--color-secondary-lightest);
    border: 2px solid var(--color-tertiary-mid);
    opacity: 0.85;
    z-index: 99;
    padding: 2px;
  }
</style>
