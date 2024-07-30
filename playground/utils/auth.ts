import { z } from "zod"

export const authContext = z.object({
	user: z.string()
})

export interface AuthContext extends z.infer<typeof authContext> {}

export function validateAuthContext(data: unknown): data is AuthContext {
	return authContext.safeParse(data).success
}
