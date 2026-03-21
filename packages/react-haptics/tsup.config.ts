import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	treeshake: true,
	sourcemap: true,
	minify: false,
	external: ["react", "react-dom", "@haptics/core", "@haptics/react"],
	banner: {
		js: '"use client";',
	},
});
