import { fileURLToPath } from "node:url";
import fileRouterPlugin from "./rollup-file-router-plugin.mjs";
export default function openAPINitroOptions(nitro) {
  return {
    typescript: {
      strict: true
    },
    plugins: [fileURLToPath(new URL("plugin.ts", import.meta.url))],
    errorHandler: fileURLToPath(new URL("error.ts", import.meta.url)),
    esbuild: {
      options: {
        target: [
          "esnext"
          // makes import.meta work
        ]
      }
    },
    inlineDynamicImports: true,
    // important to make sure routes in /routes are not lazily loaded (which will make addValidatedRoute not run before route is first hit)
    rollupConfig: {
      plugins: [
        fileRouterPlugin(nitro)
      ]
    }
  };
}
