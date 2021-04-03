import { Coroutine as co } from "./Coroutine.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("Coroutine returns values", async function asyncQueue() {
	const first = co(function * () {
		return 'bar';
	})();

	const second = co(function * () {
		return 'foo';
	})();

	const [bar, foo] = await Promise.all([first, second]);
	assertEquals(bar, 'bar');
	assertEquals(foo, 'foo');
});

test("Coroutine returns Promise", async function asyncQueue() {
	const first = co(function * () {})();

	assertEquals(first instanceof Promise, true);
});

test("Coroutine takes in values", async function asyncQueue() {
	const shouldBeThree = await co(function * (threeSirThree) {
		return threeSirThree;
	})(3);

	assertEquals(shouldBeThree, 3);
});
