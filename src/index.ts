import { defu } from 'defu'
// import openAPINitroOptions from '../runtime/config'
import type { ZodOpenApiObjectWithPaths} from './types'
import type { NitroModule } from 'nitropack'
import { fileURLToPath } from 'node:url'
import type { NitroOptions, Nitro } from 'nitropack'
import {
	withLeadingSlash,
	withoutTrailingSlash,
	withBase,
} from 'ufo'
import type { InputPluginOption } from 'rollup'
import type { MatchedEnvSuffix, MatchedMethodSuffix } from './types/file-router'
import { dirname, resolve } from "pathe"

const _dirname = typeof __dirname !== "undefined"
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

// const runtime = resolve(_dirname, "runtime");


// Pass in a partial OpenAPI spec to override the default spec
export default function(spec?: Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>): NitroModule {
	return {
		name: 'openapi',
		setup: nitro => {
			nitro.options = defu(openAPINitroOptions(nitro), nitro.options)

			// TODO: type NitroRuntimeConfig so openapiStrictness is defined
			/**
			 * Can be 0 (off), 1, 2, or 3 
			 * Strictness determines how the OpenAPI module validates responses sent from the server.
			 * 0: No validation or logging
			 * 1: Log when intentional responses don't match any of the given OpenAPI response schemas
			 * 2: Send error to client when intentional responses don't match the OpenAPI schema for the given statusCode, and log if you send responses that don't match any given statusCode
			 * 3: Send errors to client when intentional responses don't match the OpenAPI schema for the given statusCode or if no schema is found for the given statusCode
			 */
			if (!nitro.options.runtimeConfig.openapiStrictness) {
				nitro.options.runtimeConfig.openapiStrictness = 1
			}

			if (spec) {
				if (!nitro.options.runtimeConfig.openapiSpec) {
					nitro.options.runtimeConfig.openapiSpec = spec
				} else {
					nitro.options.runtimeConfig.openapiSpec = defu(spec, nitro.options.runtimeConfig.openapiSpec)
				}
			}

			console.info('Running OpenAPI module with strictness set to', nitro.options.runtimeConfig.openapiStrictness)
		},
	}
}


function openAPINitroOptions(nitro: Nitro): NitroOptions {
	return <NitroOptions>{
		typescript: {
			strict: true,
		},

		plugins: [resolve(_dirname, 'plugin.ts')],

		errorHandler: resolve(_dirname, 'error.ts'),

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

const _routePathRegex = /\b_routePath\b/g
const _routeMethodRegex = /\b_routeMethod\b/g

//* Check this to see how Nitro scans folders https://github.com/unjs/nitro/blob/43eca3122219286d6d0e007eb9504db14fed7ef6/src/core/scan.ts
function fileRouterPlugin(nitro: Nitro): InputPluginOption {
	return {
		name: 'file-router',
		
		transform(code, id) {
			// If _routePath or _routeMethod is not found in the code, we can skip the transformation
			if (code.search(new RegExp(_routePathRegex.source + '|' + _routeMethodRegex.source)) === -1) {
				
				return { map: null, code }
			}

			const { route, method } = parseRouteFromFile(id, nitro)
			
			code = code.replace(/\b_routePath\b/g, JSON.stringify(route)).replace(/\b_routeMethod\b/g, JSON.stringify(method) ?? 'undefined')

			return { map: null, code }
		},
	}
}

const suffixRegex =
	/\.(connect|delete|get|head|options|patch|post|put|trace)(\.(dev|prod|prerender))?$/

function parseRouteFromFile(
	filepath: string,
	nitro: Nitro,
) {
	//? Use these replacements for the colon and glob style paths that are usually used when defining routes
	// let route = filepath
	// 	.replace(/\.[A-Za-z]+$/, '') // remove file ext
	// 	.replace(/\[\.{3}]/g, '**') // replace [...] with **
	// 	.replace(/\[\.{3}(\w+)]/g, '**:$1') // replace [...params] with **:params
	// 	.replace(/\[(\w+)]/g, ':$1') // replace [param] with :param

	let route = filepath
		.replace(/\.[A-Za-z]+$/, '') // remove file ext
		.replace(/\[/g, '{') // convert square brackets to curly brackets
		.replace(/\]/g, '}')

		
	// @ts-ignore: apiDir is defined in NitroOptions
	const apiDir = nitro.options.srcDir + withLeadingSlash(nitro.options.apiDir || 'api')
	
	if (route.startsWith(apiDir)) {
		// @ts-ignore: apiBaseURL is defined in NitroOptions
		const apiBaseUrl = nitro.options.apiBaseURL || '/api'
		
		route = withoutTrailingSlash(withBase(removeBasePath(route, [apiDir]), apiBaseUrl))
	} else {
		// @ts-ignore: routesDir is defined in NitroOptions
		const routesDir = nitro.options.srcDir + withLeadingSlash(nitro.options.routesDir || 'routes')
	
		// If specified with leading slash, the absolute path is omitted, so we need to normalize scanDirs
		const scanDirs = nitro.options.scanDirs.map(d => {
			return d.startsWith(nitro.options.srcDir)
				? d
				: nitro.options.srcDir + withLeadingSlash(d)
		}) // always also contains nitro.options.srcDir (as absolute path) apart from the specififed dirs

		const unprefixedDirs = [routesDir, ...scanDirs]

		route = withLeadingSlash(
			withoutTrailingSlash(withBase(removeBasePath(route, unprefixedDirs), '/'))
		)
	}

	const suffixMatch = route.match(suffixRegex)
	let method: MatchedMethodSuffix | undefined
	let env: MatchedEnvSuffix | undefined
	if (suffixMatch?.index) {
		route = route.slice(0, Math.max(0, suffixMatch.index))
		method = suffixMatch[1] as MatchedMethodSuffix
		env = suffixMatch[3] as MatchedEnvSuffix
	}

	route = route.replace(/\/index$/, '') || '/'

	return {
		route,
		method,
		env,
	}
}

function removeBasePath(path: string, basePaths: string[]): string {
	const sortedDirs = basePaths.sort((a, b) => b.length - a.length)

	for (const dir of sortedDirs) {
		if (path.startsWith(dir)) {
			return path.slice(dir.length)
		}
	}

	return path
}
