import { test, beforeAll, afterAll, afterEach, beforeEach } from "./tap.ts";
import { sleep } from "kitchen-sync";

let foo = 2;
beforeAll(async function () {
	await sleep(2000);
	foo = 3;
});

for (let i = 0; i < 1000; ++i) {
	test("" + i, async function threePlusTwo(assert) {
		await sleep(i);
		assert(foo, 4);
	});
}
