import { z } from "zod"
import { addValidatedRoute, ApiError } from '~/openapi'

const paramsSchema = z.object({
	param: z.enum(['mom', 'dad']).openapi({
	  description: 'A name',
	  example: 'mom',
	  ref: 'param-post-name',
	})
})

const querySchema = z.object({
	query: z.coerce.number().optional()
})

const bodySchema = z.object({
	body: z.coerce.number()
})

const schema201 = z.object({ message: z.string() })
const schema400 = ApiError.schema(z.object({ stackorshit: z.string() }))
type Schema400 = z.infer<typeof schema400>

export default addValidatedRoute({
	path: _routePath,
	summary: 'Say hi and get a greeting back',
	tags: ['Greeting'],
	method: _routeMethod,
	params: paramsSchema,
	query: querySchema,
	body: bodySchema,
	responses: {
		201: {
			description: '201 Created',
			content: {
				'application/json': {
					schema: schema201
				}
			},
		},
		400: {
			description: '400 Test',
			content: {
				'application/json': {
					schema: schema400
				}
			},
		},
	},
	handler: async event => {
		// const { user } = event.context // from auth middleware (write own validation in mw)
		const { param } = event.params // from path params (already validated)
		const { query } = event.query // from query params (already validated)
		const { body } = event.body // no such thing (it was not passed to addValidatedRoute)

		const errorData = { stackorshit: 'This is what went wrong' }

		// throw new ApiError({ name: 'ApiError', statusCode: 401, message: 'This is a test error', data: errorData })
		// throw createError({ name: 'createError', statusCode: 401, message: 'This is a test error', data: errorData })
		// throw createError({ name: 'createErrorWithoutData', statusCode: 401, message: 'This is a test error' })
		// throw createError('errorman')
		// throw new Error('Normal Error', { cause: 'cause' })
		// throw new Error('Normal Error')
		// throw 'just a string'

		// throw new ApiError({ name: 'ApiError', statusCode: 401, message: 'This is a test error', data: errorData })


		setResponseStatus(event, 201)

		return {
			message: `Hi ${param} through path params. This is the query, lol: ${query}, and here's the body: ${body}`
		} satisfies z.infer<typeof schema201>
	}
})