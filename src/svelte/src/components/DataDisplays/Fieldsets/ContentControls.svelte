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
  import { applyErrMsg, applicable, editMode } from '../../../stores'
  import { EditByteModes } from '../../../stores/configuration'
  import { createEventDispatcher } from 'svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import type { EditEvent } from '../CustomByteDisplay/BinaryData'
  const eventDispatcher = createEventDispatcher()

  function applyChanges(event: Event) {
    eventDispatcher('applyChanges', {
      action: 'insert-replace',
    } as EditEvent)
  }
</script>

<fieldset class="box margin-top">
  <legend
    >Content Controls
    {#if !$applicable && $editMode === EditByteModes.Multiple}
      <span class="errMsg">{$applyErrMsg}</span>
    {/if}
  </legend>
  {#if $editMode === EditByteModes.Multiple}
    <FlexContainer>
      <Button
        disabledBy={!$applicable}
        fn={applyChanges}
        description="Apply changes"
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >commit</span
        >
        <span slot="default">&nbsp;Apply</span>
      </Button>
    </FlexContainer>
  {/if}
</fieldset>
