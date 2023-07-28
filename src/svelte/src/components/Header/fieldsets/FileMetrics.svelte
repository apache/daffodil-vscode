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
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { fileMetrics } from './FileMetrics'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import { saveable } from '../../../stores'
  import { createEventDispatcher } from 'svelte'
  import SidePanel from '../../layouts/SidePanel.svelte'
  import ByteFrequencyGraph from '../../DataMetrics/ByteFrequencyGraph.svelte'
  import { viewport } from '../../DataDisplays/CustomByteDisplay/BinaryData'
  import { humanReadableByteLength } from '../../../utilities/display'
  import { DATA_PROFILE_MAX_LENGTH } from '../../../stores/configuration'
  import Tooltip from '../../layouts/Tooltip.svelte'
  const eventDispatcher = createEventDispatcher()

  let displayOpts = false
  let isProfilerOpen = false
  let canUndo: boolean
  let canRedo: boolean
  let canRevert: boolean
  let startOffset: number = 0
  let length: number = 0

  function saveAs() {
    vscode.postMessage({
      command: MessageCommand.saveAs,
    })
    displayOpts = false
  }

  function save() {
    vscode.postMessage({
      command: MessageCommand.save,
    })
    displayOpts = false
  }

  function toggleSaveDisplay() {
    displayOpts = !displayOpts
    if (displayOpts) {
      // set displayOpts to false after 10 seconds
      setTimeout(() => {
        displayOpts = false
      }, 10000)
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.fileInfo:
        {
          if ('fileName' in msg.data.data) {
            $fileMetrics.name = msg.data.data.fileName
          }
          if ('type' in msg.data.data) {
            $fileMetrics.type = msg.data.data.type
          }
          if ('diskFileSize' in msg.data.data) {
            $fileMetrics.diskSize = msg.data.data.diskFileSize
          }
          if ('computedFileSize' in msg.data.data) {
            $fileMetrics.computedSize = msg.data.data.computedFileSize
          }
          if ('changeCount' in msg.data.data) {
            $fileMetrics.changeCount = msg.data.data.changeCount
          }
          if ('undoCount' in msg.data.data) {
            $fileMetrics.undoCount = msg.data.data.undoCount
          }
        }
        break
      default:
        break // do nothing
    }
  })

  $: {
    canUndo = $fileMetrics.changeCount > 0
    canRedo = $fileMetrics.undoCount > 0
    canRevert = $fileMetrics.undoCount + $fileMetrics.changeCount > 0
    length = length <= 0 ? viewport.offsetMax - startOffset : length
  }

  function redo() {
    eventDispatcher('redo')
  }

  function undo() {
    eventDispatcher('undo')
  }

  function clearChangeStack() {
    eventDispatcher('clearChangeStack')
  }

  function toggleDataProfiler() {
    isProfilerOpen = !isProfilerOpen
  }
</script>

<SidePanel
  position="top-left"
  title="Data Profiler"
  panelWidth="270px"
  bind:open={isProfilerOpen}
>
  {#if isProfilerOpen}
    <ByteFrequencyGraph
      title="Byte Frequency Profile"
      {startOffset}
      length={Math.min(length, DATA_PROFILE_MAX_LENGTH)}
    />
  {/if}
</SidePanel>

<fieldset class="file-metrics">
  <legend>File Metrics</legend>
  <FlexContainer --dir="row">
    <span id="file_name" class="nowrap">{$fileMetrics.name}</span>&nbsp;
  </FlexContainer>
  <FlexContainer --dir="row" --align-items="center">
    {#if displayOpts}
      <Button fn={save} disabledBy={!$saveable} description="Save to disk">
        <span slot="left" class="btn-icon material-symbols-outlined">save</span>
        <span slot="default">&nbsp;Save</span>
      </Button>
      <Button fn={saveAs} description="Save as">
        <span slot="left" class="btn-icon material-symbols-outlined"
          >save_as</span
        >
        <span slot="default">&nbsp;Save As</span>
      </Button>
    {:else}
      <Button fn={toggleSaveDisplay} description="Save">
        <span slot="left" class="btn-icon material-symbols-outlined">save</span>
        <span slot="default">Save&hellip;</span>
      </Button>
    {/if}
  </FlexContainer>
  <hr />
  <FlexContainer --dir="row">
    <FlexContainer --dir="column">
      <label for="disk_file_size">Disk Size</label>
      <Tooltip
        description="{$fileMetrics.diskSize.toLocaleString('en')} bytes"
        alwaysEnabled={true}
      >
        <span id="disk_file_size" class="nowrap"
          >{humanReadableByteLength($fileMetrics.diskSize)}</span
        >
      </Tooltip>
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="computed_file_size">Computed Size</label>
      <Tooltip
        description="{$fileMetrics.computedSize.toLocaleString('en')} bytes"
        alwaysEnabled={true}
      >
        <span id="computed_file_size" class="nowrap"
          >{humanReadableByteLength($fileMetrics.computedSize)}</span
        >
      </Tooltip>
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="content_type">Content Type</label>
      <span id="content_type" class="nowrap">{$fileMetrics.type}</span>
    </FlexContainer>
  </FlexContainer>
  <hr />
  <FlexContainer>
    <FlexContainer --dir="column" --align-items="center">
      <FlexContainer --dir="row">
        <Button disabledBy={!canRedo} fn={redo} description="Redo commit">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">redo</span>
            <div class="icon-badge">{$fileMetrics.undoCount}</div>
          </span>
          <span slot="default">&nbsp;Redo</span>
        </Button>
        <Button disabledBy={!canUndo} fn={undo} description="Undo commit">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">undo</span>
            <div class="icon-badge">{$fileMetrics.changeCount}</div>
          </span>
          <span slot="default">&nbsp;Undo</span>
        </Button>
        <Button
          disabledBy={!canRevert}
          fn={clearChangeStack}
          description="Revert all commits"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >restart_alt</span
          >
          <span slot="default">&nbsp;Revert All</span>
        </Button>
      </FlexContainer>
    </FlexContainer>
    <FlexContainer --dir="column" --align-items="end">
      <Button fn={toggleDataProfiler} description="Open data profiler">
        <span slot="left" class="btn-icon material-symbols-outlined"
          >functions</span
        >
        <span slot="default">Profile</span>
      </Button>
    </FlexContainer>
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
    min-width: 180pt;
  }
  fieldset label {
    font-weight: bold;
  }
  span.nowrap {
    white-space: nowrap;
    overflow-x: auto;
    display: inline-block;
  }
</style>
