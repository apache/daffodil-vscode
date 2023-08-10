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
<script lang="ts" xmlns="http://www.w3.org/1999/html">
  import {
    RADIX_OPTIONS,
    ENCODING_GROUPS,
    EDIT_ACTIONS,
  } from '../../../stores/configuration'
  import {
    displayRadix,
    editorEncoding,
    editorActionsAllowed,
  } from '../../../stores'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
</script>

<fieldset>
  <legend>Settings</legend>
  <FlexContainer --dir="column">
    <FlexContainer --dir="row" --align-items="center">
      <label for="radix">Display Radix:</label>
      <select id="radix" class={$UIThemeCSSClass} bind:value={$displayRadix}>
        <option value={RADIX_OPTIONS.Hexadecimal}>Hexadecimal</option>
        <option value={RADIX_OPTIONS.Decimal}>Decimal</option>
        <option value={RADIX_OPTIONS.Octal}>Octal</option>
        <option value={RADIX_OPTIONS.Binary}>Binary</option>
      </select>
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <label for="encoding">Edit Encoding:</label>
      <select
        id="encoding"
        class={$UIThemeCSSClass}
        bind:value={$editorEncoding}
      >
        {#each ENCODING_GROUPS as { group, encodings }}
          <optgroup label={group}>
            {#each encodings as { name, value }}
              <option {value}>{name}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <label for="encoding">Editing:</label>
      <select
        id="allowed-editing-actions"
        class={$UIThemeCSSClass}
        bind:value={$editorActionsAllowed}
      >
        {#each EDIT_ACTIONS as { name, value }}
          <option {value}>{name}</option>
        {/each}
      </select>
    </FlexContainer>

    <hr />
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset label {
    width: 50%;
  }
  fieldset select {
    width: 50%;
  }
  fieldset hr {
    width: 100%;
    margin: 5pt 0 5pt 0;
  }
</style>
