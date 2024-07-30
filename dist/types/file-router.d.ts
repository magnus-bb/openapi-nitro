// prettier-ignore
export type MatchedMethodSuffix = "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace"
export type MatchedEnvSuffix = 'dev' | 'prod' | 'prerender'

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