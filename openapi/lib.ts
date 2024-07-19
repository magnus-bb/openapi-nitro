import { z } from 'zod'
import {
	extendZodWithOpenApi,
} from 'zod-openapi'
import { H3Error } from 'h3'
import { ApiError, ValidationError, UnknownError, H3ErrorToValidationError, H3ErrorToApiError, errorIsIntentional } from './error'

import type { ZodOpenApiResponsesObject } from 'zod-openapi'
import type { SchemaType, QueryObject, H3EventWithTypedRequestData, EventHandlerWithRequestData, ZodOpenApiObjectWithPaths, StatusCode} from './types'
import type { H3Event, EventHandlerRequest } from 'h3'
import type { ParameterObject } from 'openapi-typescript'
import type { MatchedMethodSuffix } from './types/file-router'

extendZodWithOpenApi(z)

export const title = 'My API spec'
export const version = '1.0.0'
export const description = `This is the API documentation for ${title}`

export const doc: ZodOpenApiObjectWithPaths = {
	openapi: '3.1.0',
	info: {
		title,
		version,
		description,
	},
	servers: [
		{
			// const runtimeConfig = useRuntimeConfig(event)
			// const base = runtimeConfig.app?.baseURL
			// const url = joinURL(getRequestURL(event).origin, base)
			url: 'Add URL here from request data',
			description: 'Local Development Server',
			variables: {},
		},
	],
	paths: {},
}

export function addValidatedRoute<Response, Params, Query, Body>(routeConfig: {
	path: string
	method?: MatchedMethodSuffix
	params?: SchemaType<Params, Record<string, string>>
	query?: SchemaType<Query, QueryObject>
	body?: SchemaType<Body, unknown>
	// response: z.ZodType<Response>
	// responses: HandlerReponses<Response>
	responses: ZodOpenApiResponsesObject
	handler: EventHandlerWithRequestData<
		Params extends Record<string, string> ? Params : undefined,
		Query extends QueryObject ? Query : undefined,
		Body extends unknown ? Body : undefined,
		Response
	>
}) {
	const docHasPath = routeConfig.path in doc.paths

	const lowercaseMethod = routeConfig.method?.toLowerCase() as MatchedMethodSuffix
	const method = lowercaseMethod ?? 'get'

	// const responses = Object.fromEntries(Object.entries(routeConfig.responses).map(([statuscode, response]) => [statuscode, {
	// 	...response,
	// 	content: {
	// 		'application/json': { schema: response.schema },
	// 	}
	// }]))

	// TODO: create responses object to make it easier to add

	const configuration = {
		requestParams: {
			path: routeConfig.params,
			query: routeConfig.query,
		},
		requestBody: routeConfig.body && {
			content: {
				'application/json': { schema: routeConfig.body },
			},
		},
		// responses: {
		// 	'200': {
		// 		description: '200 OK',
		// 		content: {
		// 			'application/json': { schema: routeConfig.response },
		// 		},
		// 	},
		// },
		
		responses: routeConfig.responses
	}

	// If path is not already registered
	if (!docHasPath) {
		doc.paths[routeConfig.path] = {
			[method]: configuration
		}
	} else {
		doc.paths[routeConfig.path][method] = configuration
	}

	return eventHandler(async event => {
		const [params, query, body] = await Promise.all([
			getAndValidateParams<Params>(event, routeConfig.params),
			getAndValidateQuery<Query>(event, routeConfig.query),
			getAndValidateBody<Body>(event, routeConfig.body),
		])

		const eventWithTypedRequestData = addTypedRequestData<
			Params extends Record<string, string> ? Params : undefined,
			Query extends QueryObject ? Query : undefined,
			Body extends unknown ? Body : undefined
		>(event, params, query, body)

		const code: StatusCode = eventWithTypedRequestData.node.res.statusCode.toString() as StatusCode
		let response: unknown

		try {
			// Call the defined handler and get the response
			response = await routeConfig.handler(eventWithTypedRequestData)
		} catch (err) {
			// If error is H3Error or ApiError (explicitly thrown) and we have defined a response schema for it, we should validate it
			if (errorIsIntentional(err) && err.statusCode in routeConfig.responses) {
				// Check that returned error matches response schema
				const schema = getResponseSchema(routeConfig.responses, err.statusCode.toString() as StatusCode)
				const parsed = schema.safeParse(err.data)

				// If error is not correctly formatted, send a 500 validation error
				if (!parsed.success) {
					throw new ValidationError({ internal: true, data: parsed.error })
				}
				
				// If error is correctly formatted, send it to the user
				throw err
			}

			// If error is a generic error (no explicit statusCode), we wrap it and send it to the user as a 500 error
			if (err instanceof Error) {
				throw new ApiError({ name: err.name, statusCode: 500, message: err.message, data: err.cause, stack: err.stack })
			}

			// If error is unknown, we wrap it and send it to the user as a 500 error
			throw new UnknownError(err)
		}

		// If there were no errors in the handler, we validate the non-error response
		const schema = getResponseSchema(routeConfig.responses, code)
		const parsed = schema.safeParse(response)

		// If response is not correctly formatted, send a 500 validation error
		if (!parsed.success) {
			throw new ValidationError({ internal: true, data: parsed.error })
		}

		// If everything worked, send the parsed (and potentially transformed) response to the user
		return parsed.data
	})
}

