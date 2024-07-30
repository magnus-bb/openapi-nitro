import { H3Error } from 'h3';
import { z } from 'zod';
import type { H3Event } from 'h3';
import type { StatusCode } from './types';
declare const _default: (error: Error, event: H3Event) => any;
export default _default;
export declare class ApiError<T = unknown> {
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
export declare class ValidationError<T> extends ApiError<T> {
    constructor(opts: {
        internal?: boolean;
        message?: string;
        data?: T;
        stack?: string | string[];
    });
}
export declare class UnknownError extends ApiError<unknown> {
    constructor(err: unknown);
}
export declare function H3ErrorToApiError<T = unknown>(err: H3Error<T>, overrides?: Partial<ApiErrorArgs<T>>): ApiError<NoInfer<T>>;
export declare function H3ErrorToValidationError<T = unknown>(err: H3Error<T>, message: string): ValidationError<NoInfer<T>>;
export declare function errorIsIntentional(err: unknown): err is H3Error | ApiError;
