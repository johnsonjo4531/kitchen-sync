import { Channel } from "./Channel.ts";
import { sleep } from "./utils.ts";

function isChannel(something: unknown): something is ReturnType<typeof Channel> {
	return (something as any)?.__type__ === "channel";
}

/** Modeled after goroutines. */
export function Coroutine<Args extends any[], Return extends Generator | AsyncGenerator>(routine: (...args: Args) => Return, option?: "send" | "receive" | "bidirectional" = "bidirectional") {
	return async function (...args: Args) {
		for (const arg of args) {
			if (isChannel(arg)) {
				arg.__coroutines__++;
			}
		}
		let iter = routine(...args);
		let p = iter.next();
		for (const arg of args) {
			if (isChannel(arg)) {
				const ch = arg;
				ch.__coroutines__--;
				if (await ch.__isDeadlocked__()) {
					ch.__throwDeadlockError__();
				}
			}
		}
		let { done, value } = await p;
		console.log(value);
		await value;
		while (!done) {
			for (const arg of args) {
				if (isChannel(arg)) {
					arg.__coroutines__++;
				}
			}
			p = iter.next(value);
			await sleep(0);
			for (const arg of args) {
				if (isChannel(arg)) {
					const ch = arg;
					ch.__coroutines__--;
					if (await ch.__isDeadlocked__()) {
						ch.__throwDeadlockError__();
					}
				}
			}
			({ done, value } = await p)
			await value;
		}
		return value;
	}
}
