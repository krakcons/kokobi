import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useAppForm } from "../ui/form";
import { z } from "zod";

export const TeamsFormSchema = z.object({
	teamIds: z.string().array(),
});
export type TeamsFormType = z.infer<typeof TeamsFormSchema>;
export const TeamsForm = ({
	onSubmit,
}: {
	onSubmit: (values: TeamsFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: TeamsFormSchema,
		},
		defaultValues: {
			teamIds: [""],
		} as TeamsFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-2 w-full"
			>
				<form.Field name="teamIds" mode="array">
					{(arrayField) => (
						<>
							{arrayField.state.value.map((_, index) => (
								<div
									key={index}
									className="flex items-start gap-2 flex-1 w-full"
								>
									<form.AppField name={`teamIds[${index}]`}>
										{(subField) => (
											<div className="flex-1">
												<subField.TextField label="" />
											</div>
										)}
									</form.AppField>
									<Button
										type="button"
										onClick={() => {
											arrayField.removeValue(index);
										}}
										variant="outline"
										size="icon"
									>
										<Trash size={18} />
									</Button>
								</div>
							))}
							<div className="flex justify-between">
								<Button
									type="button"
									onClick={() => {
										arrayField.pushValue("");
									}}
									variant="outline"
								>
									Add Team
								</Button>
								<form.SubmitButton />
							</div>
						</>
					)}
				</form.Field>
			</form>
		</form.AppForm>
	);
};
