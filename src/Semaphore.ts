import { AsyncQueue } from "./AsyncQueue.ts";

/**
 * @param numKeys The number of allowed accesses to the resource at one time.
 */
export function Semaphore<T>(numKeys: number, resource: T) {
	const locks = AsyncQueue<T>();
	// provide n keys to the lock
	for (let i = 0; i < numKeys; ++i) {
		locks.put(resource);
	}
	return {
		[Symbol.asyncIterator]: async function*() {
			try {
				// try and unlock the resource
				yield locks.take();
			} finally {
				// release the resource
				locks.put(resource);
			}
		},
	};
}
