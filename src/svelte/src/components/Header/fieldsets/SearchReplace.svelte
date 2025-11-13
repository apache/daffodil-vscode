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
    addressRadix,
    allowCaseInsensitiveSearch,
    editorActionsAllowed,
    editorEncoding,
    seekable,
    seekOffsetInput,
    replaceable,
    replaceErr,
    replaceQuery,
    searchable,
    searchErr,
    searchQuery,
    seekErr,
    seekOffsetSearchType,
    seekOffset,
  } from '../../../stores'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'

  import Error from '../../Error/Error.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { createEventDispatcher } from 'svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import ToggleableButton from '../../Inputs/Buttons/ToggleableButton.svelte'
  import { EditActionRestrictions } from '../../../stores/configuration'
  import { OffsetSearchType, clear_queryable_results } from './SearchReplace'
  import Tooltip from '../../layouts/Tooltip.svelte'

  const eventDispatcher = createEventDispatcher()

  type SearchDirection = 'Home' | 'End' | 'Forward' | 'Backward'

  let searchErrDisplay: boolean
  let replaceErrDisplay: boolean
  let caseInsensitive: boolean = false
  let containerClass: string
  let inlineClass: string
  let inputClass: string
  let replaceStarted: boolean = false
  let searchStarted: boolean = false
  let showSearchOptions: boolean = false
  let showReplaceOptions: boolean = false
  let matchOffset: number = -1
  let hasNext: boolean = false
  let hasPrev: boolean = false
  let direction: SearchDirection = 'Home'
  let preReplaceHasPrev: boolean = false
  let justReplaced: boolean = false
  let searchReplaceButtonWidth = '85pt'
  let searchNavButtonWidth = '55pt'
  $: {
    containerClass = CSSThemeClass('input-actions')
    inlineClass = CSSThemeClass('inline-container')
    inputClass = CSSThemeClass('actionable')
  }
  $: clearOnEncodingChange($editorEncoding)
  $: searchErrDisplay = $searchErr.length > 0 && !$searchable
  $: replaceErrDisplay = $replaceErr.length > 0 && !$replaceable
  $: $seekErr = $seekable.seekErrMsg

  function clearOnEncodingChange(encoding: string) {
    cancel()
  }

  function search(
    searchOffset: number,
    searchLength: number,
    isReverse: boolean
  ) {
    $searchQuery.processing = true
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: caseInsensitive,
        isReverse: isReverse,
        encoding: $editorEncoding,
        searchOffset: searchOffset,
        searchLength: searchLength,
        limit: 1,
      },
    })
  }

  function searchFirst() {
    // start search from the beginning of the file
    direction = 'Home'
    search(0, 0, false)
  }

  function searchLast() {
    // start search from the end of the file
    direction = 'End'
    search(0, 0, true)
  }

  function searchNext() {
    // start search from the current match offset + 1
    direction = 'Forward'
    search(matchOffset + 1, 0, false)
  }

  function searchPrev() {
    // start search from the match offset to the beginning of the file
    direction = 'Backward'
    search(0, matchOffset, true)
  }

  function searchStart() {
    if (searchable) {
      matchOffset = -1
      replaceStarted = false
      searchStarted = true
      searchQuery.clear()
      searchFirst()
    }
  }

  function replaceStart() {
    if (replaceable && !replaceErr) {
      matchOffset = -1
      replaceStarted = true
      searchStarted = false
      searchFirst()
    }
  }

  function replace() {
    $replaceQuery.processing = true
    vscode.postMessage({
      command: MessageCommand.replace,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: caseInsensitive,
        isReverse: false,
        replaceData: $replaceQuery.input,
        encoding: $editorEncoding,
        overwriteOnly:
          $editorActionsAllowed === EditActionRestrictions.OverwriteOnly,
        searchOffset: matchOffset,
        searchLength: 0,
        limit: 1,
      },
    })
    eventDispatcher('clearDataDisplays')
  }

  function handleInputEnter(event: CustomEvent) {
    switch (event.detail.id) {
      case 'search':
        searchStart()
        break
      case 'replace':
        replaceStart()
        break
      case 'seek':
        eventDispatcher('seek')
        break
    }
  }

  function CSSThemeClass(selectors?: string) {
    return selectors + ' ' + $UIThemeCSSClass
  }

  function scrollToMatch() {
    if (matchOffset >= 0) {
      $seekOffsetInput = matchOffset.toString($addressRadix)
      eventDispatcher('seek')
    }
  }

  function cancel() {
    showSearchOptions = false
    showReplaceOptions = false
    searchStarted = false
    replaceStarted = false
    matchOffset = -1
    clear_queryable_results()

    eventDispatcher('clearDataDisplays')
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      // handle search results
      case MessageCommand.searchResults:
        if (msg.data.data.searchResults.length > 0) {
          searchQuery.updateSearchResults(msg.data.data)
          switch (direction) {
            case 'Home':
              hasNext = $searchQuery.overflow
              hasPrev = false
              break
            case 'End':
              hasNext = false
              hasPrev = $searchQuery.overflow
              break
            case 'Forward':
              hasNext = $searchQuery.overflow
              hasPrev = justReplaced ? preReplaceHasPrev : true
              justReplaced = false
              break
            case 'Backward':
              hasNext = true
              hasPrev = $searchQuery.overflow
              break
          }
          matchOffset = $searchQuery.searchResults[0]
          scrollToMatch()
          if (searchStarted) {
            showReplaceOptions = false
            showSearchOptions = true
          } else if (replaceStarted) {
            showReplaceOptions = true
            showSearchOptions = false
          }
        } else {
          matchOffset = -1
          $searchQuery.overflow = showSearchOptions = showReplaceOptions = false
          searchQuery.clear()
        }
        searchStarted = replaceStarted = false
        $searchQuery.processing = false
        break

      // handle replace results
      case MessageCommand.replaceResults:
        searchStarted = replaceStarted = false
        if (msg.data.data.replacementsCount > 0) {
          // subtract 1 from the next offset because search next will add 1
          matchOffset = msg.data.data.nextOffset - 1
          replaceQuery.addResult({
            byteLength: msg.data.data.replaceDataBytesLength,
            offset:
              msg.data.data.nextOffset - msg.data.data.replaceDataBytesLength,
          })
          preReplaceHasPrev = hasPrev
          justReplaced = true
          searchNext()
        } else {
          matchOffset = -1
          showReplaceOptions = false
        }
        $replaceQuery.processing = false
        break

      case MessageCommand.clearChanges:
        cancel()
        break
    }
  })
