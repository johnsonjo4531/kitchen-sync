import { Semaphore } from "./Semaphore.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test(async function semaphoreActsLikeAsyncLock() {
	const arr: number[] = [];

	const resource = 3.14;
	const semaphore = Semaphore(1, resource);
	const p1 = (async () => {
		for await (var resource of semaphore) {
			arr.push(resource);
			arr.push(1);
			await sleep(1);
			arr.push(2);
		}
	})();

	const p2 = (async () => {
		for await (var resource of semaphore) {
			arr.push(resource);
			arr.push(3);
			await sleep(1);
			arr.push(4);
		}
	})();

	await Promise.all([p1, p2]);

	assertEquals(arr, [resource, 1, 2, resource, 3, 4]);
});

test(async function semaphoreActsAppropriateWithCount2() {
	const arr: number[] = [];
	const sleepTime = 1;

	const semaphore = Semaphore(2, undefined);
	const p1 = (async () => {
		for await (var _ of semaphore) {
			arr.push(1);
			await sleep(sleepTime);
			arr.push(2);
		}
	})();

	const p2 = (async () => {
		for await (var _ of semaphore) {
			arr.push(3);
			await sleep(sleepTime);
			arr.push(4);
		}
	})();

	const p3 = (async () => {
		for await (var _ of semaphore) {
			arr.push(5);
			await sleep(sleepTime);
			arr.push(6);
		}
	})();

	await Promise.all([p1, p2, p3]);

	assertEquals(arr, [1, 3, 2, 5, 4, 6]);
});
