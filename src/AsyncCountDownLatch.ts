import { AsyncQueue } from "./AsyncQueue.ts";

export function AsyncCountDownLatch(numLatches: number) {
	const latches = AsyncQueue<true>();
	if (numLatches < 0) {
		throw new Error(
			"Countdown latch must be initiated with a number greater than 0."
		);
	}
	let lastLatch = Promise.resolve(true);
	for (let i = 0; i < numLatches; i++) {
		lastLatch = latches.take();
	}
	return {
		promise: lastLatch,
		countDown: Object.assign(
			function countDown() {
				latches.put(true);
			},
			/** This is if you want to make sure something countsdown after being executed. */
			{
				[Symbol.asyncIterator]: async function*() {
					try {
						yield true;
					} finally {
						// release the locked resource
						latches.put(true);
					}
				},
			}
		),
	};
}
