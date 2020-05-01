const path = require("path");
const webpack = require("webpack");

module.exports = {
	mode: "production",
	resolve: {
		alias: {
			ts$: path.resolve(__dirname, "src"),
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
			},
		],
	},
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "script.js",
	},
};
