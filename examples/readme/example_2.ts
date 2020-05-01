///============= Library Code ================
const _assertEquals = (expected: string, actual: string) => {
	if (expected !== actual) {
		// BAD PRACTICE YOU SHOULDN'T NORMALLY THROW STRINGS
		throw `AssertionError: Expected not equal to actual\nExpected:${expected}\nActual:${actual}`;
	}
};
export async function test(fn: (assertEquals: typeof _assertEquals) => any) {
	try {
		console.group(`test: ${fn.name}`);
		await fn(_assertEquals);
		console.log("✔ group tests passed");
	} catch (err) {
		console.error(err);
		console.log("❌ group tests failed");
	} finally {
		console.groupEnd();
	}
}

///============= Code Usage (imagine this as a separate module including the above code) ================
// You would import test here...
var sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
test(async function oneAnd2(assertEquals) {
	assertEquals(1, 1);
	await sleep(1000);
	assertEquals(2, 2);
});

test(async function threeAnd4(assertEquals) {
	assertEquals(3, 1);
	await sleep(1000);
	assertEquals(4, 4);
});

/*
test: oneAnd2
  test: threeAnd4
    AssertionError: Expected did not equal Value.
    Expected: 3
    Value: 1
        at Object.equals (example_2.ts:8:10)
        at threeAnd4 (example_2.ts:40:9)
        at test (example_2.ts:20:9)
        at example_2.ts:39:1
    ❌ group tests failed
  ✔ group tests passed

NOTE: sleeps 1000ms between ❌ group tests failed and ✔ group tests passed.
*/
