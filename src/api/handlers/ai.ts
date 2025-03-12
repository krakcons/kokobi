import { Hono } from "hono";
import { openai } from "@ai-sdk/openai";
import { streamText, coreMessageSchema, Output, createDataStream } from "ai";
import { stream } from "hono/streaming";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const PromptSchema = z.object({
	character: z.object({
		age: z.number(),
		name: z.string(),
		gender: z.string(),
		sexuality: z.string(),
		pronouns: z.string(),
		ethnicity: z.string(),
		country: z.string(),
		education: z.string(),
		location: z.string(),
	}),
	scenario: z.string(),
	context: z
		.object({
			name: z.string(),
			description: z.string(),
		})
		.array(),
	evaluations: z
		.object({
			name: z.string(),
			description: z.string(),
		})
		.array(),
});

const prompt = {
	role: "You are the 'Character Bot' in a simulated conversation.",
	instructions: [
		"You will take on the role of the 'Character' as described in the provided 'Character description'.",
		"You will behave within the context of the 'Scenario description', assuming the role and circumstances defined for the Character.",
		"You will assume the state and situation defined in 'Character scenario context'.",
		"You will modulate your behavior dynamically based on 'Character interaction parameters'.",
		"You must distort expressions of facts about yourself and your situation proportionate to the 'Degree Of' your 'Dishonesty'.",
		"You must develop rapport with the PUT in a manner consistent with the 'Degree Of' 'Rapport building' ease.",
		"You must decrease rapport with the PUT in a manner consistent with the 'Degree Of' 'Rapport loss' ease.",
		"Your willingness to share information will increase as rapport with the PUT increases.",
		"Your truthfulness will increase as rapport with the PUT increases.",
		"Respond to the PUT's latest statement in the ongoing 'Conversation to-date'.",
	],
	input_data: {
		character_description: { Age: 53, Name: "Pat" },
		scenario_description: {
			Character: {
				"Role in the scenario":
					"A person calling a hotline that provides referrals...",

				"Lead up to the scenario": [
					"Called the hotline where PUT works.",
					"Understood the PUT’s greeting...",
				],
			},
			PUT: {
				"Role in the scenario":
					"An agent that works at the hotline answering calls...",
				"Lead up to the scenario": [
					"Answered the Character’s call...",
					"Introduced themselves by name...",
				],
			},
		},
		character_scenario_context: {
			"Recent events": "Has recently been in a car accident...",
			"Mental state": "Is in a full-blown mental health crisis...",
			Dangers: [
				"Not a danger to themselves.",
				"Not a danger to others.",
				"Not armed.",
			],
		},
		character_interaction_parameters: {
			"Rapport building": { "Degree Of": 20 },
			"Rapport loss": { "Degree Of": 100 },
			Dishonesty: { "Degree Of": 50 },
		},
		conversation_to_date: [],
	},
};

export const AssistantInputSchema = z.object({
	messages: coreMessageSchema.array(),
});
export type AssistantInputType = z.infer<typeof AssistantInputSchema>;

export const AssistantResponseSchema = z.object({
	content: z.string(),
	rapportDegree: z.number(),
});
export type AssistantResponseType = z.infer<typeof AssistantResponseSchema>;

const model = openai("gpt-4o-mini");

export const aiHandler = new Hono().post(
	"/chat",
	zValidator("json", AssistantInputSchema),
	async (c) => {
		const { messages } = c.req.valid("json");
		const dataStream = createDataStream({
			execute: async (writer) => {
				const result = streamText({
					model,
					system: JSON.stringify(prompt),
					experimental_output: Output.object({
						schema: AssistantResponseSchema,
					}),
					messages,
				});
				result.mergeIntoDataStream(writer);
			},
			onError: (error) => {
				return error instanceof Error ? error.message : String(error);
			},
		});

		c.header("X-Vercel-AI-Data-Stream", "v1");
		c.header("Content-Type", "text/plain; charset=utf-8");

		return stream(c, (stream) =>
			stream.pipe(dataStream.pipeThrough(new TextEncoderStream())),
		);
	},
);
