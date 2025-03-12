import { useAppForm } from "@/components/ui/form";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Message, useChat } from "@ai-sdk/react";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { AssistantResponseType } from "@/api/handlers/ai";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/$locale/ai")({
	component: RouteComponent,
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
	const { append, messages } = useChat({
		api: "/api/ai/chat",
	});
	const form = useAppForm({
		defaultValues: {
			content: "",
		},
		onSubmit: ({ value: { content }, formApi }) => {
			append({
				role: "user",
				content,
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

				return (
					<div key={m.id} className="self-start flex-col flex gap-2">
						<p>{json?.content}</p>
						{json?.rapportDegree && (
							<div className="border px-3 py-2 rounded flex flex-col gap-2">
								<p>Rapport ({json?.rapportDegree}%)</p>
								<div className="rounded-full h-3 w-full relative bg-muted overflow-hidden">
									<div
										className={cn(
											"h-full",
											json.rapportDegree <= 30 &&
												"bg-red-400",
											json.rapportDegree > 30 &&
												json.rapportDegree <= 70 &&
												"bg-amber-400",
											json.rapportDegree > 70 &&
												"bg-green-400",
										)}
										style={{
											width: `${json.rapportDegree}%`,
										}}
									/>
								</div>
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
				</form>
			</form.AppForm>
		</div>
	);
}
