import Deferred from "./Deferred.ts";

type QueueType<T> = {
	head: T;
	tail: Promise<QueueType<T>>;
};

export function AsyncQueue<T>() {
	let ends = Deferred<QueueType<T>>();
	let taken = 0;
	return {
		/** The number of takers waiting if this number is negative then there are items that have been put that are waiting to be taken. */
		get _taken () {
			return taken;
		},
		/** Put a value to be taken later. You can await to wait for someone to take the value */
		put(value: T) {
			--taken;
			const next = Deferred<QueueType<T>>();
			ends.resolve({
				head: value,
				tail: next.promise,
			});
			ends.resolve = next.resolve;
			return next.promise;
		},
		/** Take a value that has or will be put in the future. */
		async take() {
			++taken;
			const result = ends.promise.then(({ head }) => head);
			ends.promise = ends.promise.then(({ tail }) => tail);
			return result;
		},
		/** Reset */
		reset(value: T) {
			while (taken > 0) {
				this.put(value);
			}
			ends = Deferred<QueueType<T>>();
		},
	};
}
