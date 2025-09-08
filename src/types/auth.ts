import { z } from "zod";

export const LoginFormSchema = z.object({
	email: z.email().toLowerCase(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;
