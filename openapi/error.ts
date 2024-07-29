import { H3Error } from 'h3'
import { z } from 'zod'
import type { H3Event } from 'h3'
import type { StatusCode } from './types'

const isDev = process.env.NODE_ENV === 'development'

// export default defineNitroErrorHandler((error: Error, event: H3Event) => {
export default (error: Error, event: H3Event) => {
	setResponseHeader(event, 'Content-Type', 'application/json')

	// defineNitroErrorHandler automatically wraps everything in an H3Error object and puts the intended error in the cause property
	const err = error.cause ?? error

	if (!isDev && typeof err === 'object' && 'stack' in err) {
		delete err.stack
	}

	return send(event, JSON.stringify(err))
}

export class ApiError<T = unknown> {
	static schema<TData extends z.ZodTypeAny>(dataSchema: TData) {
		return z.object({
			name: z.string(),
			statusCode: z.coerce.string(),
			message: z.string(),
			data: dataSchema,
			stack: z.union([z.string(), z.array(z.string())]).optional(),
		})
	}

	// @ts-ignore
	readonly name: string
	readonly statusCode: StatusCode
	// @ts-ignore
	readonly message: string
	// @ts-ignore
	readonly data: T
	readonly stack?: string | string[]

	constructor(opts: {
		name: string
		statusCode: StatusCode | number
		message: string
		data?: T
		stack?: string | string[]
	}) {
		Object.assign(this, opts)
		this.statusCode = opts.statusCode.toString() as StatusCode
	}
}

type ApiErrorArgs<T> = ConstructorParameters<typeof ApiError<T>>[0]

export class ValidationError<T> extends ApiError<T> {
	constructor(opts: {
		internal?: boolean
		message?: string
		data?: T
		stack?: string | string[]
	}) {
		const statusCode = opts.internal ? '500' : '400'

		let msg: string
		if (opts.message) {
			msg = opts.message
		} else {
			msg = opts.internal
				? 'Response validation failed'
				: 'Request validation failed'
		}

		super({
			name: 'ValidationError',
			statusCode,
			message: msg,
			data: opts.data,
			stack: opts.stack,
		})
	}
}

export class UnknownError extends ApiError<unknown> {
	constructor(err: unknown) {
		super({
			name: 'UnknownError',
			statusCode: 500,
			message: 'An unknown error occurred',
			data: err,
		})
	}
}

export function H3ErrorToApiError<T = unknown>(
	err: H3Error<T>,
	overrides?: Partial<ApiErrorArgs<T>>
): ApiError<NoInfer<T>> {
	const opts = Object.assign(
		{
			name: err.name,
			statusCode: err.statusCode,
			message: err.message,
			data: err.data,
			stack: err.stack,
		},
		overrides
	)
	
	return new ApiError(opts)
}

export function H3ErrorToValidationError<T = unknown>(
	err: H3Error<T>,
	message: string
): ValidationError<NoInfer<T>> {
	return new ValidationError({
		internal: false,
		message: message ?? err.message,
		data: err.data,
		stack: err.stack,
	})
}

export function errorIsIntentional(err: unknown): err is H3Error | ApiError {
	return err instanceof ApiError || err instanceof H3Error
}
