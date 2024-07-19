import { fileURLToPath } from 'node:url'
import type {  NitroOptions, Nitro } from 'nitropack'
import fileRouterPlugin from './rollup-file-router-plugin'
import { addValidatedRoute } from './lib'

// TODO: make into module
// https://github.com/unjs/nitro/blob/43eca3122219286d6d0e007eb9504db14fed7ef6/src/types/nitro.ts#L12

export default function openAPINitroOptions(nitro: Nitro): NitroOptions {
	return <NitroOptions>{
		typescript: {
			strict: true,
		},
	
		plugins: [fileURLToPath(new URL('plugin.ts', import.meta.url))],

		errorHandler: fileURLToPath(new URL('error.ts', import.meta.url)),
	
		esbuild: {
			options: {
				target: [
					'esnext', // makes import.meta work
				],
			},
		},
	
		inlineDynamicImports: true, // important to make sure routes in /routes are not lazily loaded (which will make addValidatedRoute not run before route is first hit)
	
		rollupConfig: {
			plugins: [
				fileRouterPlugin(nitro)
			],
		},
	}
}