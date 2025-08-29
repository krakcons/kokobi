import { Title, useAppForm } from "../ui/form";
import { z } from "zod";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import type { Course } from "@/types/course";

export const CoursesFormSchema = z.object({
	courseIds: z.string().array().min(1),
});
export type CoursesFormType = z.infer<typeof CoursesFormSchema>;

export const CoursesForm = ({
	onSubmit,
	courses,
}: {
	onSubmit: (value: CoursesFormType) => Promise<any>;
	courses: Course[];
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: CoursesFormSchema,
		},
		defaultValues: {
			courseIds: [],
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
				<form.Field name="courseIds" mode="array">
					{(field) =>
						courses.map((course) => (
							<Label key={course.id}>
								<div className="flex flex-row items-center gap-2">
									<Checkbox
										id={course.id}
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
									<Title
										htmlFor={course.id}
										label={course.name}
									/>
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
