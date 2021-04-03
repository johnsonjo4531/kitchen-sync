# Kitchen-Sync

# ⚠️ WARNING: ⚠️

This is an experimental pre-alpha-level library with some low-level concurrency primitives. Just beware of potential dead-locks due to your own or this library's bugs. I make absolutly no guarentees about the stability of the concurrency APIs in this project. Feel free to use it and give any feedback as well as issues and pull-requests. When it comes to concurrency I know very little at the moment and am no expert.

# Intro

This library is a collection of experimental Async Utilities that allow you to take control of wild concurrent async functions in JavaScript. Below is the table of contents which shows what this library contains:

- [Kitchen-Sync](#kitchen-sync)
- [⚠️ WARNING: ⚠️](#️-warning-️)
- [Intro](#intro)
- [Tour](#tour)
- [API](#api)
	- [AsyncBarrier](#asyncbarrier)
- [See Also](#see-also)

# Tour

Feel free to follow this tour to get a feel for what you get with the whole kitchen-sync and why some things might be useful. If your feeling adventurous or just feeling like you don't need a long lecture skip ahead to the [API](#api).

The simplest mechanism of all the utilities is the AsyncLock. Before jumping right into what it is I'll explain a problem in which you might find it useful. Say you have two async functions these functions normally execute in parallel. Like for example the following:

```ts
// ./examples/readme/example_1.ts
var sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

(async () => {
	console.log(1);
	await sleep(1000);
	console.log(2);
})();

(async () => {
	console.log(3);
	await sleep(1000);
	console.log(4);
})();

/*
Will print
1
3
2
4

NOTE: while sleeping about 1000ms between 3 and 2.
*/
```

Notice how the outputted numbers of the two functions interlay. This might work for most every case, but say you were designing a library and you wanted to make sure none of the functions interlay their outputs. For example your problem might be illustrated as follows.
You have a testing library with the following function test and it uses console.group to group its output:

```ts
// ./examples/readme/example_2.ts
import { green, red, bold } from "https://deno.land/std@v0.38.0/fmt/colors.ts";
import { assertEquals as _assertEquals } from "https://deno.land/std@v0.38.0/testing/asserts.ts";
///============= Library Code ================
export async function test(fn: (assertEquals: typeof _assertEquals) => any) {
	try {
		console.group(`test: ${fn.name}`);
		await fn(_assertEquals);
		console.log(green(bold("✔ group tests passed")));
	} catch (err) {
		console.error(err);
		console.log(red(bold("❌ group tests failed")));
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
```

Looks great, except, hmm... our console groups are all jumbled. It's hard to tell where one test ends and the other begins. Well, one solution here is the AsyncLock which I talked about earlier. Lets change this section to use an AsyncLock. You will notice in the code below we can pass a protected resource to async lock. Then we use a for await block to await the lock. When the block is exited whether by throwing an error or completing without an error then the lock is released:

```ts
import { AsyncLock } from "kitchen-sync";
import { green, red, bold } from "https://deno.land/std@v0.38.0/fmt/colors.ts";
import { assertEquals as _assertEquals } from "https://deno.land/std@v0.38.0/testing/asserts.ts";
///============= Library Code ================
// THIS LINE WAS ADDED
var testLock = AsyncLock(_assertEquals);
async function test(fn: (assert: typeof _assertEquals) => any) {
	// THIS LINE WAS ADDED
	for await (const assert of testLock) {
		try {
			console.group(`test: ${fn.name}`);
			await fn(assert);
			console.log(green(bold("✔ group tests passed")));
		} catch (err) {
			console.error(err);
			console.log(red(bold("❌ group tests failed")));
		} finally {
			console.groupEnd();
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
```



----



Importing kitchen-sync depends on if you're using deno or node.

```ts
import "kitchen-sync";
```

# API

The API section is in alphabetical Order.

## AsyncBarrier

Allows you to block all members waiting on the barrier until the barrier reaches a certain count (that was passed in on initialization) then lets the members all pass the barrier. Be weary of deadlocks created by making unreachable barriers or barriers that never reach the count.

```ts
test(async function asyncBarrierManyWaitsOnBarriers() {
	const arr: number[] = [];
	// initialize the barrier
	const barrier = AsyncBarrier(5);
	const doStuff = async () => {
		arr.push(1);
		// await the barrier.
		await barrier.wait();
		arr.push(2);
		await barrier.wait();
		arr.push(3);
	};

	const p1 = doStuff();
	const p2 = doStuff();
	const p3 = doStuff();
	const p4 = doStuff();
	const p5 = doStuff();

	await Promise.all([p1, p2, p3, p4, p5]).catch(console.error);

	// notice how each barrier is passed one at a time.
	assertEquals(arr, [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]);
});
```

# See Also

- [Kris Kowal's General Theory of Reactivity(gtor)](https://github.com/kriskowal/gtor/)
- [CLR Inside Out 9 Reusable Parallel Data Structures and Algorithms Joe Duffy](https://web.archive.org/web/20090314035320/http://msdn.microsoft.com/en-us/magazine/cc163427.aspx)
