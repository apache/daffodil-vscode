
import { writable } from 'svelte/store';

const data = [1,2,3,4,5]
export function mod(valStore){
	let text = ''
	data.forEach( index => {
		text += (index * valStore) + ' '
	})
	return text
}
function valStore() {
	const {subscribe, update, set} = writable(0)
	return {
		subscribe,
		set,
		update
	}
}
export const val = valStore()
export const displayText = writable('')
