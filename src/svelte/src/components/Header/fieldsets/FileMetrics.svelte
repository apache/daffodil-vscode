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
  import { createEventDispatcher } from 'svelte'
  import SidePanel from '../../layouts/SidePanel.svelte'
  import ByteFrequencyGraph from '../../DataMetrics/DataMetrics.svelte'
  import { humanReadableByteLength } from '../../../utilities/display'
  import { DATA_PROFILE_MAX_LENGTH } from '../../../stores/configuration'
  import Tooltip from '../../layouts/Tooltip.svelte'
  import ISO6391 from 'iso-639-1'
  import {
    canRedo,
    canRevert,
    canUndo,
    fileMetricsState,
    saveable,
  } from './FileMetrics.svelte.ts'
  import { getUIMessegnerCtx } from 'utilities/messageContext.svelte.ts'

  const eventDispatcher = createEventDispatcher()

  const { addListener, postMessage } = getUIMessegnerCtx()
  //   const { postMessage, addListener } = messegeApi!
  let displayOpts = false
  let isProfilerOpen = false
  let startOffset: number = 0
  let length: number = 0

  function saveAs() {
    postMessage('saveAs')
    displayOpts = false
  }

  function save() {
    postMessage('save')
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

  addListener('fileInfo', (msg) => {
    fileMetricsState.name = msg.filename
    fileMetricsState.language = msg.language
    fileMetricsState.type = msg.contentType
  })
  addListener('counts', (msg) => {
    fileMetricsState.changeCount =
      msg.applied >= 0 ? msg.applied : fileMetricsState.changeCount
    fileMetricsState.computedSize =
      msg.computedFileSize >= 0
        ? msg.computedFileSize
        : fileMetricsState.computedSize
    fileMetricsState.undoCount =
      msg.undos >= 0 ? msg.undos : fileMetricsState.undoCount
    if (fileMetricsState.diskSize === 0)
      fileMetricsState.diskSize = fileMetricsState.computedSize
  })
  addListener('saveAs', (resp) => {
    fileMetricsState.name = resp.newFilePath
    fileMetricsState.computedSize = resp.computedFileSize
    fileMetricsState.diskSize = fileMetricsState.computedSize
  })
  addListener('save', (resp) => {
    fileMetricsState.computedSize = resp.computedFileSize
    fileMetricsState.diskSize = fileMetricsState.computedSize
  })

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
  panelWidth="285px"
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
    <span id="file_name" class="nowrap">{fileMetricsState.name}</span>&nbsp;
  </FlexContainer>
  <FlexContainer --dir="row" --align-items="center">
    {#if displayOpts}
      <Button fn={save} isDisabled={!saveable()} description="Save to disk">
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
      <Button
        fn={toggleSaveDisplay}
        isDisabled={!saveable()}
        description="Save"
      >
        <span slot="left" class="btn-icon material-symbols-outlined">save</span>
        <span slot="default">Save&hellip;</span>
      </Button>
    {/if}
  </FlexContainer>
  <hr />
  <FlexContainer --dir="row">
    <FlexContainer --dir="column">
      <Tooltip description="Initial file size" alwaysEnabled={true}>
        <label for="disk_file_size">Disk Size</label>
      </Tooltip>
      <Tooltip
        description="{fileMetricsState.diskSize.toLocaleString('en')} bytes"
        alwaysEnabled={true}
      >
        <span id="disk_file_size" class="nowrap"
          >{humanReadableByteLength(fileMetricsState.diskSize)}</span
        >
      </Tooltip>
    </FlexContainer>
    <FlexContainer --dir="column">
      <Tooltip description="Size as file is being edited" alwaysEnabled={true}>
        <label for="computed_file_size">Computed Size</label>
      </Tooltip>
      <Tooltip
        description="{fileMetricsState.computedSize.toLocaleString('en')} bytes"
        alwaysEnabled={true}
      >
        <span id="computed_file_size" class="nowrap"
          >{humanReadableByteLength(fileMetricsState.computedSize)}</span
        >
      </Tooltip>
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="content_type">Content Type</label>
      <Tooltip description={fileMetricsState.type} alwaysEnabled={true}>
        <span id="content_type" class="nowrap"
          >{fileMetricsState.type.split('/').pop()}</span
        >
      </Tooltip>
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="language">Language</label>
      <Tooltip
        description={ISO6391.getName(fileMetricsState.language)}
        alwaysEnabled={true}
      >
        <span id="language" class="nowrap">{fileMetricsState.language}</span>
      </Tooltip>
    </FlexContainer>
  </FlexContainer>
  <hr />
  <FlexContainer>
    <FlexContainer --dir="column" --align-items="center">
      <FlexContainer --dir="row">
        <Button isDisabled={!canRedo()} fn={redo} description="Redo change">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">redo</span>
            <div class="icon-badge">{fileMetricsState.undoCount}</div>
          </span>
          <span slot="default">&nbsp;Redo</span>
        </Button>
        <Button isDisabled={!canUndo()} fn={undo} description="Undo change">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">undo</span>
            <div class="icon-badge">{fileMetricsState.changeCount}</div>
          </span>
          <span slot="default">&nbsp;Undo</span>
        </Button>
        <Button
          isDisabled={!canRevert()}
          fn={clearChangeStack}
          description="Revert all changes"
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
