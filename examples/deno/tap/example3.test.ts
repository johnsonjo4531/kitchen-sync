import { test, beforeAll, afterAll, afterEach, beforeEach } from "./tap.ts";
import { sleep } from "kitchen-sync";

let foo = 2;
beforeEach(async function () {
	// await sleep(2000);
	foo = 3;
});

for (let i = 0; i < 60*5; ++i) {
	test("" + i, async function threePlusTwo(assert) {
		await sleep(i * 1_000 / 60);
		assert(foo, 3);
		if (i === 60 * 5 - 1) {
			assert(false, true);
		}
	});
}
