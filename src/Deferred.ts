export default function Deferred<T>(): {
	resolve: (value?: T) => void;
	reject: (reason?: any) => void;
	promise: Promise<T>;
} {
	var resolve!: (value?: T) => void, reject!: (reason?: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { resolve, reject, promise };
}
