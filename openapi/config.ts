import { fileURLToPath } from 'node:url'
import type {  NitroOptions, Nitro } from 'nitropack'
import fileRouterPlugin from './rollup-file-router-plugin'
import sucrase from '@rollup/plugin-sucrase'

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
			// input: './index.ts',
			input: fileURLToPath(new URL('index.ts', import.meta.url)),
			output: {
				dir: './dist',
				format: 'cjs',
				exports: 'named'
			},
			plugins: [
				sucrase({
					exclude: ['node_modules/**'],
					transforms: ['typescript'],
				}),
				fileRouterPlugin(nitro)
			],
		},
	}
}