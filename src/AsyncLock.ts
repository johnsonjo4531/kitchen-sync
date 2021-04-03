import { AsyncQueue } from "./AsyncQueue.ts";

/**
 * @param resource
 */
export function AsyncLock<T extends any= any>(resource: T) {
	const mutex = AsyncQueue<T>();
	// provide one user to access the resource
	let count = 1;
	mutex.put(resource);
	const release = async function release() {
		// only allow one lock to be released at a time.
		if (count < 1) {
			count++;
			mutex.put(resource);
		}
	};
	return {
		[Symbol.asyncIterator]: async function*() {
			try {
				count--;
				// wait until resource is unlocked then lock the resource
				yield mutex.take();
			} finally {
				// release the locked resource
				release();
			}
		},
		wait: async function wait(): Promise<T> {
			count--;
			return mutex.take();
		},
		release: Object.assign(release, {
			[Symbol.asyncIterator]: async function*() {
				try {
					yield;
				} finally {
					// release the locked resource
					release();
				}
			},
		}),
	};
}
