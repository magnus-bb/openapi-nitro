import { NitroModule } from 'nitropack';
import { ZodOpenApiOperationObject, ZodOpenApiObject, ZodOpenApiPathsObject, ZodOpenApiResponsesObject } from 'zod-openapi';
import { z } from 'zod';
import * as h3 from 'h3';
import { H3Event, EventHandlerRequest, H3Error } from 'h3';

type SchemaType<SchemaContent, TargetType> = z.ZodType<SchemaContent extends TargetType ? SchemaContent : never>;
type QueryValue = string | number | undefined | null | boolean | Array<QueryValue> | Record<string, any>;
type QueryObject = Record<string, QueryValue | QueryValue[]>;
interface H3EventWithTypedRequestData<Params, Query, Body> extends H3Event<EventHandlerRequest> {
    params: Params;
    query: Query;
    body: Body;
}
type EventHandlerWithRequestData<Params, Query, Body> = (event: H3EventWithTypedRequestData<Params, Query, Body>) => unknown | Promise<unknown>;
interface ZodOpenApiObjectWithPaths extends ZodOpenApiObject {
    paths: NonNullable<ZodOpenApiPathsObject>;
}
type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;
declare module 'zod-openapi' {
    interface ZodOpenApiPathItemObject {
        connect?: ZodOpenApiOperationObject;
    }
}

declare function export_default(spec?: Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>): NitroModule;

// prettier-ignore
type MatchedMethodSuffix = "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace"

declare global {
	/**
	 * Contains the file router path that is baked in during the build step.
	*/
	const _routePath: string
	
	/**
	 * Contains the file router method that is baked in during the build step.
	*/
	const _routeMethod: MatchedMethodSuffix | undefined
}

declare const doc: ZodOpenApiObjectWithPaths;
declare function addValidatedRoute<Params, Query, Body>(routeConfig: {
    path: string;
    summary?: string;
    tags?: string[];
    method?: MatchedMethodSuffix;
    params?: SchemaType<Params, Record<string, string>>;
    query?: SchemaType<Query, QueryObject>;
    body?: SchemaType<Body, unknown>;
    responses: ZodOpenApiResponsesObject;
    handler: EventHandlerWithRequestData<Params extends Record<string, string> ? Params : undefined, Query extends QueryObject ? Query : undefined, Body extends unknown ? Body : undefined>;
}): h3.EventHandler<EventHandlerRequest, Promise<any>>;

declare class ApiError<T = unknown> {
    static schema<TData extends z.ZodTypeAny>(dataSchema: TData): z.ZodObject<{
        name: z.ZodString;
        statusCode: z.ZodString;
        message: z.ZodString;
        data: TData;
        stack: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, { [k in keyof z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
        name: z.ZodString;
        statusCode: z.ZodString;
        message: z.ZodString;
        data: TData;
        stack: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }>, any>]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
        name: z.ZodString;
        statusCode: z.ZodString;
        message: z.ZodString;
        data: TData;
        stack: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }>, any>[k]; }, { [k_1 in keyof z.baseObjectInputType<{
        name: z.ZodString;
        statusCode: z.ZodString;
        message: z.ZodString;
        data: TData;
        stack: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }>]: z.baseObjectInputType<{
        name: z.ZodString;
        statusCode: z.ZodString;
        message: z.ZodString;
        data: TData;
        stack: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }>[k_1]; }>;
    readonly name: string;
    readonly statusCode: StatusCode;
    readonly message: string;
    readonly data: T;
    readonly stack?: string | string[];
    constructor(opts: {
        name: string;
        statusCode: StatusCode | number;
        message: string;
        data?: T;
        stack?: string | string[];
    });
}
type ApiErrorArgs<T> = ConstructorParameters<typeof ApiError<T>>[0];
declare class ValidationError<T> extends ApiError<T> {
    constructor(opts: {
        internal?: boolean;
        message?: string;
        data?: T;
        stack?: string | string[];
    });
}
declare class UnknownError extends ApiError<unknown> {
    constructor(err: unknown);
}
declare function H3ErrorToApiError<T = unknown>(err: H3Error<T>, overrides?: Partial<ApiErrorArgs<T>>): ApiError<NoInfer<T>>;
declare function H3ErrorToValidationError<T = unknown>(err: H3Error<T>, message: string): ValidationError<NoInfer<T>>;
declare function errorIsIntentional(err: unknown): err is H3Error | ApiError;

export { ApiError, H3ErrorToApiError, H3ErrorToValidationError, UnknownError, ValidationError, addValidatedRoute, export_default as default, doc, errorIsIntentional };
