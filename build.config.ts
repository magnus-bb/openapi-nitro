import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
	declaration: true,
	entries: [
		// './src/index',
		{
			builder: 'mkdist',
			input: './src',
			outDir: './dist',
		},
		// {
		// 	builder: 'mkdist',
		// 	input: './runtime',
		// 	outDir: './dist/runtime',
		// },
	],
	rollup: {
		dts: {
			respectExternal: false
		}
	},
	failOnWarn: false
})