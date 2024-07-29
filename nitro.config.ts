import openAPIModule from './openapi'

export default defineNitroConfig({
	preset: 'bun',

	modules: [
		openAPIModule()
	],

	runtimeConfig: {
		openapiStrictness: 3
	}

	// apiDir: 'notapi',
	// apiBaseURL: '/notapi',
	// routesDir: 'notroutes',
	// scanDirs: ['scanthis']
})