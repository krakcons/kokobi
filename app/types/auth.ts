import { z } from "zod";

export const LoginFormSchema = z.object({
	email: z.string().email(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;

export const OTPFormSchema = z.object({
	code: z.string().min(6).max(6),
});
export type OTPFormType = z.infer<typeof OTPFormSchema>;
