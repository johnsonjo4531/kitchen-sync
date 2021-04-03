import { AsyncBoundedBuffer } from "./AsyncBoundedBuffer.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("BoundedBuffer can act like an AsyncQueue", async function boundedBufferActsLikeAsyncQueue() {
	const arr: number[] = [];
	const buffer = AsyncBoundedBuffer<number>();
	const expected = 3.14159;

	const promiseItem = buffer.dequeue();
	buffer.enqueue(expected);

	assertEquals(await promiseItem, expected);
});

test("BoundedBuffer waits for enqueuement", async function boundedBufferWaitsForEnqueuement() {
	const arr: number[] = [];
	const queue = AsyncBoundedBuffer();
	const queueExpected = 3.14159;
	const sleepExpected = 22;

	const promiseItem = queue.dequeue();
	const raceResult = await Promise.race([
		promiseItem,
		sleep(1).then(() => sleepExpected),
	]);
	assertEquals(raceResult, sleepExpected);
	queue.enqueue(queueExpected);
	assertEquals(await promiseItem, queueExpected);
});

test("BoundedBuffer waits for Dequeues", async function boundedBufferWaitsForDequeues() {
	const arr: number[] = [];
	const queue = AsyncBoundedBuffer();
	const bufferSize = 128;
	const queueExpected = 3.14159;
	const sleepExpected = 22;
	const expected = [],
		actual = [];
	// we just want the final element of the queue.
	let promiseItem;

	for (let i = 0; i < bufferSize + 1; ++i) {
		promiseItem = queue.enqueue(i);
		expected.push(i);
	}

	promiseItem = promiseItem?.then(() => queueExpected);
	const raceResult = await Promise.race([
		promiseItem,
		sleep(1).then(() => sleepExpected),
	]);

	assertEquals(raceResult, sleepExpected);

	let i = bufferSize;
	for (let i = 0; i < bufferSize + 1; ++i) {
		queue.dequeue();
	}

	assertEquals(await promiseItem, queueExpected);
});
