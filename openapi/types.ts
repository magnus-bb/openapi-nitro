import type {
	ZodOpenApiObject,
	ZodOpenApiPathsObject,
	ZodOpenApiOperationObject,
	ZodOpenApiResponseObject,
} from 'zod-openapi'
import { z } from 'zod'
import type { H3Event, EventHandlerRequest } from 'h3'

//* UTILS
export type SchemaType<SchemaContent, TargetType> = z.ZodType<
	SchemaContent extends TargetType ? SchemaContent : never
>

//* H3
type QueryValue =
	| string
	| number
	| undefined
	| null
	| boolean
	| Array<QueryValue>
	| Record<string, any>

export type QueryObject = Record<string, QueryValue | QueryValue[]>

export interface H3EventWithTypedRequestData<Params, Query, Body>
	extends H3Event<EventHandlerRequest> {
	params: Params
	query: Query
	body: Body
}

export type EventHandlerWithRequestData<Params, Query, Body, Response> = (
	event: H3EventWithTypedRequestData<Params, Query, Body>
) => Response | Promise<Response>


//* ZOD-OPENAPI
export interface ZodOpenApiObjectWithPaths extends ZodOpenApiObject {
	paths: NonNullable<ZodOpenApiPathsObject>
}

export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`
export const statusCodeSchema = z.string().refine((code) => {
	return code.match(/^[1-5]\d{2}$/) !== null
}) as z.ZodType<StatusCode>

type A = z.infer<typeof statusCodeSchema>

export interface ZodOpenApiResponses {
	default?: ZodOpenApiResponseObject;
	[statuscode: StatusCode]: ZodOpenApiResponseObject;
}

declare module 'zod-openapi' {
	interface ZodOpenApiPathItemObject {
		connect?: ZodOpenApiOperationObject
	}

}