async function getAndValidateParams<Params>(
	event: H3Event<EventHandlerRequest>,
	schema?: z.ZodSchema
): Promise<Params extends Record<string, string> ? Params : undefined> {
	if (!schema)
		return undefined as Params extends Record<string, string>
			? Params
			: undefined

	try {	
		return await getValidatedRouterParams(event, schema.parse)
	} catch (err) {
		// getValidatedRouterParams always throws an H3Error
		if (err instanceof H3Error) {
			throw H3ErrorToValidationError(err, 'Request route params validation failed')
		}

		return undefined as Params extends Record<string, string> ? Params : undefined // should never happen
	}
}

async function getAndValidateQuery<Query>(
	event: H3Event<EventHandlerRequest>,
	schema?: z.ZodSchema
): Promise<Query extends QueryObject ? Query : undefined> {
	if (!schema) return undefined as Query extends QueryObject ? Query : undefined

	try  {
		return await getValidatedQuery(event, schema.parse)
	} catch (err) {
		// getValidatedQuery always throws an H3Error
		if (err instanceof H3Error) {
			throw H3ErrorToValidationError(err, 'Request query params validation failed')
		}

		return undefined as Query extends QueryObject ? Query : undefined // should never happen
	}
}

async function getAndValidateBody<Body>(
	event: H3Event<EventHandlerRequest>,
	schema?: z.ZodSchema
): Promise<Body extends unknown ? Body : undefined> {
	if (!schema) return undefined as Body extends unknown ? Body : undefined

	try {
		return await readValidatedBody(event, schema.parse)
	} catch (err) {
		// readValidatedBody always throws an H3Error
		if (err instanceof H3Error) {
			if (err.statusCode === 405) {
				// reading body can be disallowed on e.g. GET requests
				throw H3ErrorToApiError(err, { name: 'DisallowedMethodError' })
			}

			throw H3ErrorToValidationError(err, 'Request body validation failed')
		}

		return undefined as Body extends unknown ? Body : undefined // should never happen
	}
}

function addTypedRequestData<Params, Query, Body>(
	event: H3Event<EventHandlerRequest>,
	params: Params,
	query: Query,
	body: Body
): H3EventWithTypedRequestData<Params, Query, Body> {
	Object.assign(event, { params, query, body })

	return event as H3EventWithTypedRequestData<Params, Query, Body>
}

export function normalizeRoute(_route: string) {
	const parameters: ParameterObject[] = []

	let anonymousCtr = 0
	const route = _route
		.replace(/:(\w+)/g, (_, name) => `{${name}}`)
		.replace(/\/(\*)\//g, () => `/{param${++anonymousCtr}}/`)
		.replace(/\*\*{/, '{')
		.replace(/\/(\*\*)$/g, () => `/{*param${++anonymousCtr}}`)

	const paramMatches = route.matchAll(/{(\*?\w+)}/g)
	for (const match of paramMatches) {
		const name = match[1]
		if (!parameters.some(p => p.name === name)) {
			parameters.push({
				name,
				in: 'path',
				required: true,
				schema: { type: 'string' },
			})
		}
	}

	return {
		route,
		parameters,
	}
}

export function defaultTags(route: string) {
	const tags: string[] = []

	if (route.startsWith('/api/')) {
		tags.push('API Routes')
	} else if (route.startsWith('/_')) {
		tags.push('Internal')
	} else {
		tags.push('App Routes')
	}

	return tags
}

function getResponseSchema(responses: ZodOpenApiResponsesObject, statusCode: StatusCode): z.ZodSchema {
	if (!('content' in responses[statusCode]) || !(responses[statusCode].content?.['application/json'])) {
		throw new ValidationError({ internal: true, message: 'Response validation schema not found', data: {
			statusCodeLookup: statusCode,
			responses
		} })
	}

	return responses[statusCode].content['application/json'].schema as z.ZodSchema
}