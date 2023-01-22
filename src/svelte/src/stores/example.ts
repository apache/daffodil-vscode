
// import { writable } from 'svelte/store';

// const data = [1,2,3,4,5]
// export function mod(valStore){
// 	let text = ''
// 	data.forEach( index => {
// 		text += (index * valStore) + ' '
// 	})
// 	return text
// }
// function valStore() {
// 	const {subscribe, update, set} = writable(0)
// 	return {
// 		subscribe,
// 		set,
// 		update
// 	}
// }
// export const val = valStore()
// export const displayText = writable('')

// export const addressType = writable('ipv4');
// export const radix = writable('hex');
// export const encoding = writable('utf8');

// addressType.subscribe(val => {
//     document.querySelector('textarea[name="address"]').innerHTML = val;
// });

// radix.subscribe(val => {
//     const uint8Arr = new Uint8Array(8);
//     document.querySelector('textarea[name="content"]').innerHTML = uint8Arr.toString(val);
// });
