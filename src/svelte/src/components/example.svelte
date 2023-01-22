<!-- <script>
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

<script>
	import { addressType, radix, encoding } from './store.js';
  
	let address = '';
	let content = '';
	let selectedRadix = 'hex';
	let selectedEncoding = 'utf8';
	let selectedAddressType = 'ipv4';
  
	$: address = addressType;
	$: content = radix;
	$: selectedRadix = radix;
	$: selectedEncoding = encoding;
	$: selectedAddressType = addressType;
  </script>
  
  <select bind:value={selectedAddressType}>
	<option value="ipv4">IPv4</option>
	<option value="ipv6">IPv6</option>
  </select>
  <textarea name="address" bind:value={address}></textarea>
  
  <select bind:value={selectedRadix}>
	<option value="hex">Hex</option>
	<option value="dec">Decimal</option>
  </select>
  <textarea name="content" bind:value={content}></textarea>
   -->
