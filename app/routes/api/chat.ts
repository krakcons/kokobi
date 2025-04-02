import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/chat")({
	GET: ({ request, params }) => {
		return new Response();
		//const { scenario, model, stats, evaluations } = c.req.valid("json");
		//const messages = (await c.req.json()).messages;
		//
		//const dataStream = createDataStream({
		//	execute: async (writer) => {
		//		const system = [
		//			// INTRO
		//			`You are a specific CHARACTER ${JSON.stringify(scenario.character)}.`,
		//			// ACTION
		//			`You should respond as if you were the CHARACTER.`,
		//			// SCENARIO
		//			`You should respond in context of this specific scenario ${JSON.stringify(scenario.description)}`,
		//			// USER
		//			`You should respond as if you were talking to the user: ${JSON.stringify(scenario.user)}`,
		//			// STATS
		//			`You should maintain personal stats here: ${JSON.stringify(stats)}. Use previous messages to see where your stats are and adjust them according to new messages (ex: Mood could be a stat and if the user says something to offend you, you can lower mood)`,
		//			// EVALUATIONS
		//			`Separately from your character you should analyze the incoming messages: ${JSON.stringify(evaluations)}. (ex. Politness, if the user says something rude you can evaluate their politness low)`,
		//		];
		//		const result = streamText({
		//			model: openai(model),
		//			system: system.join(" "),
		//			experimental_output: Output.object({
		//				schema: AssistantResponseSchema,
		//			}),
		//			messages,
		//		});
		//		result.mergeIntoDataStream(writer);
		//	},
		//	onError: (error) => {
		//		return error instanceof Error ? error.message : String(error);
		//	},
		//});
		//
		//c.header("X-Vercel-AI-Data-Stream", "v1");
		//c.header("Content-Type", "text/plain; charset=utf-8");
		//
		//return stream(c, (stream) =>
		//	stream.pipe(dataStream.pipeThrough(new TextEncoderStream())),
		//);
	},
});
