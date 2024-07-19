import openAPIModule from './openapi'

export default defineNitroConfig({
	preset: 'bun',

	modules: [
		openAPIModule()
	],

	// apiDir: 'notapi',
	// apiBaseURL: '/notapi',
	// routesDir: 'notroutes',
	// scanDirs: ['scanthis']
})