import { z } from "zod";

export const ErrorSchema = z.object({
	title: z.string(),
	message: z.string(),
	tryAgain: z.boolean().optional(),
});
export type ErrorType = z.infer<typeof ErrorSchema>;

export const throwServerError = (error: ErrorType) => {
	throw new Error(JSON.stringify(error));
};
