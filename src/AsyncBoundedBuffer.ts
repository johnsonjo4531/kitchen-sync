import { AsyncLock } from "./AsyncLock.ts";

function Queue<T>() {
	const queue: T[] = [];
	return {
		enqueue(item: T) {
			queue.push(item);
		},
		dequeue(): T | undefined {
			return queue.shift();
		},
		get count() {
			return queue.length;
		},
	};
}

export function AsyncBoundedBuffer<T>() {
	const queue = Queue<T>();
	const queueLock = AsyncLock(queue);
	let consumersWaiting = 0;
	let producersWaiting = 0;
	const maxBufferSize = 128;
	const dequeue = async function dequeue(): Promise<T> {
		let e!: T;
		for await (const _ of queueLock.release) {
			while (queue.count == 0) {
				consumersWaiting++;
				await queueLock.wait();
				consumersWaiting--;
			}
			e = queue.dequeue() as any;
			if (producersWaiting > 0) queueLock.release();
		}
		return e;
	};
	return {
		async enqueue(value: T) {
			for await (const _ of queueLock.release) {
				while (queue.count == maxBufferSize - 1) {
					producersWaiting++;
					await queueLock.wait();
					producersWaiting--;
				}
				queue.enqueue(value);
				if (consumersWaiting > 0) queueLock.release();
			}
		},
		dequeue: Object.assign(dequeue, {
			async *[Symbol.asyncIterator]() {
				while (true) {
					yield dequeue();
				}
			},
		}),
	};
}
