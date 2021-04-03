import { AsyncLock, AsyncBarrier } from "kitchen-sync";
import { green, red, bold } from "https://deno.land/std@v0.38.0/fmt/colors.ts";
import { AssertionError } from "https://deno.land/std@v0.38.0/testing/asserts.ts";
///============= Library Code Module ================
var testLock = AsyncLock(assertionObject);
let barrier: ReturnType<typeof AsyncBarrier>;
let testsPassed = 0;
let enteredTests = 0;
let testsFailed = 0;
async function test(fn: (assert: typeof assertionObject) => any) {
	const myEntranceNumber = enteredTests++;
	console.log(1, myEntranceNumber);
	for await (const assert of testLock) {
		console.log(2, myEntranceNumber);
		try {
			console.group(`test: ${fn.name}`);
			await fn(assert);
			testsPassed++;
			console.log(green(bold("✔ group tests passed")));
		} catch (err) {
			console.log(red(bold("❌ group tests failed")));
		} finally {
			console.groupEnd();
		}
	}
	if (myEntranceNumber === 0) {
		barrier = AsyncBarrier(enteredTests);
		console.log(enteredTests);
	}
	console.log(3, myEntranceNumber);
	await barrier.wait();
	console.log(4, myEntranceNumber);
	if (myEntranceNumber === 0) {
		console.log(green(bold(`Tests passed: ${testsPassed}`)));
		console.log(red(bold(`Tests failed: ${testsFailed}`)));
	}
}

///============= Code Usage (imagine this as a separate module including the above code) ================
test(async function twoPlusTwo(assert) {
	console.log("testing");
	assert.ok(2 + 2 === 4, "two plus two");
});

test(async function threePlusTwo(assert) {
	assert.ok(3 + 2 === 5, "three plus two");
});

test(async function threePlusFour(assert) {
	assert.ok(3 + 4 === 6, "three plus two");
});

test(async function fourSquared(assert) {
	assert.ok(4 ** 2 === 6, "three plus two");
});

/*
When Lock is working should print:
here 1a
here 1b
here 2a
here 2b
*/
