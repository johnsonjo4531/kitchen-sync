const path = require("path");
const webpack = require("webpack");
// https://github.com/Microsoft/TypeScript/issues/16577#issuecomment-343699395
// const ts = require("typescript");
// const {
// 	isImportDeclaration,
// 	isExportDeclaration,
// 	isStringLiteral,
// } = require("tsutils/typeguard/node");

// function getCustomTransformers() {
// 	return { before: [stripJsExt] };

// 	function stripJsExt(context) {
// 		return (sourceFile) => visitNode(sourceFile);

// 		function visitNode(node) {
// 			if (
// 				(isImportDeclaration(node) || isExportDeclaration(node)) &&
// 				node.moduleSpecifier &&
// 				isStringLiteral(node.moduleSpecifier)
// 			) {
// 				const targetModule = node.moduleSpecifier.text;
// 				if (targetModule.endsWith(".ts")) {
// 					const newTarget = targetModule.slice(0, targetModule.length - 3);
// 					return isImportDeclaration(node)
// 						? ts.updateImportDeclaration(
// 								node,
// 								node.decorators,
// 								node.modifiers,
// 								node.importClause,
// 								ts.createLiteral(newTarget)
// 						  )
// 						: ts.updateExportDeclaration(
// 								node,
// 								node.decorators,
// 								node.modifiers,
// 								node.exportClause,
// 								ts.createLiteral(newTarget)
// 						  );
// 				}
// 			}
// 			return ts.visitEachChild(node, visitNode, context);
// 		}
// 	}
// }

module.exports = {
	mode: "production",
	devtool: "inline-source-map",
	resolve: {
		extensions: [".ts"],
		// alias: {
		// 	ts$: path.resolve(__dirname, "src"),
		// },
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
			},
		],
	},
	entry: "./src/kitchen-sync.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "kitchen-sync.js",
		library: "kitchenSync",
		libraryTarget: "umd",
		globalObject: "this",
	},
};
