import { AsyncCountDownLatch } from "./AsyncCountDownLatch.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("CountDownLatch unlatches", async function countDownLatchUnlatched() {
	const latches = 3;
	const expected = "countdownLatch undone";
	const unexpected = "countdownLatch still latched";

	const latch = AsyncCountDownLatch(latches);
	const result = latch.promise.then(() => expected);

	latch.countDown();
	latch.countDown();
	latch.countDown();

	const waiting = sleep(1).then(() => unexpected);
	const raceResult = await Promise.race([waiting, result]);
	assertEquals(raceResult, expected);
	await Promise.all([waiting, result]);
});

test("CountDownLatch stays latched", async function countDownLatchStillLatched() {
	const latches = 3;
	const expected = "countdownLatch still latched";
	const unexpected = "countdownLatch undone";

	const latch = AsyncCountDownLatch(latches);
	const result = latch.promise.then(() => unexpected);

	latch.countDown();
	latch.countDown();

	const waiting = sleep(1).then(() => expected);
	const raceResult = await Promise.race([waiting, result]);
	assertEquals(raceResult, expected);
	latch.countDown();
	await Promise.all([waiting, result]);
});
