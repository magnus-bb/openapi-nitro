import {
	createDocument,
} from 'zod-openapi'
import createScalarPage from './scalar'
import createSwaggerPage from './swagger'
import { doc } from './lib'
import { defu } from 'defu'
import type { ZodOpenApiObjectWithPaths } from './types'

//* PLUGIN
export default defineNitroPlugin(nitro => {
	const spec = useRuntimeConfig().openapiSpec as Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>

	nitro.router.get('/openapi', eventHandler(event => {
		// @ts-ignore
		return createDocument(defu(spec, doc))
	}))

	nitro.router.get('/scalar', eventHandler(event => {
		return createScalarPage(spec.info.title)
	}))

	nitro.router.get('/swagger', eventHandler(event => {
		return createSwaggerPage(spec.info.title)
	}))

	nitro.hooks.hook('error', error => {
		// Since errors are used to send responses, nitro does not log them by default
		console.error(error.cause ?? error)
	})
})