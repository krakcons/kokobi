import { Title, useAppForm } from "../ui/form";
import { InferResponseType } from "hono";
import { client } from "@/lib/api";
import { z } from "zod";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export const CoursesFormSchema = z.object({
	ids: z.string().array().min(1),
});
export type CoursesFormType = z.infer<typeof CoursesFormSchema>;

export const CoursesForm = ({
	onSubmit,
	courses,
}: {
	onSubmit: (value: { ids: string[] }) => Promise<any>;
	courses: InferResponseType<typeof client.api.courses.$get>;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: CoursesFormSchema,
		},
		defaultValues: {
			ids: [],
		} as CoursesFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-6"
			>
				<form.Field name="ids" mode="array">
					{(field) =>
						courses.map((course) => (
							<Label key={course.id}>
								<div className="flex flex-row items-center gap-2">
									<Checkbox
										value={course.id}
										onCheckedChange={() => {
											const index =
												field.state.value.indexOf(
													course.id,
												);
											if (index === -1) {
												field.pushValue(course.id);
											} else {
												field.removeValue(index);
											}
										}}
									/>
									<Title label={course.name} />
								</div>
							</Label>
						))
					}
				</form.Field>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
