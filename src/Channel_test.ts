import { Channel } from "./Channel.ts";
import { Coroutine as co } from "./Coroutine.ts";
import { assertEquals, test } from "./dev_deps.ts";
import { sleep } from "./utils.ts";

test("Channel deadlocks with one stuck coroutine", async function () {
	const ch = Channel<number>();
	const first = co(function * (ch) {
		yield ch.receive()
	})(ch);

	const failed =  await Promise.all([
		first,
	]).then(()=> false).catch((err) => err.message.includes("deadlock"));

	assertEquals(failed, true);
});

test("Channel throws if all coroutines are sleeping (all coroutines receive).", async function () {
	const ch = Channel<number>();
	const first = co(function * (ch) {
		yield ch.receive();
	})(ch);

	const second = co(function * (ch) {
		yield ch.receive();
	})(ch);

	const failed =  await Promise.all([
		first,
		second
	]).then(()=> false).catch(() => true);

	assertEquals(failed, true);
});

test("Channel throws if all coroutines are sleeping (too many receives).", async function () {
	const ch = Channel<number>();
	const first = co(function * (ch) {
		yield ch.send(3)
	})(ch);

	const second = co(function * (ch) {
		yield ch.receive();
		yield ch.receive();
	})(ch);

	const failed =  await Promise.all([
		first,
		second
	]).then(()=> false).catch(() => true);

	assertEquals(failed, true);
});

test("Channel throws if all coroutines are sleeping (too many sends for buffer).", async function () {
	const ch = Channel<number>();
	const first = co(function * (ch) {
		yield ch.send(3)
		yield ch.send(3)
	})(ch);

	const second = co(function * (ch) {
		yield ch.receive();
	})(ch);

	const failed =  await Promise.all([
		first,
		second
	]).then(()=> false).catch(() => true);

	assertEquals(failed, true);
});

test("Channel sends, receives, and returns coroutine data", async function asyncQueue() {
	const ch = Channel<number>();
	const first = co(function * (ch) {
		yield ch.send(3)
	})(ch);

	const second = co(function * (ch) {
		return ch.receive()
	})(ch);
	console.log("HERE");
	const [_, receivedValue] = await Promise.all([
		first,
		second
	]);
	console.log('here');
	assertEquals(receivedValue, 3);
});

test("Channel and coroutines can be nested", co(async function* asyncQueue() {
	try {
		const arr: number[] = [];
		const ch = Channel<number>();
		const p = co(function* () { yield ch.send(3); })();
		const three = yield ch.receive();
	
		console.log(three);
		assertEquals(three, 3);
	} catch (err) {
		console.log(err)
	}
}));

