import { AsyncLock } from "kitchen-sync";
///============= Library Code ================
const green = (str: string) => `\x1b[32m${str}\x1b[39m`;
const bold = (str: string) => `\x1b[1m${str}\x1b[22m`;
const red = (str: string) => `\x1b[31m${str}\x1b[39m`;
const _assertEquals = (expected: string, actual: string) => {
	if (expected !== actual) {
		// BAD PRACTICE YOU SHOULDN'T NORMALLY THROW STRINGS
		throw `AssertionError: Expected not equal to actual\n${"Expected: " +
			expected}\n${"Actual: " + actual}`;
	}
};
const originalConsole = self.console;
const consoleCapture = (function captureConsole() {
	const logs: { type: keyof __console.Console, args: any[] }[] = [];
	return {
		capture() {
			self.console = new Proxy(self.console, {
				get(target, property: keyof __console.Console, receiver) {
					return new Proxy(target[property], {
						apply(target, thisArg, argArray) {
							logs.push({ type: property, args: argArray });
						}
					})
				}
			});
		},
		release() {
			self.console = originalConsole;
			for (const { args, type } of logs) {
				(originalConsole?.[type] as any)?.apply?.(originalConsole, ...args);
			}
		}
	}
})();
var testLock = AsyncLock(_assertEquals);
async function test(fn: (assert: typeof _assertEquals) => any) {
	for await (const assert of testLock) {
		let passed = true;
		try {
			consoleCapture.capture();
			await fn(assert);
			consoleCapture.release();
			console.log(green(bold("✔ group tests passed")));
		} catch (err) {
			console.error(err);
		} finally {
			if()
			console.group(`test: ${fn.name}`);
			console.groupEnd();
			console.log(red(bold("❌ group tests failed")));
		}
	}
}

///============= Code Usage (imagine this as a separate module including the above code) ================
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
  ✔ group tests passed
test: threeAnd4
  AssertionError: 
  
      [Diff] Left / Right
  
  
  -   3
  +   1
  
      at assertEquals (asserts.ts:165:9)
      at threeAnd4 (example_3.ts:30:2)
      at test (example_3.ts:10:10)
  ❌ group tests failed
*/
