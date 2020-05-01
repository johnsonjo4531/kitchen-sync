import { AsyncQueue } from "./AsyncQueue.ts";
import { AsyncLock } from "./AsyncLock.ts";

// https://en.wikipedia.org/wiki/Barrier_%28computer_science%29

const lock = AsyncLock(undefined);
// barrier for p processors
// Sense-reversal centralized Barrier
// https://web.archive.org/web/20090314035320/http://msdn.microsoft.com/en-us/magazine/cc163427.aspx
export function AsyncBarrier(numberOfProcessesToBarricade: number) {
	let myCount = numberOfProcessesToBarricade;
	const lock = AsyncLock({});
	const evenLock = AsyncQueue<true>();
	const oddLock = AsyncQueue<true>();
	let sense = false; //false == even, true == odd
	return {
		wait: async function () {
			const prevSense = sense;
			if (--myCount === 0) {
				myCount = numberOfProcessesToBarricade;
				sense = !prevSense;
				if (sense) {
					// odd
					evenLock.reset(true);
				} else {
					// even
					oddLock.reset(true);
				}
			} else {
				if (sense) {
					return oddLock.take();
				} else {
					return evenLock.take();
				}
			}
		},
	};
}
