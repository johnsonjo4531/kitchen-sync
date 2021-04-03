import { test, beforeAll, afterAll, afterEach, beforeEach } from "./tap.ts";
import { sleep } from "kitchen-sync";

let foo = 2;
beforeEach(async function () {
	// await sleep(2000);
	foo = 3;
});

for (let i = 0; i < 60*5; ++i) {
	test("" + i, async function threePlusTwo(assert) {
		console.log("HERE");
		await sleep(i * 5 * 1_000 / 60);
		assert(foo, 3);
	});
}
