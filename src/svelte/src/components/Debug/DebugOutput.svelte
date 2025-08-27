<script lang="ts">
  import { type DebugVariable } from "./Debug.svelte.ts"

  let {
    id,
    valueStr,
    renderVar,
    removeVar
  }= $props()

</script>

<span class="dbg-row">
  <button onclick={removeVar} class="material-symbols-outlined">close</button>
  {@render renderVar({id, valueStr})}
</span>

<style lang="scss">
  span.dbg-row{
    display: flex;

  }
</style>
