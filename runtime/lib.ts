import { z } from 'zod'
import {
	extendZodWithOpenApi,
} from 'zod-openapi'
import { H3Error } from 'h3'
import { ApiError, ValidationError, UnknownError, H3ErrorToValidationError, H3ErrorToApiError, errorIsIntentional } from './error'

import type { ZodOpenApiResponsesObject } from 'zod-openapi'
import type { SchemaType, QueryObject, H3EventWithTypedRequestData, EventHandlerWithRequestData, ZodOpenApiObjectWithPaths, StatusCode} from './types'
import type { H3Event, EventHandlerRequest } from 'h3'
import type { MatchedMethodSuffix } from './types/file-router'

extendZodWithOpenApi(z)

export const doc: ZodOpenApiObjectWithPaths = {
	openapi: '3.1.0',
	info: {
		title: '',
		version: '',
		description: '',
	},
	servers: [],
	paths: {},
}

export function addValidatedRoute<Params, Query, Body>(routeConfig: {
	path: string
	summary?: string
	tags?: string[]
	method?: MatchedMethodSuffix
	params?: SchemaType<Params, Record<string, string>>
	query?: SchemaType<Query, QueryObject>
	body?: SchemaType<Body, unknown>
	responses: ZodOpenApiResponsesObject
	handler: EventHandlerWithRequestData<
		Params extends Record<string, string> ? Params : undefined,
		Query extends QueryObject ? Query : undefined,
		Body extends unknown ? Body : undefined
	>
}) {
	const docHasPath = routeConfig.path in doc.paths

	const lowercaseMethod = routeConfig.method?.toLowerCase() as MatchedMethodSuffix
	const method = lowercaseMethod ?? 'get'

	const configuration = {
		summary: routeConfig.summary,
		tags: routeConfig.tags,
		requestParams: {
			path: routeConfig.params,
			query: routeConfig.query,
		},
		requestBody: routeConfig.body && {
			content: {
				'application/json': { schema: routeConfig.body },
			},
		},
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

		let statusCode: StatusCode
		let response: unknown

		const strictness = useRuntimeConfig(event).openapiStrictness

		try {
			// Call the defined handler and get the response
			response = await routeConfig.handler(eventWithTypedRequestData) // statusCode might have been changed in here, so only check it after this line

			statusCode = eventWithTypedRequestData.node.res.statusCode.toString() as StatusCode
		} catch (err) {
			if (errorIsIntentional(err)) {
				const schema = getResponseSchema(routeConfig.responses, err.statusCode.toString() as StatusCode)

				// If error is H3Error or ApiError (intentionally thrown) and we have defined a response schema for it, we should validate it
				if (schema) {
					const parsed = schema.safeParse(err)

					if (!parsed.success) {
						switch (strictness) {
							case 1: {
								console.warn('Response did not match the OpenAPI schema for the given status code', parsed.error)
							}
							case 0: {
								throw err
							}
							case 2: 
							case 3: 
							default: {
								// If error is not correctly formatted, send a 500 validation error
								throw new ValidationError({ internal: true, data: parsed.error })
							}
						}
					}

					// If error is correctly formatted, send it to the user
					throw parsed.data
				}

				// If error is intentionally thrown, but has no schema
				switch (strictness) {
					case 1:
					case 2: {
						console.warn('Could not find schema for response with the given status code', err)
					}
					case 0: {
						throw err
					}
					case 3: {
						throw new ValidationError({ internal: true, data: err })
					}
					default: {
						throw err
					}
				}
			}

			// If error is not intentional, we wrap it as generic error and send it to the user as a 500 error
			if (err instanceof Error) {
				throw new ApiError({ name: err.name, statusCode: 500, message: err.message, data: err.cause, stack: err.stack })
			}

			// If error is unknown, we wrap it and send it to the user as a 500 error
			throw new UnknownError(err)
		}

		// If there were no errors in the handler, we validate the non-error response
		const schema = getResponseSchema(routeConfig.responses, statusCode)

		if (schema) {
			const parsed = schema.safeParse(response)

			if (!parsed.success) {
				switch (strictness) {
					case 1: {
						console.warn('Response did not match the OpenAPI schema for the given status code', parsed.error)
					}
					case 0: {
						throw response
					}
					case 2: 
					case 3: 
					default: {
						// If response is not correctly formatted, send a 500 validation error
						throw new ValidationError({ internal: true, data: parsed.error })
					}
				}
			}

			// If response is correctly formatted, send it to the user
			return parsed.data
		}

		// If we cannot find schema for response
		switch (strictness) {
			case 1:
			case 2: {
				console.warn('Could not find schema for response with the given status code', response)
			}
			case 0: {
				return response
			}
			case 3:
			default: {
				throw new ValidationError({ internal: true, data: response })
			}
		}
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

function getResponseSchema(responses: ZodOpenApiResponsesObject, statusCode: StatusCode): z.ZodSchema | undefined {
	if (responses[statusCode] && 'content' in responses[statusCode] && responses[statusCode].content?.['application/json']?.schema) {
		return responses[statusCode].content['application/json'].schema as z.ZodSchema
	}

	return undefined
}