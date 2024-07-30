import type { ZodOpenApiObject, ZodOpenApiPathsObject, ZodOpenApiOperationObject, ZodOpenApiResponseObject } from 'zod-openapi';
import { z } from 'zod';
import type { H3Event, EventHandlerRequest } from 'h3';
export type SchemaType<SchemaContent, TargetType> = z.ZodType<SchemaContent extends TargetType ? SchemaContent : never>;
type QueryValue = string | number | undefined | null | boolean | Array<QueryValue> | Record<string, any>;
export type QueryObject = Record<string, QueryValue | QueryValue[]>;
export interface H3EventWithTypedRequestData<Params, Query, Body> extends H3Event<EventHandlerRequest> {
    params: Params;
    query: Query;
    body: Body;
}
export type EventHandlerWithRequestData<Params, Query, Body> = (event: H3EventWithTypedRequestData<Params, Query, Body>) => unknown | Promise<unknown>;
export interface ZodOpenApiObjectWithPaths extends ZodOpenApiObject {
    paths: NonNullable<ZodOpenApiPathsObject>;
}
export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;
export declare const statusCodeSchema: z.ZodType<StatusCode>;
export interface ZodOpenApiResponses {
    default?: ZodOpenApiResponseObject;
    [statuscode: StatusCode]: ZodOpenApiResponseObject;
}
declare module 'zod-openapi' {
    interface ZodOpenApiPathItemObject {
        connect?: ZodOpenApiOperationObject;
    }
}
export {};
