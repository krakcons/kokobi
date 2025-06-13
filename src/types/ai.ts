import { z } from "zod";

export const DataSchema = z.object({
	name: z.string(),
	description: z.string(),
	value: z.string(),
});

export const DataOutputSchema = z.object({
	name: z.string(),
	value: z.string(),
	type: z.enum(["message", "session", "stat"]),
});

export const ScenarioSchema = z.object({
	character: z.object({
		name: z.string(),
		age: z.string().optional(),
		gender: z.string().optional(),
		sexuality: z.string().optional(),
		pronouns: z.string().optional(),
		ethnicity: z.string().optional(),
		country: z.string().optional(),
		education: z.string().optional(),
		location: z.string().optional(),
	}),
	user: z.string(),
	description: z.string(),
});

export const MessageSchema = z.object({
	id: z.string(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
});

export const AssistantInputSchema = z.object({
	model: z.enum(["gpt-4o", "gpt-4o-mini"]),
	scenario: ScenarioSchema,
	stats: DataSchema.array(),
	evaluations: DataSchema.extend({
		type: z.enum(["session", "message"]),
	}).array(),
});
export type AssistantInputType = z.infer<typeof AssistantInputSchema>;

export const AssistantResponseSchema = z.object({
	content: z.string(),
	stats: DataOutputSchema.array(),
	evaluations: DataOutputSchema.array(),
});
export type AssistantResponseType = z.infer<typeof AssistantResponseSchema>;
