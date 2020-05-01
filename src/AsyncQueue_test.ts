import { AsyncQueue } from "./AsyncQueue.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test(async function asyncQueue() {
	const arr: number[] = [];
	const queue = AsyncQueue();
	const expected = 3.14159;

	const promiseItem = queue.take();
	queue.put(expected);

	assertEquals(await promiseItem, expected);
});

test(async function asyncQueueWaitsForEnqueuement() {
	const arr: number[] = [];
	const queue = AsyncQueue();
	const queueExpected = 3.14159;
	const sleepExpected = 22;

	const promiseItem = queue.take();

	const raceResult = await Promise.race([
		promiseItem,
		sleep(0).then(() => sleepExpected),
	]);
	assertEquals(raceResult, sleepExpected);
	queue.put(queueExpected);

	assertEquals(await promiseItem, queueExpected);
});

test(async function asyncQueueCanReset() {
	const arr: number[] = [];
	const queue = AsyncQueue();
	const queueExpected = 3.14159;
	const sleepExpected = 22;

	setTimeout(() => {
		queue.reset(true);
	}, 0);
	const promiseItem = queue.take();
	const promiseItem2 = queue.take();
	const promiseItem3 = queue.take();

	const promises = [
		Promise.all<number>([
			promiseItem.then(() => queueExpected),
			promiseItem2.then(() => queueExpected),
			promiseItem3.then(() => queueExpected),
		]),
		sleep(0).then<number[]>(() => [
			sleepExpected,
			sleepExpected,
			sleepExpected,
		]),
	];
	const [raceResult] = await Promise.race(promises);

	assertEquals(raceResult, queueExpected);
	await Promise.all(promises);
});
