import { AsyncLock, AsyncBarrier, sleep, AsyncQueue } from "../../../src/kitchen-sync.ts";
///============= Library Code ================
const green = (str: string) => `\x1b[32m${str}\x1b[39m`;
const bold = (str: string) => `\x1b[1m${str}\x1b[22m`;
const red = (str: string) => `\x1b[31m${str}\x1b[39m`;

class AssertionError extends Error {
	message = "Expected does not equal actual";
	expected: any;
	actual: any;
}

const _assertEquals = (expected: any, actual: any) => {
	if (expected !== actual) {
		const err = new AssertionError();
		err.expected = expected;
		err.actual = actual;
		throw err;
	}
};
type LogType = {
	id: any;
	target: CallableFunction;
	property: keyof Console;
	args: any[];
};

const originalConsole = (globalThis as any)?.console;
const captureConsole = (function () {
	return function captureConsole(id: any, fn: CallableFunction) {
		let logs: LogType[] = [];
		return {
			capture() {
				const prevConsole = console;
				(globalThis as any).console = new Proxy(prevConsole, {
					get(_target, property: keyof Console, receiver) {
						return new Proxy(_target[property] as any, {
							apply(target: CallableFunction, thisArg: any, argArray: any[]) {
								logs.push({
									id,
									property: property,
									target: (target as any).bind(thisArg),
									args: argArray,
								});	
								if (prevConsole !== originalConsole) {
									return (target as any).apply(thisArg, ([argArray as any[]].flat()) as any);
								}
							}
						});
					}
				})
			},
			getLogs(): LogType[] {
				return logs;
			},
			release() {
				logs = [];
				(globalThis as any).console = originalConsole;
			},
		};
	}
})();

var runTestLock = AsyncLock(_assertEquals);
async function runTest(fn: TestInput, description: string = fn.name) {
	const assert = _assertEquals;
	try {
		await fn(assert);
	} catch (error) {
		return {
			passed: false,
			err: error as AssertionError | null | Error,
			description,
		};
	}
	return {
		passed: true,
		err: null,
		description,
	};
}

type TestInput = (assert: typeof _assertEquals) => any;

enum MESSAGE_TYPES {
	'test' = 'test',
	'logs' = 'logs',
	'start' = 'start',
	'close' = 'close',
};

type PromiseRemover<T> = T extends Promise<infer U> ? U : never;
type MessageType = {
	__type: MESSAGE_TYPES.test,
	data: PromiseRemover<ReturnType<typeof runTest >>
} | { __type: MESSAGE_TYPES.logs, data: LogType[] } | { __type: MESSAGE_TYPES.start, data: number } | { __type: MESSAGE_TYPES.close, data: undefined }

const messages = AsyncQueue<MessageType>();
type MessagePasser = { [P in MessageType["__type"]]: (arg: Extract<MessageType, { __type: P }>['data']) => void };
// const message: MessagePasser = Object.keys(MESSAGE_TYPES).reduce<MessagePasser>((acc, type) => ({...acc, [type]: (data: any) => messages.put({ data, __type: MESSAGE_TYPES[type] })}), {} as any);

const message: MessagePasser = {
	close: data => messages.put({ data, __type: MESSAGE_TYPES.close }),
	logs: data => messages.put({ data, __type: MESSAGE_TYPES.logs }),
	start: data => messages.put({ data, __type: MESSAGE_TYPES.start }),
	test: data => messages.put({ data, __type: MESSAGE_TYPES.test })
}; 



const beforeAlls: Function[] = [];
export const beforeAll = (fn: Function) => beforeAlls.push(fn);

const beforeEaches: Function[] = [];
export const beforeEach = (fn: Function) => beforeEaches.push(fn);

const afterAlls: Function[] = [];
export const afterAll = (fn: Function) => afterAlls.push(fn);

const afterEaches: Function[] = [];
export const afterEach = (fn: Function) => afterEaches.push(fn);

