import {
	createDocument,
} from 'zod-openapi'
import createScalarPage from './scalar'
import createSwaggerPage from './swagger'
import { doc, title } from './lib'

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
})