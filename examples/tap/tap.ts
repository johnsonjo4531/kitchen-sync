import { AsyncLock, AsyncBarrier, sleep } from "kitchen-sync";
///============= Library Code ================
const green = (str: string) => `\x1b[32m${str}\x1b[39m`;
const bold = (str: string) => `\x1b[1m${str}\x1b[22m`;
const red = (str: string) => `\x1b[31m${str}\x1b[39m`;
const _assertEquals = (expected: any, actual: any) => {
	if (expected !== actual) {
		throw new Error(
			`AssertionError: Expected is not equal to Actual\n${
				"Expected: " + expected
			}\n${"Actual: " + actual}`
		);
	}
};
type LogType = {
	target: CallableFunction;
	args: any[];
};
const originalConsole = (globalThis as any)?.console;
function captureConsole() {
	let logs: LogType[] = [];
	return {
		capture() {
			(globalThis as any).console = new Proxy(self.console, {
				get(target, property: keyof __console.Console, receiver) {
					return new Proxy(target[property] as any, {
						apply(target: CallableFunction, thisArg: any, argArray: any[]) {
							logs.push({
								target: (target as any).bind(thisArg),
								args: argArray,
							});
						},
					});
				},
			});
		},
		release() {
			(globalThis as any).console = originalConsole;
			const temp = logs;
			logs = [];
			return temp;
		},
	};
}

async function runTest(fn: TestInput, description = fn.name) {
	let result = { passed: false, err: null, logs: [] as LogType[], description };
	for await (const assert of testLock) {
		const consoleCapture = captureConsole();
		let err = null;
		let passed = true;
		try {
			consoleCapture.capture();
			await fn(assert);
		} catch (err) {
			console.log(err);
			err = err;
			passed = false;
		} finally {
			result = {
				passed,
				err,
				logs: consoleCapture.release(),
				description,
			};
		}
	}
	return result;
}

const beforeAlls: Function[] = [];
export const beforeAll = (fn: Function) => beforeAlls.push(fn);

const beforeEaches: Function[] = [];
export const beforeEach = (fn: Function) => beforeEaches.push(fn);

const afterAlls: Function[] = [];
export const afterAll = (fn: Function) => afterAlls.push(fn);

const afterEaches: Function[] = [];
export const afterEach = (fn: Function) => afterEaches.push(fn);

var testLock = AsyncLock(_assertEquals);
let barrier: ReturnType<typeof AsyncBarrier>;
let testsPassed = 0;
let enteredTests = 0;
let testsFailed = 0;
let logTestCount = 0;
const testCaptures: {
	passed: boolean;
	err: null | Error;
	logs: LogType[];
	description: string;
}[] = [];
let first = true;
type TestInput = (assert: typeof _assertEquals) => any;
export async function test(_description: TestInput | string, _fn?: TestInput) {
	const fn = typeof _description === "string" ? _fn : _description;
	if (!fn) {
		throw new Error("You must provide a function to the test!");
	}
	const description = typeof _description === "string" ? _description : fn.name;
	const myEntranceNumber = enteredTests++;
	for await (const _ of testLock) {
		// allow the other tests to catch up
		await sleep(1);
	}
	// setup the barrier on first entrance
	if (myEntranceNumber === 0) {
		barrier = AsyncBarrier(enteredTests);
		if (first) {
			console.log("TAP version 13");
			first = false;
		}
		console.log(`1..${enteredTests}`);
		enteredTests = 0;
	}
	console.log(myEntranceNumber);
	await barrier.wait();
	// run before alls
	console.log(true);
	if (myEntranceNumber === 0) {
		await Promise.all(beforeAlls.map((x) => x()));
	}
	await barrier.wait();
	console.log(true);
	for await (const _ of testLock) {
		// run before each
		await Promise.all(beforeEaches.map((x) => x()));
		const test = await runTest(fn, description);
		console.group(
			`${test.passed ? "ok" : "not ok"} ${++logTestCount}${
				test.description ? " - " + test.description : ""
			}`
		);
		test?.logs.length > 0 && console.log("---");
		for (const log of test?.logs || []) {
			log.target.name;
			log.target(...log.args);
		}
		test?.logs.length > 0 && console.log("...");
		console.groupEnd();
		// run after each
		await Promise.all(afterEaches.map((x) => x()));
	}
	await barrier.wait();
	// run afterAll
	if (myEntranceNumber === 0) {
		await Promise.all(afterAlls.map((x) => x()));
	}
	await barrier.wait();
}
