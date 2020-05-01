import { test, beforeAll, afterAll, afterEach, beforeEach } from "./tap";
import { sleep } from "kitchen-sync";

const foo = 2;
beforeAll(async function () {
	await sleep(2000);
});

test(async function twoPlusTwo(assert) {
	console.log("testing");
	assert(2 + 2, 4);
});

test(async function threePlusTwo(assert) {
	assert(3 + 2, 5);
});

test(async function threePlusFour(assert) {
	assert(3 + 4, 6);
});

test(async function fourSquared(assert) {
	assert(4 ** 2, 6);
});
