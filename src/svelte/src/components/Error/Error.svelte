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
  import Tooltip from '../layouts/Tooltip.svelte'
  import type { ErrorStore } from './Error'

  export let err: ErrorStore
  export let display: boolean
</script>

<div class="display">
  {#if display}
    <Tooltip alwaysEnabled={true} description={$err}>
      {@html err.innerHTML()}
    </Tooltip>
  {/if}
</div>

<style lang="scss">
  div.display {
    font-size: 16pt;
    padding-left: 5pt;
    color: red;
    line-height: 0;
    width: 20pt;
  }
</style>
