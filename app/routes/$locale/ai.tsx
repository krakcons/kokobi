import { useAppForm } from "@/components/ui/form";
import { createFileRoute } from "@tanstack/react-router";
import { Message, useChat } from "@ai-sdk/react";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import {
	AssistantInputSchema,
	AssistantInputType,
	AssistantResponseSchema,
	AssistantResponseType,
	MessageSchema,
} from "@/types/ai";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Filter, Sliders } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { z } from "zod";
import { streamText, Output, coreMessageSchema } from "ai";
import { openai } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/$locale/ai")({
	component: RouteComponent,
	validateSearch: z.object({
		options: AssistantInputSchema.optional(),
	}),
});

const parseAssistantMessage = (
	message: Message,
): AssistantResponseType | undefined => {
	const parsedMessage = parsePartialJson(message.content);

	const { value, state } = parsedMessage as {
		value: AssistantResponseType | null;
		state: string;
	};

	if (value && ["repaired-parse", "successful-parse"].includes(state)) {
		return value;
	}

	return undefined;
};

const genAIResponse = createServerFn({ method: "POST", response: "raw" })
	.validator(
		AssistantInputSchema.extend({ messages: coreMessageSchema.array() }),
	)
	.handler(
		async ({ data: { model, scenario, messages, stats, evaluations } }) => {
			const system = [
				// INTRO
				`You are a specific CHARACTER ${JSON.stringify(scenario.character)}.`,
				// ACTION
				`You should respond as if you were the CHARACTER.`,
				// SCENARIO
				`You should respond in context of this specific scenario ${JSON.stringify(scenario.description)}`,
				// USER
				`You should respond as if you were talking to the user: ${JSON.stringify(scenario.user)}`,
				// STATS
				`You should maintain personal stats here: ${JSON.stringify(stats)}. Use previous messages to see where your stats are and adjust them according to new messages (ex: Mood could be a stat and if the user says something to offend you, you can lower mood)`,
				// EVALUATIONS
				`Separately from your character you should analyze the incoming messages: ${JSON.stringify(evaluations)}. (ex. Politness, if the user says something rude you can evaluate their politness low)`,
			];
			try {
				const result = streamText({
					model: openai(model),
					system: system.join(" "),
					experimental_output: Output.object({
						schema: AssistantResponseSchema,
					}),
					messages,
				});

				return result.toDataStreamResponse();
			} catch (error) {
				console.error("Error in genAIResponse:", error);
				if (
					error instanceof Error &&
					error.message.includes("rate limit")
				) {
					throw new Error(
						"Rate limit exceeded. Please try again in a moment.",
					);
				}
				throw new Error(
					error instanceof Error
						? error.message
						: "Failed to get AI response",
				);
			}
		},
	);

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { options } = Route.useSearch();
	const { append, messages } = useChat({
		initialMessages: [],
		fetch: (_, options) => {
			const body = JSON.parse(options!.body! as string);
			console.log("BODY", body);
			console.log("MESSAGES", body.messages);
			return genAIResponse({
				data: body,
			});
		},
	});
	const form = useAppForm({
		defaultValues: {
			content: "",
			...(options ?? {
				model: "gpt-4o-mini",
				scenario: {
					character: {
						name: "Sara",
						age: "52",
						gender: "Woman",
						pronouns: "She/Her",
						sexuality: "Hetero",
						education: "Highschool",
						country: "Canada",
						location: "Toronto",
						ethnicity: "White",
					},
					user: "A call center user picking up the phone",
					description:
						"Character is calling the Toronto Community Crisis Line. They are experiencing a mental health crisis. They are scattered in their conversation and would really like to talk to someone in person. Only provide an address and unit number when asked.",
				},
				evaluations: [
					{
						name: "Politeness",
						description:
							"Measure of how polite the user message is",
						value: "1-100: 1 is very rude and 100 being super nice.",
					},
					{
						name: "Address",
						description:
							"Measure whether the user asked for the address",
						value: "1-100: 1 is no address and 100 is a full address is given",
					},
					{
						name: "Age",
						description:
							"Did the user ask about the age of the caller",
						value: "1-100: 1 is not asking and 100 is asking",
					},
				],
				stats: [
					{
						name: "Rapport",
						description:
							"The rapport built through communicating with the user",
						value: "1-100: Start at 20",
					},
				],
			}),
		} as AssistantInputType & { content: string },
		validators: {
			onSubmit: AssistantInputSchema.extend({
				content: z.string().min(1),
			}),
		},
		onSubmit: ({ value: { content, ...body }, formApi }) => {
			append(
				{
					role: "user",
					content,
				},
				{
					body,
				},
			);
			navigate({
				replace: true,
				search: {
					options: body,
				},
			});
			formApi.reset();
		},
	});

	return (
		<div className="max-w-2xl mx-auto w-full flex flex-col min-h-[100svh] justify-end p-4 gap-8">
			{messages.map((m) => {
				console.log("MESSAGE", m);
				if (m.role === "user") {
					return (
						<div
							key={m.id}
							className="self-end bg-blue-500 text-white px-3 py-2 rounded max-w-[70%]"
						>
							{m.content}
						</div>
					);
				}

				const json = parseAssistantMessage(m);
				if (!json) return null;

				return (
					<div key={m.id} className="self-start flex-col flex gap-2">
						<p>{json?.content}</p>
						{(json.stats || json.evaluations) && (
							<div className="border px-3 py-2 rounded flex flex-col gap-2">
								{json.stats &&
									json.stats.map((s) => (
										<p key={s.name}>
											{s.name} ({s.value})
										</p>
									))}
								{json.evaluations &&
									json.evaluations.map((s) => (
										<p key={s.name}>
											{s.name} ({s.value})
										</p>
									))}
							</div>
						)}
					</div>
				);
			})}
			<form.AppForm>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-row justify-between gap-2"
				>
					<div className="flex-1">
						<form.AppField
							name="content"
							children={(field) => (
								<field.TextField
									placeholder="Enter your response"
									label=""
									className="h-14"
								/>
							)}
						/>
						<button type="submit" className="hidden" />
					</div>
					<Dialog>
						<DialogTrigger
							className={buttonVariants({
								variant: "secondary",
								className: "h-14",
							})}
							aria-label="Customize"
						>
							<Sliders />
							<p className="hidden sm:block">Customize</p>
						</DialogTrigger>
						<DialogContent className="flex flex-col gap-4 py-4">
							<DialogHeader>
								<DialogTitle>Customize Scenario</DialogTitle>
								<DialogDescription>
									Customize the scenario for the AI, including
									the persona, evaluations and stats.
								</DialogDescription>
							</DialogHeader>
							<form.AppField
								name="model"
								children={(field) => (
									<field.SelectField
										label="Model"
										options={[
											{
												label: "gpt-4o-mini",
												value: "gpt-4o-mini",
											},
											{
												label: "gpt-4o",
												value: "gpt-4o",
											},
										]}
									/>
								)}
							/>
							<h3>Scenario</h3>
							<form.AppField
								name="scenario.description"
								children={(field) => (
									<field.TextField
										label="Description"
										description="Describe the scenario"
									/>
								)}
							/>
							<form.AppField
								name="scenario.user"
								children={(field) => (
									<field.TextField
										label="User"
										description="Describe the users role in the scenario"
									/>
								)}
							/>
							<h3>Character</h3>
							<form.AppField
								name="scenario.character.name"
								children={(field) => (
									<field.TextField label="Name" />
								)}
							/>
							<form.AppField
								name="scenario.character.age"
								children={(field) => (
									<field.TextField
										type="number"
										label="Age"
										optional
									/>
								)}
							/>
							<form.AppField
								name="scenario.character.gender"
								children={(field) => (
									<field.TextField label="Gender" optional />
								)}
							/>
							<form.AppField
								name="scenario.character.pronouns"
								children={(field) => (
									<field.TextField
										label="Pronouns"
										optional
									/>
								)}
							/>
							<form.AppField
								name="scenario.character.sexuality"
								children={(field) => (
									<field.TextField
										label="Sexuality"
										optional
									/>
								)}
							/>
							<form.AppField
								name="scenario.character.country"
								children={(field) => (
									<field.TextField label="Country" optional />
								)}
							/>
							<form.AppField
								name="scenario.character.location"
								children={(field) => (
									<field.TextField
										label="Location"
										optional
									/>
								)}
							/>
							<form.AppField
								name="scenario.character.education"
								children={(field) => (
									<field.TextField
										label="Education"
										optional
									/>
								)}
							/>
							<form.AppField
								name="scenario.character.ethnicity"
								children={(field) => (
									<field.TextField
										label="Ethnicity"
										optional
									/>
								)}
							/>
							<h3>Stats</h3>
							<form.Field
								name="stats"
								mode="array"
								children={(field) => (
									<div className="flex flex-col gap-4">
										{field.state.value.map((_, i) => (
											<div
												key={i}
												className="flex flex-col gap-4 border p-4 rounded"
											>
												<form.AppField
													name={`stats[${i}].name`}
													children={(subField) => (
														<subField.TextField
															label="Name"
															description="Name the stat"
														/>
													)}
												/>
												<form.AppField
													name={`stats[${i}].description`}
													children={(subField) => (
														<subField.TextField
															label="Description"
															description="Describe the stat"
														/>
													)}
												/>
												<form.AppField
													name={`stats[${i}].value`}
													children={(subField) => (
														<subField.TextField
															label="Value"
															description="Describe the value shown for the stat"
														/>
													)}
												/>
											</div>
										))}
										<Button
											onClick={(e) => {
												e.preventDefault();
												field.pushValue({
													name: "",
													description: "",
													value: "",
												});
											}}
										>
											Add
										</Button>
									</div>
								)}
							/>
							<h3>Evaluations</h3>
							<form.Field
								name="evaluations"
								mode="array"
								children={(field) => (
									<div className="flex flex-col gap-4">
										{field.state.value.map((_, i) => (
											<div
												className="flex flex-col gap-4 border p-4 rounded"
												key={i}
											>
												<form.AppField
													name={`evaluations[${i}].name`}
													children={(subField) => (
														<subField.TextField
															label="Name"
															description="Name the evaluation"
														/>
													)}
												/>
												<form.AppField
													name={`evaluations[${i}].description`}
													children={(subField) => (
														<subField.TextField
															label="Description"
															description="Describe the evaluation"
														/>
													)}
												/>
												<form.AppField
													name={`evaluations[${i}].value`}
													children={(subField) => (
														<subField.TextField
															label="Value"
															description="Describe the value shown for the evaluation"
														/>
													)}
												/>
											</div>
										))}
										<Button
											onClick={(e) => {
												e.preventDefault();
												field.pushValue({
													name: "",
													description: "",
													value: "",
												});
											}}
										>
											Add
										</Button>
									</div>
								)}
							/>
						</DialogContent>
					</Dialog>
				</form>
			</form.AppForm>
		</div>
	);
}
