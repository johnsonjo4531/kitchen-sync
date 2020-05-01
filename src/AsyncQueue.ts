import Deferred from "./Deferred.ts";

type QueueType<T> = {
	head: T;
	tail: Promise<QueueType<T>>;
};

export function AsyncQueue<T>() {
	let ends = Deferred<QueueType<T>>();
	let taken = 0;
	return {
		put(value: T) {
			--taken;
			const next = Deferred<QueueType<T>>();
			ends.resolve({
				head: value,
				tail: next.promise,
			});
			ends.resolve = next.resolve;
		},
		async take() {
			++taken;
			const result = ends.promise.then(({ head }) => head);
			ends.promise = ends.promise.then(({ tail }) => tail);
			return result;
		},
		reset(value: T) {
			while (taken > 0) {
				this.put(value);
			}
			ends = Deferred<QueueType<T>>();
		},
	};
}
