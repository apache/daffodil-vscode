<script>
	import { val, displayText, mod } from '../stores/example';
	$: displayText.set(mod($val))
</script>

<select bind:value={$val}>
	<option value=5>5</option>
	<option value=10>10</option>
</select>
<h3>
	<div>
		Text: {$val}
	</div>
	<div>
		DisplayText:
		<input type='text' contenteditable='true' bind:value={$displayText} readonly>
	</div>
</h3>
