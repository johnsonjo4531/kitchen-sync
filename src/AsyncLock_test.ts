import { AsyncLock } from "./AsyncLock.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("AsyncLock", async function asyncLock() {
	const arr: number[] = [];
	const resource = 3.14;
	const lock = AsyncLock(resource);
	const p1 = (async () => {
		for await (var resource of lock) {
			arr.push(resource);
			arr.push(1);
			await sleep(1);
			arr.push(2);
		}
	})();

	const p2 = (async () => {
		for await (var resource of lock) {
			arr.push(resource);
			arr.push(3);
			await sleep(1);
			arr.push(4);
		}
	})();

	await Promise.all([p1, p2]);

	assertEquals(arr, [resource, 1, 2, resource, 3, 4]);
});
