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

<script lang='ts'>
  import Tooltip from "../layouts/Tooltip.svelte"
  import { bytesPerRow, dataDislayLineAmount, visableViewports } from "../../stores"
  import { BYTES_PER_ROW_MAX_LINE_NUM, type BytesPerRow } from "../../stores/configuration"

    export let dimension: number = 20
    const defaultDimension = 20
    const minDimension = 15
    const maxDimension = 30

    let width  = valid_dimensions()
    let height = valid_dimensions()
    let minWidth = pixel_string(minDimension)
    let minHeight = pixel_string(minDimension)
    let maxWidth = pixel_string(maxDimension)
    let maxHeight = pixel_string(maxDimension)

    let selectionsDisplay = {
        viewports: false,
        bytesPerRow: false
    }

    function valid_dimensions(): string {
        return (dimension > maxDimension || dimension < minDimension) 
            ? pixel_string(defaultDimension)
            : pixel_string(dimension)
    }
    function pixel_string(value: number): string {
        return value.toString() + 'px'
    }
    function set_bytes_per_row(bytesPerRowSelection: BytesPerRow) {
        if($dataDislayLineAmount > BYTES_PER_ROW_MAX_LINE_NUM[bytesPerRowSelection])
            $dataDislayLineAmount = BYTES_PER_ROW_MAX_LINE_NUM[bytesPerRowSelection]
        
        $bytesPerRow = bytesPerRowSelection
    }
</script>

<span class="icon-container">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <Tooltip alwaysEnabled={true} description="Viewports visible: {$visableViewports}">
        <span class="setting-icon" 
            style:width 
            style:height
            style:min-width={ minWidth }
            style:min-height={ minHeight }
            style:max-width={ maxWidth }
            style:max-height={ maxHeight }
            on:click={() => { selectionsDisplay.viewports = selectionsDisplay.viewports ? false : true }}
        >
            <span
                style:background-color={ $visableViewports === 'all' || $visableViewports === 'physical' ? 'white' : ''}
                class="viewport physical" 
            />
            <span
                style:background-color={ $visableViewports === 'all' || $visableViewports === 'logical' ? 'white' : ''} 
                class="viewport logical" 
            />
        </span>
    </Tooltip>
    {#if selectionsDisplay.viewports}
    <span 
        class='material-symbols-outlined'
        style:width=15px
        style:font-size=20px
    >chevron_right
    </span>
    <span class="selections-container">
        <Tooltip alwaysEnabled={true} description="physical">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span 
                class="setting-icon selection physical"
                on:click={ () => { $visableViewports = 'physical' }}    
            >
                <span class="viewport" style:background-color={'white'}></span>
                <span class="viewport"></span>
            </span>            
        </Tooltip>

        <Tooltip alwaysEnabled={true} description="logical">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span 
            class="setting-icon selection logical"
            on:click={ () => { $visableViewports = 'logical' }}   
        >
            <span class="viewport"></span>
            <span class="viewport" style:background-color={'white'}></span>
        </span>
        </Tooltip>
        <Tooltip alwaysEnabled={true} description="all">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span 
            class="setting-icon selection all"
            on:click={ () => { $visableViewports = 'all' }}   
        >
            <span class="viewport" style:background-color={'white'}></span>
            <span class="viewport" style:background-color={'white'}></span>
        </span>
        </Tooltip>
    </span>
    {/if}
</span>

<!-- BPR Setting Icon -->
<span class="icon-container">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <Tooltip alwaysEnabled={true} description="Bytes per row: {$bytesPerRow}">
        <span class="setting-icon" 
            style:width 
            style:height
            style:min-width={ minWidth }
            style:min-height={ minHeight }
            style:max-width={ maxWidth }
            style:max-height={ maxHeight }
            on:click={() => { selectionsDisplay.bytesPerRow = selectionsDisplay.bytesPerRow ? false : true }}
        >
            <span 
                class="material-symbols-outlined"
                style:display=flex
                style:align-content=center
                style:justify-content=center
                style:font-size=20px    
            >power_input</span>
        </span>
    </Tooltip>
    {#if selectionsDisplay.bytesPerRow}
    <span 
        class='material-symbols-outlined'
        style:width=15px
        style:font-size=20px
    >chevron_right
    </span>
    <span class="selections-container">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span 
            class="setting-icon selection "
            on:click={ () => { set_bytes_per_row(8) }}    
        >8
        </span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span 
            class="setting-icon selection "
            on:click={ () => { set_bytes_per_row(16) }}   
        >16
        </span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span 
            class="setting-icon selection "
            on:click={ () => { set_bytes_per_row(24) }}   
        >24
        </span>
    </span>
    {/if}
</span>

<style lang="scss">
    .icon-container {
        margin: 2px 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
    }
    .setting-icon {
        display: flex;
        flex-direction: row;
        justify-content: center;
        overflow: hidden;
        border: 1px solid white;
        border-radius: 4px;
        padding: 2px;
    }
    .selection {
        width: 15px;
        height: 15px;
        cursor: pointer;
    }
    .viewport {
        border: 1px solid white;
        border-radius: 2px;
        margin: 1px;
        width: 50%;
    }
    .selections-container{
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        min-width: 85px;
    }
    .icon {
        display: flex;
        height: 100%;
        font-size: x-large;
        align-items: center;
        justify-content: center;
    }
</style>
