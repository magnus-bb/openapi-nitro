import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
  entries: ["./openapi/index"],
	declaration: true,
	outDir: "dist",
	rollup: {
		dts: {
			respectExternal: false
		}
	}
})