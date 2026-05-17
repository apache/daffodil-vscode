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
  import FlexContainer from '../layouts/FlexContainer.svelte'

  import { getUIMessegnerCtx } from 'utilities/messageContext.svelte'

  const { addListener } = getUIMessegnerCtx()
  let heartbeat = {
    latency: 0,
    serverCpuLoadAverage: 0,
    serverTimestamp: 0,
    serverUptime: 0,
    serverResidentMemoryBytes: 0,
    serverVirtualMemoryBytes: 0,
    serverPeakResidentMemoryBytes: 0,
    sessionCount: 0,
    omegaEditPort: 0,
    serverVersion: 'Unknown',
    serverHostname: 'Unknown',
    serverProcessId: 0,
    runtimeKind: 'Unknown',
    runtimeName: 'Unknown',
    platform: 'Unknown',
    availableProcessors: 0,
    compiler: 'Unknown',
    buildType: 'Unknown',
    cppStandard: 'Unknown',
  }
  let timerId: NodeJS.Timeout

  function showHeartbeatInfo(show: boolean) {
    const element = document.getElementsByClassName(
      'heartbeat-info'
    )[0] as HTMLElement

    element.style.opacity = show ? '.7' : '0'
  }

  function prettyPrintUptime(uptimeInMilliseconds: number): string {
    const uptimeSeconds = Math.floor(uptimeInMilliseconds / 1000)
    const days = Math.floor(uptimeSeconds / (60 * 60 * 24))
    const hours = Math.floor((uptimeSeconds % (60 * 60 * 24)) / (60 * 60))
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60)
    const seconds = Math.floor(uptimeSeconds % 60)

    let uptimeString = ''
    if (days > 0) {
      uptimeString += days === 1 ? `${days} day, ` : `${days} days, `
    }
    if (hours > 0) {
      uptimeString += hours === 1 ? `${hours} hour, ` : `${hours} hours, `
    }
    if (minutes > 0) {
      uptimeString +=
        minutes === 1 ? `${minutes} minute, ` : `${minutes} minutes, `
    }
    return (
      uptimeString +
      (seconds === 1 ? `${seconds} second` : `${seconds} seconds`)
    )
  }

  addListener('heartbeat', (data) => {
    // switch (command) {
    //   case MessageCommand.heartbeat:
        heartbeat.latency = data.latency
        heartbeat.serverCpuLoadAverage = data.serverCpuLoadAverage
        heartbeat.serverTimestamp = data.serverTimestamp
        heartbeat.serverUptime = data.serverUptime
        heartbeat.serverResidentMemoryBytes =
          data.serverResidentMemoryBytes ?? 0
        heartbeat.serverVirtualMemoryBytes =
          data.serverVirtualMemoryBytes ?? 0
        heartbeat.serverPeakResidentMemoryBytes =
          data.serverPeakResidentMemoryBytes ?? 0
        heartbeat.sessionCount = data.sessionCount
        heartbeat.omegaEditPort = data.serverInfo.omegaEditPort
        heartbeat.serverVersion = data.serverInfo.serverVersion
        heartbeat.serverHostname = data.serverInfo.serverHostname
        heartbeat.serverProcessId = data.serverInfo.serverProcessId
        heartbeat.runtimeKind = data.serverInfo.runtimeKind
        heartbeat.runtimeName = data.serverInfo.runtimeName
        heartbeat.platform = data.serverInfo.platform
        heartbeat.availableProcessors =
          data.serverInfo.availableProcessors
        heartbeat.compiler = data.serverInfo.compiler
        heartbeat.buildType = data.serverInfo.buildType
        heartbeat.cppStandard = data.serverInfo.cppStandard

        // set the serverTimestamp to 0 after 5 seconds of no heartbeat to indicate that no heartbeat has been received
        clearTimeout(timerId)
        timerId = setTimeout(() => {
          heartbeat.serverTimestamp = 0
        }, 5000)
    })
  // addListener('heartbeat', (data) => {
  //   const {
  //     latency,
  //     port,
  //     serverCpuLoadAverage,
  //     serverTimestamp,
  //     serverUptime,
  //     serverUsedMemory,
  //     sessionCount,
  //     serverInfo,
  //   } = data
  //   heartbeat.latency = latency
  //   heartbeat.omegaEditPort = port
  //   heartbeat.serverCpuLoadAverage = serverCpuLoadAverage
  //   heartbeat.serverTimestamp = serverTimestamp
  //   heartbeat.serverUptime = serverUptime
  //   heartbeat.serverUsedMemory = serverUsedMemory
  //   heartbeat.sessionCount = sessionCount
  //   heartbeat.availableProcessors = serverInfo.availableProcessors
  //   heartbeat.serverHostname = serverInfo.serverHostname
  //   heartbeat.serverProcessId = serverInfo.serverProcessId
  //   heartbeat.serverVersion = serverInfo.serverVersion
  //   heartbeat.jvmVersion = serverInfo.jvmVersion
  //   heartbeat.jvmVendor = serverInfo.jvmVendor
  //   heartbeat.jvmPath = serverInfo.jvmPath
  //   clearTimeout(timerId)
  //   timerId = setTimeout(() => {
  //     heartbeat.serverTimestamp = 0
  //   }, 5000)
  // })
