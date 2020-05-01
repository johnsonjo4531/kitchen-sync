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

sleeps 1000ms between 3 and 2.
*/
