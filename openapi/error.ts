import { type H3Event, H3Error } from 'h3'
import type { StatusCode} from './types'
import { defineNitroErrorHandler } from '#imports'

export default defineNitroErrorHandler((error: Error, event: H3Event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

	// const err = error.cause ?? error

	// if (!import.meta.dev && typeof err === 'object' && 'stack' in err) {
	// 	delete err.stack
	// }

	return send(event, JSON.stringify(err))
})

interface ApiErrorArgs<T> {
	name: string
	statusCode: StatusCode | number
	message: string
	data?: T
	stack?: string | string[]
}

export class ApiError<T = unknown> {
	// @ts-ignore
	readonly name: string
	readonly statusCode: StatusCode
	// @ts-ignore
	readonly message: string 
	readonly data?: T
	readonly stack?: string | string[]

	constructor(opts: ApiErrorArgs<T>) {
		Object.assign(this, opts)
		this.statusCode = opts.statusCode.toString() as StatusCode
	}
}

export class ValidationError<T> extends ApiError<T> {
	constructor(opts: { internal?: boolean; message?: string, data?: T; stack?: string | string[] }) {
		
		const statusCode = opts.internal ? '500' : '400'

		let msg: string
		if (opts.message) {
			msg = opts.message
		} else {
			msg = opts.internal ? 'Response validation failed' : 'Request validation failed'
		}
		
		super({ name: 'ValidationError', statusCode, message: msg, data: opts.data, stack: opts.stack })
	}
}

export class UnknownError extends ApiError<unknown> {
	constructor(err: unknown) {
		super({ name: 'UnknownError', statusCode: 500, message: 'An unknown error occurred', data: err })
	}
}

export function H3ErrorToApiError<T = unknown>(err: H3Error<T>, overrides?: Partial<ApiErrorArgs<T>>): ApiError<NoInfer<T>> {
	const opts = Object.assign({
		name: err.name,
		statusCode: err.statusCode,
		message: err.message,
		data: err.data,
		stack: err.stack
	}, overrides)

	return new ApiError(opts)
}

export function H3ErrorToValidationError<T = unknown>(err: H3Error<T>, message: string): ValidationError<NoInfer<T>> {
	return new ValidationError({ internal: false, message: message ?? err.message, data: err.data, stack: err.stack })
}

export function errorIsIntentional(err: unknown): err is H3Error | ApiError {
	return err instanceof ApiError || err instanceof H3Error
}