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
  import FlexContainer from '../../layouts/FlexContainer.svelte'

  export let toggleBind: boolean
  export let configItem: string

  const toggle = () => {
    toggleBind = toggleBind ? false : true
  }
</script>

<FlexContainer --dir="row" --align-items="center">
  {#if toggleBind}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span on:click={toggle} class="toggle-btn on material-symbols-outlined"
      >toggle_on</span
    >
  {:else}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span on:click={toggle} class="toggle-btn off material-symbols-outlined"
      >toggle_off</span
    >
  {/if}

  <div class="toggle-config-item">
    {configItem}
  </div>
</FlexContainer>

<style lang="scss">
  .toggle-btn {
    width: 35px;
    font-size: 25px;
    cursor: pointer;
  }
  .toggle-btn.on {
    color: var(--color-tertiary-mid);
  }
  .toggle-btn.off {
    color: grey;
  }
</style>
