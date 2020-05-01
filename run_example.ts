import { parse } from "https://deno.land/std@v0.38.0/flags/mod.ts";

if (Deno.args.length === 0) {
	throw new Error(
		"Please provide a number of the example file to run as a command line argument."
	);
} else {
	const process = Deno.run({
		cmd: [
			"deno",
			"run",
			"--importmap",
			"./import_map.json",
			`examples/readme/example_${Deno.args[0]}.ts`,
		],
	});
	await process.status();
}
