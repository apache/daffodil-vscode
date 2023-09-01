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
  import type { AvailableHelpSections } from './Help'

  export let helpSectionId: AvailableHelpSections
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<span
  class="help-icon"
  on:click={(e) => {
    $currentHelpSectionEvent = e
    $currentHelpSectionDisplayed = helpSectionId
  }}
  >?
</span>

<style lang="scss">
  span.help-icon {
    cursor: pointer;
    opacity: 0.5;
    width: 5px;
    border: 1px solid white;
    border-radius: 50px;
    font-size: 11px;
    font-weight: bold;
    margin: 0 5px 0 5px;
    padding: 0 5px 0 5px;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  span.help-icon:hover {
    opacity: 1;
  }
</style>
