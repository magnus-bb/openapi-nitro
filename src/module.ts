import { defu } from 'defu'
import openAPINitroOptions from './config'
import type { NitroModule } from 'nitropack'
import type { ZodOpenApiObjectWithPaths} from './types'

// Pass in a partial OpenAPI spec to override the default spec
export default function(spec?: Pick<ZodOpenApiObjectWithPaths, 'info' | 'servers'>): NitroModule {
	return {
		name: 'openapi',
		setup: nitro => {
			nitro.options = defu(openAPINitroOptions(nitro), nitro.options)

			// TODO: type NitroRuntimeConfig so openapiStrictness is defined
			/**
			 * Can be 0 (off), 1, 2, or 3 
			 * Strictness determines how the OpenAPI module validates responses sent from the server.
			 * 0: No validation or logging
			 * 1: Log when intentional responses don't match any of the given OpenAPI response schemas
			 * 2: Send error to client when intentional responses don't match the OpenAPI schema for the given statusCode, and log if you send responses that don't match any given statusCode
			 * 3: Send errors to client when intentional responses don't match the OpenAPI schema for the given statusCode or if no schema is found for the given statusCode
			 */
			if (!nitro.options.runtimeConfig.openapiStrictness) {
				nitro.options.runtimeConfig.openapiStrictness = 1
			}

			if (spec) {
				if (!nitro.options.runtimeConfig.openapiSpec) {
					nitro.options.runtimeConfig.openapiSpec = spec
				} else {
					nitro.options.runtimeConfig.openapiSpec = defu(spec, nitro.options.runtimeConfig.openapiSpec)
				}
			}

			console.info('Running OpenAPI module with strictness set to', nitro.options.runtimeConfig.openapiStrictness)
		},
	}
}