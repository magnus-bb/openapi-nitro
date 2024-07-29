import {
	createDocument,
} from 'zod-openapi'
import createScalarPage from './scalar'
import createSwaggerPage from './swagger'
import { doc, title } from './lib'
import { ApiError } from './error'
import { H3Error } from 'h3'

//* PLUGIN
export default defineNitroPlugin(nitro => {
	nitro.router.get('/openapi', eventHandler(event => {
		return createDocument(doc)
	}))

	nitro.router.get('/scalar', eventHandler(event => {
		return createScalarPage(title)
	}))

	nitro.router.get('/swagger', eventHandler(event => {
		return createSwaggerPage(title)
	}))

	nitro.hooks.hook('error', error => {
		// Since errors are used to send responses, nitro does not log them by default
		console.error(error.cause ?? error)
	})
})