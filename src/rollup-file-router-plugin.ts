import {
	withLeadingSlash,
	withoutTrailingSlash,
	withBase,
} from 'ufo'
import type { InputPluginOption } from 'rollup'
import type { Nitro } from 'nitropack'
import type { MatchedEnvSuffix, MatchedMethodSuffix } from './types/file-router'

const _routePathRegex = /\b_routePath\b/g
const _routeMethodRegex = /\b_routeMethod\b/g

//* Check this to see how Nitro scans folders https://github.com/unjs/nitro/blob/43eca3122219286d6d0e007eb9504db14fed7ef6/src/core/scan.ts
export default function (nitro: Nitro): InputPluginOption {
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
