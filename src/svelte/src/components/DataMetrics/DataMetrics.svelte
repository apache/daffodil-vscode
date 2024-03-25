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
  import Button from '../Inputs/Buttons/Button.svelte'
  import { vscode } from '../../utilities/vscode'
  import { MessageCommand } from '../../utilities/message'
  import { onMount } from 'svelte'
  import Input from '../Inputs/Input/Input.svelte'
  import { addressRadix, viewport } from '../../stores'
  import { DATA_PROFILE_MAX_LENGTH } from '../../stores/configuration'
  import { radixToString, regexEditDataTest } from '../../utilities/display'
  import ISO6391 from 'iso-639-1'
  import Tooltip from 'src/components/layouts/Tooltip.svelte'

  const PROFILE_DOS_EOL = 256

  // title for the byte profile graph
  export let title: string

  // start offset for the byte profile graph
  export let startOffset: number

  // number of bytes to profile from the start offset
  export let length: number

  class CharacterCountData {
    byteOrderMark: string = ''
    byteOrderMarkBytes: number = 0
    singleByteCount: number = 0
    doubleByteCount: number = 0
    tripleByteCount: number = 0
    quadByteCount: number = 0
    invalidBytes: number = 0
  }

  let endOffset: number = 0
  let byteProfile: number[] = []
  let language: string = ''
  let contentType: string = ''
  let currentTooltip: { index: number; value: number } | null = null
  let colorScaleData: string[] = []
  let scaledData: number[] = []
  let sum: number = 0
  let minFrequency: number = 0
  let maxFrequency: number = 0
  let mean: number = 0
  let variance: number = 0
  let stdDev: number = 0
  let characterCountData: CharacterCountData = new CharacterCountData()
  let numAscii: number = 0
  let numDistinct: number = 0
  let fieldBeingEdited: string = ''
  let statusMessage: string = ''
  let warningMessage: string = ''
  let errorMessage: string = ''
  let statusMessageTimeout: NodeJS.Timeout | null = null
  let warningMessageTimeout: NodeJS.Timeout | null = null
  let errorMessageTimeout: NodeJS.Timeout | null = null
  let asciiOverlay: boolean = true
  let logScale: boolean = false

  $: {
    sum = byteProfile.reduce((a, b) => a + b, 0)
    mean = sum / byteProfile.length
    minFrequency = Math.min(...byteProfile)
    maxFrequency = Math.max(...byteProfile)

    let squareDiffs = byteProfile.map((value) => Math.pow(value - mean, 2))
    variance = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
    stdDev = Math.sqrt(variance)
    numDistinct = byteProfile.filter((value) => value > 0).length

    colorScaleData = byteProfile.map((value) => {
      if (value < mean - stdDev) return 'low'
      if (value > mean + stdDev) return 'high'
      return 'average'
    })

    scaledData = byteProfile.map((d) => {
      // Note: 300 is the max height of the chart. byteFrequency values are >= 0.
      return logScale
        ? Math.round((Math.log2(d + 1) / Math.log2(maxFrequency + 1)) * 300) // adding 1 to prevent log(0)
        : Math.round((d / maxFrequency) * 300)
    })
  }

  function setStatusMessage(msg: string, timeout: number = 5000) {
    if (statusMessageTimeout) clearTimeout(statusMessageTimeout)
    errorMessage = ''
    statusMessage = msg
    if (timeout > 0) {
      statusMessageTimeout = setTimeout(() => {
        statusMessage = ''
      }, timeout)
    }
  }

  function setWarningMessage(msg: string, timeout: number = 7500) {
    if (warningMessageTimeout) clearTimeout(warningMessageTimeout)
    errorMessage = ''
    warningMessage = msg
    if (timeout > 0) {
      warningMessageTimeout = setTimeout(() => {
        warningMessage = ''
      }, timeout)
    }
  }

  function setErrorMessage(msg: string, timeout: number = 10000) {
    if (errorMessageTimeout) clearTimeout(errorMessageTimeout)
    statusMessage = ''
    warningMessage = ''
    errorMessage = msg
    if (timeout > 0) {
      errorMessageTimeout = setTimeout(() => {
        errorMessage = ''
      }, timeout)
    }
  }

  function handleCsvProfileDownload(): void {
    const csvContent =
      'Byte,Frequency\n' +
      byteProfile.map((val, idx) => `${idx},${val}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'profile-data.csv'
    link.click()
  }

  function saveSegmentAs() {
    vscode.postMessage({
      command: MessageCommand.saveSegment,
      data: {
        offset: startOffset,
        length: length,
      },
    })
  }

  function requestSessionProfile(startOffset: number, length: number) {
    setStatusMessage(
      `Profiling bytes from ${startOffset} to ${startOffset + length}...`,
      0
    )
    vscode.postMessage({
      command: MessageCommand.profile,
      data: {
        startOffset: startOffset,
        length: length,
      },
    })
  }

  function handleInputEnter(e: CustomEvent) {
    switch (e.detail.id) {
      case 'start-offset-input':
        {
          const startOffsetTemp = parseInt(e.detail.value, $addressRadix)
          if (
            isNaN(startOffsetTemp) ||
            !regexEditDataTest(e.detail.value, $addressRadix)
          ) {
            setErrorMessage(
              `End offset must be a ${radixToString($addressRadix)} number`
            )
            return
          } else if (startOffsetTemp < 0) {
            setErrorMessage('Start offset must be greater than or equal to 0')
            return
          } else if (startOffsetTemp >= endOffset) {
            setErrorMessage('Start offset must be less than end offset')
            return
          }
          startOffset = startOffsetTemp
          const lengthTemp = endOffset - startOffset
          if (lengthTemp > DATA_PROFILE_MAX_LENGTH) {
            // affects the length and end offset
            setWarningMessage(`Length adjusted to ${DATA_PROFILE_MAX_LENGTH}`)
            length = DATA_PROFILE_MAX_LENGTH
            endOffset = startOffset + length
          } else {
            length = lengthTemp
          }
        }
        break
      case 'end-offset-input':
        {
          const endOffsetTemp = parseInt(e.detail.value, $addressRadix)
          if (
            isNaN(endOffsetTemp) ||
            !regexEditDataTest(e.detail.value, $addressRadix)
          ) {
            setErrorMessage(
              `End offset must be a ${radixToString($addressRadix)} number`
            )
            return
          } else if (endOffsetTemp <= startOffset) {
            setErrorMessage('End offset must be greater than start offset')
            return
          } else if (endOffsetTemp > viewport.offsetMax) {
            setErrorMessage(
              `End offset must be less than or equal to ${viewport.offsetMax}`
            )
            return
          }
          endOffset = endOffsetTemp
          const lengthTemp = endOffset - startOffset
          if (lengthTemp > DATA_PROFILE_MAX_LENGTH) {
            // affects the length and start offset
            setWarningMessage(`Length adjusted to ${DATA_PROFILE_MAX_LENGTH}`)
            length = DATA_PROFILE_MAX_LENGTH
            startOffset = endOffset - length
          } else {
            length = lengthTemp
          }
        }
        break
      case 'length-input':
        {
          const lengthTemp = parseInt(e.detail.value, $addressRadix)
          if (
            isNaN(lengthTemp) ||
            !regexEditDataTest(e.detail.value, $addressRadix)
          ) {
            setErrorMessage(
              `End offset must be a ${radixToString($addressRadix)} number`
            )
            return
          } else if (lengthTemp <= 0) {
            setErrorMessage('Length must be greater than 0')
            return
          } else if (lengthTemp > viewport.offsetMax - startOffset) {
            setErrorMessage(
              `Length must be less than or equal to ${
                viewport.offsetMax - startOffset
              }`
            )
            return
          }
          if (lengthTemp > DATA_PROFILE_MAX_LENGTH) {
            // affects the length
            setWarningMessage(`Length adjusted to ${DATA_PROFILE_MAX_LENGTH}`)
            length = DATA_PROFILE_MAX_LENGTH
          } else {
            length = lengthTemp
          }
          // affects the end offset
          endOffset = startOffset + length
        }
        break
      default:
        break
    }
    fieldBeingEdited = ''
    requestSessionProfile(startOffset, length)
  }
  function handleBlur() {
    fieldBeingEdited = ''
  }

  onMount(() => {
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (msg) => {
      switch (msg.data.command) {
        case MessageCommand.profile:
          numAscii = msg.data.data.numAscii as number
          byteProfile = msg.data.data.byteProfile as number[]
          language = msg.data.data.language as string
          contentType = msg.data.data.contentType as string

          // character count data
          characterCountData.byteOrderMark = msg.data.data.characterCount
            .byteOrderMark as string
          characterCountData.byteOrderMarkBytes = msg.data.data.characterCount
            .byteOrderMarkBytes as number
          characterCountData.singleByteCount = msg.data.data.characterCount
            .singleByteCount as number
          characterCountData.doubleByteCount = msg.data.data.characterCount
            .doubleByteCount as number
          characterCountData.tripleByteCount = msg.data.data.characterCount
            .tripleByteCount as number
          characterCountData.quadByteCount = msg.data.data.characterCount
            .quadByteCount as number
          characterCountData.invalidBytes = msg.data.data.characterCount
            .invalidBytes as number

          setStatusMessage(
            `Profiled bytes from ${startOffset} to ${startOffset + length}`
          )
          break
        default:
          break // do nothing
      }
    })
    endOffset = startOffset + length
    requestSessionProfile(startOffset, length)
  })
</script>

<div class="container">
  {#if title.length > 0}
    <div class="header">
      <h3>{title}</h3>
    </div>
  {/if}
  <div class="chart">
    {#if asciiOverlay}
      <div class="ascii-control-overlay">
        <div class="overlay-title">ctrl</div>
      </div>
      <div class="printable-ascii-overlay">
        <div class="overlay-title">printable</div>
      </div>
      <div class="ascii-control2-overlay" />
    {/if}
    {#each scaledData as value, i (i)}
      <div
        class="bar {colorScaleData[i]}"
        style="height: {value}px;"
        on:mouseenter={() => (currentTooltip = { index: i, value })}
        on:mouseleave={() => (currentTooltip = null)}
      />
    {/each}
    {#if currentTooltip}
      <div class="tooltip" style="bottom: {currentTooltip.value}px;">
        Byte: {currentTooltip.index} Frequency: {byteProfile[
          currentTooltip.index
        ]}
        {#if currentTooltip.index >= 32 && currentTooltip.index <= 126}
          ASCII: '{String.fromCharCode(currentTooltip.index)}'
        {/if}
      </div>
    {/if}
  </div>
  <hr />
  <div>
    <div class="input-container">
      <label for="scale"
        >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scale:
        <span
          id="scale"
          class="editable"
          on:click={() => {
            logScale = !logScale
          }}>{logScale ? 'Logarithmic' : 'Linear'}</span
        >
      </label>
    </div>
    <div class="input-container">
      <label for="ascii-overlay-toggle"
        >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Overlay:
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span
          id="ascii-overlay-toggle"
          class="editable"
          on:click={() => {
            asciiOverlay = !asciiOverlay
          }}>{asciiOverlay ? 'ASCII' : 'None'}</span
        >
      </label>
    </div>
    {#if fieldBeingEdited === 'startOffset'}
      <div class="input-container">
        <label for="start-offset-input" class="label"
          >Start Offset:
          <Input
            id="start-offset-input"
            placeholder="{startOffset.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})"
            value={startOffset.toString($addressRadix)}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => {
          fieldBeingEdited = 'startOffset'
        }}
      >
        <label for="start-offset"
          >Start Offset: <span id="start-offset" class="editable"
            >{startOffset.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})</span
          ></label
        >
      </div>
    {/if}
    {#if fieldBeingEdited === 'endOffset'}
      <div class="input-container">
        <label for="end-offset-input" class="label"
          >&nbsp;&nbsp;End Offset:
          <Input
            id="end-offset-input"
            placeholder="{endOffset.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})"
            value={endOffset.toString($addressRadix)}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => {
          fieldBeingEdited = 'endOffset'
        }}
      >
        <label for="end-offset"
          >&nbsp;&nbsp;End Offset: <span id="end-offset" class="editable"
            >{endOffset.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})</span
          ></label
        >
      </div>
    {/if}
    {#if fieldBeingEdited === 'length'}
      <div class="input-container">
        <label for="length-input" class="label"
          >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Length:
          <Input
            id="length-input"
            placeholder="{length.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})"
            value={length.toString($addressRadix)}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => {
          fieldBeingEdited = 'length'
        }}
      >
        <label for="length"
          >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Length: <span
            id="length"
            class="editable"
            >{length.toString($addressRadix)} ({radixToString(
              $addressRadix
            )})</span
          ></label
        >
      </div>
    {/if}
  </div>
  <hr />
  <div class="stats">
    <label for="computed-size"
      >&nbsp;&nbsp;Max Offset: <span id="computed-size" class="nowrap"
        >{viewport.offsetMax.toString($addressRadix)} ({radixToString(
          $addressRadix
        )})</span
      ></label
    >
    <label for="language"
      >&nbsp;&nbsp;&nbsp;&nbsp;Language:<Tooltip
        description={ISO6391.getName(language)}
        alwaysEnabled={true}
        ><span id="language" class="nowrap">{language}</span></Tooltip
      ></label
    >
    <label for="content-type"
      >Content Type: <span id="content-type" class="nowrap">{contentType}</span
      ></label
    >
    <label for="min-frequency"
      >&nbsp;&nbsp;&nbsp;Min Freq.: <span id="min-frequency" class="nowrap"
        >{minFrequency}</span
      ></label
    >
    <label for="max-frequency"
      >&nbsp;&nbsp;&nbsp;Max Freq.: <span id="max-frequency" class="nowrap"
        >{maxFrequency}</span
      ></label
    >
    <label for="mean-frequency"
      >&nbsp;&nbsp;Mean Freq.: <span id="mean-frequency" class="nowrap"
        >{mean.toFixed(2)}</span
      ></label
    >
    <label for="variance"
      >&nbsp;&nbsp;&nbsp;&nbsp;Variance: <span id="variance" class="nowrap"
        >{variance.toFixed(2)}</span
      ></label
    >
    <label for="stddev"
      >&nbsp;&nbsp;&nbsp;Std. Dev.: <span id="stddev" class="nowrap"
        >{stdDev.toFixed(2)}</span
      ></label
    >
    <label for="byte-count"
      >&nbsp;&nbsp;Byte Count: <span id="byte-count" class="nowrap">{sum}</span
      ></label
    >
    <label for="distinct-count"
      >&nbsp;&nbsp;&nbsp;&nbsp;Distinct: <span
        id="distinct-count"
        class="nowrap">{numDistinct}</span
      ></label
    >
    <label for="dos_eol-count"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DOS EOL: <span
        id="dos_eol-count"
        class="nowrap">{byteProfile[PROFILE_DOS_EOL]}</span
      ></label
    >
    <label for="ascii-count"
      >&nbsp;ASCII Count: <span id="ascii-count" class="nowrap">{numAscii}</span
      ></label
    >
    <label for="ascii-percent"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;% ASCII: <span
        id="ascii-percent"
        class="nowrap">{((numAscii / sum) * 100).toFixed(2)}</span
      >
    </label>
  </div>
  <hr />
  <div class="char-count">
    <label for="char-count-bom"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BOM: <span
        id="char-count-bom"
        class="nowrap">{characterCountData.byteOrderMark}</span
      ></label
    >
    <label for="char-count-bom-bytes"
      >&nbsp;&nbsp;BOM Bytes: <span id="char-count-bom-bytes" class="nowrap"
        >{characterCountData.byteOrderMarkBytes}</span
      ></label
    >
    <label for="char-count-single"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Single: <span
        id="char-count-single"
        class="nowrap">{characterCountData.singleByteCount}</span
      ></label
    >
    <label for="char-count-double"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Double: <span
        id="char-count-double"
        class="nowrap">{characterCountData.doubleByteCount}</span
      ></label
    >
    <label for="char-count-triple"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Triple: <span
        id="char-count-triple"
        class="nowrap">{characterCountData.tripleByteCount}</span
      ></label
    >
    <label for="char-count-quad"
      >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Quad: <span
        id="char-count-quad"
        class="nowrap">{characterCountData.quadByteCount}</span
      ></label
    >
    <label for="char-count-invalid"
      >&nbsp;&nbsp;&nbsp;&nbsp;Invalid: <span
        id="char-count-invalid"
        class="nowrap">{characterCountData.invalidBytes}</span
      ></label
    >
  </div>
  <hr />
  <Button
    fn={handleCsvProfileDownload}
    description="Download profiled data as .csv"
  >
    <span slot="left" class="btn-icon material-symbols-outlined">download</span>
    <span>Profile&nbsp;as&nbsp;CSV</span></Button
  >
  <Button fn={saveSegmentAs} description="Save segment as">
    <span slot="left" class="btn-icon material-symbols-outlined">save_as</span>
    <span slot="default">Save&nbsp;Segment&nbsp;As</span>
  </Button>
  <hr />
  {#if statusMessage.length > 0}
    <div class="message status">&nbsp;{statusMessage}&nbsp;</div>
  {/if}
  {#if warningMessage.length > 0}
    <div class="message warning">&nbsp;{warningMessage}&nbsp;</div>
  {/if}
  {#if errorMessage.length > 0}
    <div class="message error">&nbsp;{errorMessage}&nbsp;</div>
  {/if}
</div>

<style lang="scss">
  div.container {
    position: relative;
    justify-content: center;
    width: 260px;
    height: 308px;
  }

  div.header {
    text-align: center;
  }

  div.chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    padding: 2px;
    box-sizing: border-box;
    border: 1px solid gray;
    position: relative;
    opacity: 0.9;
  }

  div.printable-ascii-overlay {
    position: absolute;
    bottom: 0;
    /* Printable ASCII byte range is from 32 to 126 */
    /* startByte / totalBytes * 100% */
    left: calc(32 / 256 * 100%);
    /* endByte / totalBytes * 100% - startByte / totalBytes * 100% */
    width: calc((126 / 256 * 100%) - (32 / 256 * 100%));
    height: 100%;
    background-color: navy;
    opacity: 0.5;
    z-index: -1;
  }
  div.ascii-control-overlay {
    position: absolute;
    bottom: 0;
    /* ASCII control byte range is from 0 to 31 */
    left: 0;
    width: calc(31 / 256 * 100%);
    height: 100%;
    background-color: midnightblue;
    opacity: 0.5;
    z-index: -1;
  }
  div.ascii-control2-overlay {
    position: absolute;
    bottom: 0;
    left: calc(127 / 251 * 100%);
    width: calc(1 / 256 * 100%);
    height: 100%;
    background-color: midnightblue;
    opacity: 0.5;
    z-index: -1;
  }
  div.overlay-title {
    text-align: center;
    font-size: 0.75em;
    color: skyblue;
    opacity: 0.75;
  }

  div.bar {
    width: 1px;
    background-color: gray;
    opacity: 0.75;
  }

  div.bar:hover {
    opacity: 1;
  }

  div.bar.low {
    background-color: limegreen;
  }

  div.bar.average {
    background-color: yellow;
  }

  div.bar.high {
    background-color: red;
  }

  div.tooltip {
    position: absolute;
    padding: 4px 6px;
    background-color: #afafaf;
    color: black;
    border: 1px solid blue;
    pointer-events: none;
    opacity: 0.95;
    font-size: smaller;
  }

  div.message {
    text-align: center;
    font-size: 0.75em;
  }
  div.status {
    color: green;
  }
  div.warning {
    color: orange;
  }
  div.error {
    color: red;
  }
</style>
