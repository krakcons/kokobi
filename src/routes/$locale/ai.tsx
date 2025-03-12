import { useAppForm } from "@/components/ui/form";
import { createFileRoute } from "@tanstack/react-router";
import { Message, useChat } from "@ai-sdk/react";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import {
	AssistantInputSchema,
	AssistantInputType,
	AssistantResponseType,
} from "@/types/ai";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { env } from "@/env";

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

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { options } = Route.useSearch();
	const { append, messages } = useChat({
		api: env.VITE_API_URL + "/api/ai/chat",
	});
	const form = useAppForm({
		defaultValues: {
			content: "",
			...(options ?? {
				model: "gpt-4o-mini",
				scenario: {
					character: {
						name: "Marge",
						age: "52",
						education: "Highschool",
						country: "Canada",
						gender: "Woman",
						sexuality: "Hetero",
						location: "Hamilton",
						pronouns: "She/Her",
						ethnicity: "White",
					},
					user: "A call center employee picking up the phone",
					description:
						"Character is calling the user due to having a panic attack while having a panic attack.",
				},
				evaluations: [
					{
						name: "Politeness",
						description:
							"Measure of how polite the user message is",
						value: "1-100: 1 is very rude and 100 being super nice.",
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
				search: {
					options: body,
				},
			});
			formApi.reset();
		},
	});

	return (
		<div className="max-w-xl mx-auto w-full flex flex-col min-h-[100svh] justify-end py-8 px-4 gap-8">
			{messages.map((m) => {
				if (m.role === "user") {
					return (
						<div
							key={m.id}
							className="self-end bg-muted px-3 py-2 rounded max-w-[70%]"
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
					</div>
				);
			})}
			<form.AppForm>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
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
					<Collapsible className="group/collapsible">
						<CollapsibleTrigger className="flex gap-2">
							<>
								Customize
								<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
							</>
						</CollapsibleTrigger>
						<CollapsibleContent className="flex flex-col gap-4 py-4">
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
						</CollapsibleContent>
					</Collapsible>
				</form>
			</form.AppForm>
		</div>
	);
}
