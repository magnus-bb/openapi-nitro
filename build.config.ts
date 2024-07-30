import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
	declaration: true,
	rollup: {
		dts: {
			respectExternal: false
		}
	},
	failOnWarn: false
})