type testCaptures = {
	passed: boolean;
	err: null | Error;
	logs: LogType[];
	description: string;
};
let first = true;
interface ErrorConstructor {
	prepareStackTrace(err: Error,): any
}
export const test = (() => {
	Object.defineProperty(globalThis, '__stack', {
		get: function () {
		const ERR: any = Error;
    var orig = ERR.prepareStackTrace;
    ERR.prepareStackTrace = function(_: any, stack: any){ return stack; };
    var err = new Error;
    ERR.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    ERR.prepareStackTrace = orig;
    return stack;
  }
});
	let barrier: ReturnType<typeof AsyncBarrier>;
	let enteredTests = 0;
	var testLock = AsyncLock(true);
	return async function test(_description: TestInput | string, _fn?: TestInput) {
		const fn = (typeof _description === "string") ? _fn : _description;
		if (!fn) {
			throw new Error("You must provide a function to the test!");
		}
		const description = (typeof _description === "string") ? _description : fn.name;
		const myEntranceNumber = enteredTests++;
		for await (const _ of testLock) {
			// allow the other tests to catch up
			// hopefully there are no top level awaits
			// between tests...
			await sleep(1);
		}
		// setup the barrier on first entrance
		// entranceNumber 0 will act as our coordinator since it
		// will always exist.
		if (myEntranceNumber === 0) {
			barrier = AsyncBarrier(enteredTests);
			// if (first) {
			message.start(enteredTests);
			// first = false;
			// }
			enteredTests = 0;
			// run every before each
			await Promise.all(beforeEaches.map((x) => x()));
		}
		await barrier.wait();
		if (myEntranceNumber === 0) {
			var capture;
			capture = captureConsole(myEntranceNumber, fn);
			capture.capture();
		}
		await barrier.wait();
		const _test = await runTest(fn, description);
		for await (const _ of testLock) {
			message.test({ ..._test });
		}
		await barrier.wait();
		if (myEntranceNumber === 0) {
			let logs = (capture as ReturnType<typeof captureConsole>).getLogs().filter(x => x.id === myEntranceNumber);
			message.logs(logs);
			(capture as ReturnType<typeof captureConsole>).release();	
		}
		await barrier.wait();
		for await (const _ of testLock) {
			// run after each
			await Promise.all(afterEaches.map((x) => x()));
		}
		// await barrier.wait();
		// run afterAll
		
		await barrier.wait();
		message.close(undefined);
		// Deno.exit(0);
	}
})();
	
(async () => {
	originalConsole.log("TAP version 13");
	const printMessage = (message: MessageType) => (print[message.__type] as any)(message.data);
	const print: MessagePasser = ({
	start(numTests) {
		originalConsole.log("1.." + numTests);
	},
	test(test) {
		let testFirstLine = "";
		if (test.passed) {
			originalConsole.log(`ok - ${test.description}`);
		} else {
			originalConsole.log(`not ok - ${test.description}`);
		}
		if(test.err) {
			const err = test.err;
			if(err instanceof AssertionError) {
originalConsole.log(`# Diagnostic
	---
	message: ${test.err.message}
	severity: fail
	data:
		got: ${err.actual}
		expect: ${err.expected}
	...`);
			} else {
originalConsole.log(`# Diagnostic
	---
	message: ${test.err.message}
	severity: fail
	...`);
			}

		}

	},
	logs(logs) {
		if (logs.length > 0) {
			originalConsole.group();
			originalConsole.log("---");
			originalConsole.log("logs:")
			originalConsole.group();
			for (const log of (logs || [])) {
				// originalConsole[log.property](...log.args)
			}
			originalConsole.groupEnd();
			originalConsole.log("...");
			originalConsole.groupEnd();
		}
	},
	close(thing) {
		// originalConsole.log("CLOSE", thing);
		// test cleanup
	}
});
	// @ts-ignore
	if (typeof WorkerGlobalScope !== "undefined") {
		originalConsole.log("HERE")
		// tap is running in a worker it needs to send its messages.
		let message = await messages.take();
		while (message.__type != MESSAGE_TYPES.close) {
			(self as any).postMessage(message);
			message = await messages.take();
		}
	} else {
		if (import.meta.main) {
			originalConsole.log("Main deno file")
			if (typeof Deno !== "undefined") {
				for (const workerFile of Deno.args) {
					// This program runs itself over different files this would mean we need a glob expander.
					// TODO: Make tap work with file globs and make it import itself and then import the other modules somehow
					// tap is being run as the main script which should mean it needs a file glob.
					const myWorker = new Worker(workerFile);

					myWorker.onmessage = (messageEvent: { data: MessageType }) => {
						const message = messageEvent.data;
						// tap is running in a worker it needs to send its messages.
						printMessage(message);
					};
				}
			}
		} else {
			originalConsole.log("Running from script")
			// tap is being run from an imported script
			// which should be fine it just needs to
			// print the output as it comes
			let message = await messages.take();
			printMessage(message);
			while (message.__type != MESSAGE_TYPES.close) {
				message = await messages.take();
				printMessage(message);
			}
		}
	}
})();


