import type { ZodOpenApiResponsesObject } from 'zod-openapi';
import type { SchemaType, QueryObject, EventHandlerWithRequestData, ZodOpenApiObjectWithPaths } from './types';
import type { MatchedMethodSuffix } from './types/file-router';
export declare const doc: ZodOpenApiObjectWithPaths;
export declare function addValidatedRoute<Params, Query, Body>(routeConfig: {
    path: string;
    summary?: string;
    tags?: string[];
    method?: MatchedMethodSuffix;
    params?: SchemaType<Params, Record<string, string>>;
    query?: SchemaType<Query, QueryObject>;
    body?: SchemaType<Body, unknown>;
    responses: ZodOpenApiResponsesObject;
    handler: EventHandlerWithRequestData<Params extends Record<string, string> ? Params : undefined, Query extends QueryObject ? Query : undefined, Body extends unknown ? Body : undefined>;
}): any;
