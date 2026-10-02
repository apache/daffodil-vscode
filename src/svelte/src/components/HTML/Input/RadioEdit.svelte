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
<script>
  let selectedOption = 'replace'

  function handleOptionChange(event) {
    selectedOption = event.target.value
  }
</script>

<div class="options">
  <!-- label with tool tip for insert before -->
  <label for="insert-before" title="insert before"
    >insert before
    <input
      type="radio"
      value="insert-before"
      id="insert-before"
      bind:group={selectedOption}
      on:change={handleOptionChange}
    />
  </label>

  <label for="replace" title="replace"
    >replace
    <input
      type="radio"
      value="replace"
      id="replace"
      bind:group={selectedOption}
      on:change={handleOptionChange}
    />
  </label>

  <label for="insert-after" title="insert after"
    >insert after
    <input
      type="radio"
      value="insert-after"
      id="insert-after"
      bind:group={selectedOption}
      on:change={handleOptionChange}
    />
  </label>
</div>

<style>
  .options {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  label {
    display: flex;
    align-items: center;
    width: fit-content;
    white-space: nowrap;
    overflow-x: auto;
    gap: 4px;
  }

  input[type='radio'] {
    margin-right: 16px;
  }
</style>
