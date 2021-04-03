import { AsyncBarrier } from "./AsyncBarrier.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("AsyncBarrier many awaits within barrier", async function asyncBarrierManyAwaitsWithinBarrier() {
	const arr: number[] = [];
	const barrier = AsyncBarrier(2);
	const p1 = (async () => {
		arr.push(1);
		await sleep(1);
		await sleep(1);
		await sleep(1);
		await barrier.wait();
		arr.push(2);
		await barrier.wait();
		arr.push(3);
	})();

	const p2 = (async () => {
		arr.push(1);
		await sleep(1);
		await barrier.wait();
		await sleep(1);
		arr.push(2);
		await sleep(1);
		await sleep(1);
		await barrier.wait();
		arr.push(3);
	})();

	await Promise.all([p1, p2]).catch(console.error);

	assertEquals(arr, [1, 1, 2, 2, 3, 3]);
});

test("AsyncBarrier many waits on barriers", async function asyncBarrierManyWaitsOnBarriers() {
	const arr: number[] = [];
	const barrier = AsyncBarrier(5);
	const doStuff = async () => {
		arr.push(1);
		await barrier.wait();
		arr.push(2);
		await barrier.wait();
		arr.push(3);
	};

	const p1 = doStuff();
	const p2 = doStuff();
	const p3 = doStuff();
	const p4 = doStuff();
	const p5 = doStuff();

	await Promise.all([p1, p2, p3, p4, p5]).catch(console.error);

	assertEquals(arr, [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]);
});

test("AsyncBarrier with many waits on barriers", async function asyncBarrierManyWaitsOnBarriers() {
	const arr: number[] = [];
	const barrier = AsyncBarrier(5);
	const doStuff = async () => {
		arr.push(1);
		await barrier.wait();
		arr.push(2);
		await barrier.wait();
		arr.push(3);
		await barrier.wait();
		arr.push(4);
	};

	const p1 = doStuff();
	const p2 = doStuff();
	const p3 = doStuff();
	const p4 = doStuff();
	const p5 = doStuff();

	await Promise.all([p1, p2, p3, p4, p5]).catch(console.error);

	assertEquals(arr, [
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		4,
	]);
});
