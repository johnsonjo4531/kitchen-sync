import { AsyncQueue } from "./AsyncQueue.ts";
import { sleep } from "./utils.ts";

const global: { require?: unknown } = globalThis as any;
// Importing worker_thread module 
const { MessageChannel }
	= 'require' in global && typeof global.require === 'function' ? global.require('worker_threads') : { MessageChannel };

/** Pretty much a Go Channel can send and receive data like the AsyncQueue but throws errors on race-conditions Go style. */
export function Channel<T>(buffer = 0) {
	const queue = AsyncQueue<T>();
	const ch = {
		async send(value: T) {
			const put = queue.put(value);
			if (!(await ch.__isDeadlocked__())) {
				return put;
			} else {
				ch.__throwDeadlockError__();
			}
		},
		async receive() {
			const take = queue.take();
			if (!(await ch.__isDeadlocked__())) {
				return take;
			} else {
				ch.__throwDeadlockError__();
			}
		},
		/** Whether the coroutines using the channel are deadlocked */
		async __isDeadlocked__() {
			// await sleep(0); 
			return (
				// we can only dead lock if we are awaiting some items.
				queue._taken !== 0 &&
				(
					// we can be deadlocked if there are as many takers as there are coroutines.
					ch.__coroutines__ <= queue._taken ||
					// we can be deadlocked if there are as more senders as there are coroutines and buffers
					ch.__coroutines__ + buffer <= -queue._taken
				)
			);
		},
		__throwDeadlockError__() {
			throw new Error("all coroutines are asleep - deadlocked!")
		},
		/** The number of coroutines using the current channel */
		__coroutines__: 0,
		__type__: "channel" as "channel"
	};
	return ch;
}
