// eslint.config.js
import unusedImports from "eslint-plugin-unused-imports";
import pluginRouter from "@tanstack/eslint-plugin-router";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
	{
		parser: "@typescript-eslint/parser",
		plugins: {
			"@tanstack/router": pluginRouter,
			"unused-imports": unusedImports,
		},
		files: ["**/*.ts", "**/*.tsx"],
		rules: {
			"no-unused-vars": "off",
			"unused-imports/no-unused-imports": "warn",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
		},
	},
	eslintConfigPrettier,
];
