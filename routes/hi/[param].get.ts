import { z } from "zod"
import { normalizeRoute, defaultTags, addValidatedRoute } from '~/openapi'

const paramsSchema = z.object({
	param: z.enum(['mom', 'dad']).openapi({
	  description: 'A name',
	  example: 'mom',
	  ref: 'name',
	})
})

const querySchema = z.object({
	query: z.coerce.number().optional()
})

const bodySchema = z.object({
	body: z.coerce.number()
})

const responseSchema = z.object({ message: z.string() })

export default addValidatedRoute({
	// path: '/hi/{param}',
	// method: 'get',
	path: _routePath,
	method: _routeMethod,
	params: paramsSchema,
	query: querySchema,
	// body: bodySchema,
	responses: {
		200: {
			description: '200 OK',
			content: {
				'application/json': {
					schema: responseSchema
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

		// throw createError({ statusCode: 200, message: 'This is a test error', data: errorData })

		// setResponseStatus(event, 201)
		return {
			message: `Hi ${param} through path params. This is the query, lol: ${query}`
		} satisfies z.infer<typeof responseSchema>
	}
})

// function validateResponse<T>(schema: z.ZodType<T>, res: unknown): T {
// 	if (!
// 		schema.safeParse(res).success
// 	) {
// 		throw createError({ statusCode: 500, message: 'Response validation failed' })
// 	}

// 	return res as T
// }