</script>

<FlexContainer --height="25pt" --align-items="center">
  {#if heartbeat.serverTimestamp !== 0}
    <div class="info">
      &#9889; Powered by Ωedit™ v{heartbeat.serverVersion} on port {heartbeat.omegaEditPort}
      &nbsp;
    </div>
    <FlexContainer>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <svg
        class="latency-indicator"
        on:mouseenter={() => showHeartbeatInfo(true)}
        on:mouseleave={() => showHeartbeatInfo(false)}
      >
        {#if 0 < heartbeat.latency && heartbeat.latency < 20}
          <circle cx="50%" cy="50%" r="4pt" fill="green" />
        {:else if 0 < heartbeat.latency && heartbeat.latency < 40}
          <circle cx="50%" cy="50%" r="4pt" fill="yellow" />
        {:else if 0 < heartbeat.latency && heartbeat.latency > 60}
          <circle cx="50%" cy="50%" r="4pt" fill="red" />
        {:else}
          <circle cx="50%" cy="50%" r="4pt" fill="grey" />
        {/if}
      </svg>
      <div class="heartbeat-info">
        {#if heartbeat.latency > 0}
          <b>Latency:</b>
          {heartbeat.latency}ms,
        {/if}
        {#if heartbeat.serverUptime > 0}
          <b>Uptime:</b>
          {prettyPrintUptime(heartbeat.serverUptime)}
        {/if}
        {#if heartbeat.sessionCount > 0}
          <b>Session Count:</b>
          {heartbeat.sessionCount},
        {/if}
        {#if heartbeat.serverCpuLoadAverage > 0}
          <b>CPU Load Avg:</b>
          {heartbeat.serverCpuLoadAverage.toFixed(2)},
        {/if}
        {#if heartbeat.serverResidentMemoryBytes > 0}
          <b>Resident Memory:</b>
          {heartbeat.serverResidentMemoryBytes},
        {/if}
        {#if heartbeat.serverProcessId > 0}
          <b>Process ID:</b>
          {heartbeat.serverProcessId},
        {/if}
        {#if heartbeat.runtimeName.length > 0}
          <b>Runtime:</b>
          {heartbeat.runtimeName}
        {/if}
        {#if heartbeat.platform.length > 0}
          <b>Platform:</b>
          {heartbeat.platform}
        {/if}
      </div>
    </FlexContainer>
  {:else}
    <div class="info">&#9889; Powered by Ωedit™ (heartbeat not received)</div>
  {/if}
</FlexContainer>

<style lang="scss">
  div.info {
    min-width: fit-content;
    opacity: 0.7;
    font-style: italic;
  }
  div.heartbeat-info {
    opacity: 0;
    transition: opacity 1s ease-in-out;
  }
  svg.latency-indicator {
    height: 100%;
    width: 15pt;
  }
</style>
