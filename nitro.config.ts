import openAPIModule from './src'

export const title = 'TEST'
export const version = '9.9.9'
export const description = `This is the API documentation for ${title}`

export default defineNitroConfig({
	preset: 'bun',

	modules: [
		openAPIModule({
			info: {
				title,
				version,
				description,
			},
			servers: [
				{
					url: '/',
					description: 'Local Development Server',
					variables: {},
				},
			],
		})
	],

	runtimeConfig: {
		openapiStrictness: 3
	}

	// apiDir: 'notapi',
	// apiBaseURL: '/notapi',
	// routesDir: 'notroutes',
	// scanDirs: ['scanthis']
})