</script>

<fieldset class="search-replace">
  <legend>Search</legend>
  <FlexContainer --dir="column" --align-items="center">
    <FlexContainer --dir="row">
      <Input
        id="seek"
        placeholder="Seek To Offset (base {$addressRadix})"
        allowDefaultInput="true"
        bind:value={$seekOffsetInput}
        on:inputEnter={$seekable.valid ? handleInputEnter : () => {}}
      >
        {#if $seekOffsetSearchType === OffsetSearchType.RELATIVE}
          <Tooltip
            alwaysEnabled={true}
            description={'Offset input is relative to current offset: ' +
              $seekOffset.toString($addressRadix)}
          >
            <span class="btn-icon material-symbols-outlined">my_location</span>
          </Tooltip>
        {/if}
      </Input>
      <Error
        err={seekErr}
        display={$seekOffsetInput.length > 0 && !$seekable.valid}
      />
      <Button
        disabledBy={!$seekable.valid}
        fn={() => {
          eventDispatcher('seek')
        }}
        width={searchReplaceButtonWidth}
        description="Seek to offset"
      >
        <span slot="left" class="btn-icon material-symbols-outlined">start</span
        >
        <span slot="default">&nbsp;Seek</span>
      </Button>
    </FlexContainer>
    <FlexContainer --dir="row" --align-items="center">
      {#if $allowCaseInsensitiveSearch}
        <Input
          id="search"
          placeholder="Search"
          bind:value={$searchQuery.input}
          on:inputEnter={handleInputEnter}
        >
          <ToggleableButton
            --width="24px"
            fn={() => {
              caseInsensitive = !caseInsensitive
            }}
            active={caseInsensitive}
            description="Case insensitive search: {caseInsensitive
              ? 'on'
              : 'off'}"
          >
            Aa
          </ToggleableButton>
        </Input>
      {:else}
        <Input
          id="search"
          placeholder="Search"
          bind:value={$searchQuery.input}
          on:inputEnter={handleInputEnter}
        />
      {/if}
      <Error err={searchErr} display={searchErrDisplay} />
      <Button
        disabledBy={!$searchable}
        fn={searchStart}
        width={searchReplaceButtonWidth}
        description="Start search"
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >search</span
        >
        <span slot="default">&nbsp;Search</span></Button
      >
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <Input
        id="replace"
        placeholder="Replace"
        bind:value={$replaceQuery.input}
        allowDefaultInput="true"
        on:inputEnter={handleInputEnter}
      />
      <Error err={replaceErr} display={replaceErrDisplay} />
      <Button
        disabledBy={!$replaceable}
        fn={replaceStart}
        width={searchReplaceButtonWidth}
        description="Start replacement"
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >find_replace</span
        >
        <span slot="default">&nbsp;Replace&hellip;</span>
      </Button>
    </FlexContainer>

    {#if showSearchOptions || showReplaceOptions}
      <FlexContainer --dir="row">
        <Button
          width={searchNavButtonWidth}
          fn={searchFirst}
          disabledBy={!hasPrev || !$searchable}
          description="Seek to the first match"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >first_page</span
          >
          <span slot="default">&nbsp;First</span></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={searchPrev}
          disabledBy={!hasPrev || !$searchable}
          description="Seek to the previous match"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >navigate_before</span
          >
          <span slot="default">&nbsp;Prev</span></Button
        >
        {#if showReplaceOptions}
          <Button
            fn={replace}
            description="Replace the current match"
            disabledBy={!replaceable}
          >
            <span slot="left" class="btn-icon material-symbols-outlined"
              >find_replace</span
            >
            <span slot="default">&nbsp;Replace</span>
          </Button>
        {/if}
        <Button
          width={searchNavButtonWidth}
          fn={searchNext}
          disabledBy={!hasNext || !$searchable}
          description="Seek to the next match"
        >
          <span slot="default">Next&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >navigate_next</span
          ></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={searchLast}
          disabledBy={!hasNext || !$searchable}
          description="Seek to the last match"
        >
          <span slot="default">Last&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >last_page</span
          ></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={cancel}
          description="Cancel {showReplaceOptions ? 'replace' : 'search'}"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >search_off</span
          >
          <span slot="default">&nbsp;Cancel</span>
        </Button>
      </FlexContainer>
    {/if}
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
  }

  button.case-btn {
    margin-right: 5px;
    width: fit-content;
    cursor: pointer;
  }
</style>
