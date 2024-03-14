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
  import { MessageCommand } from '../../utilities/message'

  let heartbeat = {
    latency: 0,
    serverCpuLoadAverage: 0,
    serverTimestamp: 0,
    serverUptime: 0,
    serverUsedMemory: 0,
    sessionCount: 0,
    omegaEditPort: 0,
    serverVersion: 'Unknown',
    serverHostname: 'Unknown',
    serverProcessId: 0,
    jvmVersion: 'Unknown',
    jvmVendor: 'Unknown',
    jvmPath: 'Unknown',
    availableProcessors: 0,
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
    return uptimeString + (seconds === 1)
      ? `${seconds} second`
      : `${seconds} seconds`
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.heartbeat:
        heartbeat.latency = msg.data.data.latency
        heartbeat.serverCpuLoadAverage = msg.data.data.serverCpuLoadAverage
        heartbeat.serverTimestamp = msg.data.data.serverTimestamp
        heartbeat.serverUptime = msg.data.data.serverUptime
        heartbeat.serverUsedMemory = msg.data.data.serverUsedMemory
        heartbeat.sessionCount = msg.data.data.sessionCount
        heartbeat.omegaEditPort = msg.data.data.serverInfo.omegaEditPort
        heartbeat.serverVersion = msg.data.data.serverInfo.serverVersion
        heartbeat.serverHostname = msg.data.data.serverInfo.serverHostname
        heartbeat.serverProcessId = msg.data.data.serverInfo.serverProcessId
        heartbeat.jvmVersion = msg.data.data.serverInfo.jvmVersion
        heartbeat.jvmVendor = msg.data.data.serverInfo.jvmVendor
        heartbeat.jvmPath = msg.data.data.serverInfo.jvmPath
        heartbeat.availableProcessors =
          msg.data.data.serverInfo.availableProcessors

        // set the serverTimestamp to 0 after 5 seconds of no heartbeat to indicate that no heartbeat has been received
        clearTimeout(timerId)
        timerId = setTimeout(() => {
          heartbeat.serverTimestamp = 0
        }, 5000)
        break
    }
  })
</script>

<FlexContainer --height="25pt" --align-items="center">
  {#if heartbeat.serverTimestamp !== 0}
    <div class="info">
      &#9889; Powered by Ωedit™ v{heartbeat.serverVersion} on port {heartbeat.omegaEditPort}
    </div>
    <FlexContainer>
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
        {#if heartbeat.serverUsedMemory > 0}
          <b>Memory Usage:</b>
          {heartbeat.serverUsedMemory},
        {/if}
        {#if heartbeat.serverProcessId > 0}
          <b>Process ID:</b>
          {heartbeat.serverProcessId},
        {/if}
        {#if heartbeat.jvmVersion.length > 0}
          <b>JVM Version:</b>
          {heartbeat.jvmVersion}
        {/if}
        {#if heartbeat.jvmVendor.length > 0}
          <b>JVM Vendor:</b>
          {heartbeat.jvmVendor}
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
