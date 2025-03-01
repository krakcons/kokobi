import { Button } from "@/components/ui/button";
import {
	CourseFormType,
	CourseFormSchema,
	completionStatuses,
} from "@/types/course";
import { useAppForm } from "../ui/form";
import { useTranslations } from "@/lib/locale";

export const CourseForm = ({
	defaultValues,
	onSubmit,
}: {
	defaultValues?: CourseFormType;
	onSubmit: (values: CourseFormType) => void;
}) => {
	const t = useTranslations("CompletionStatuses");
	const form = useAppForm({
		validators: {
			onSubmit: CourseFormSchema,
		},
		defaultValues: {
			name: "",
			description: "",
			completionStatus: "passed",
			...defaultValues,
		} as CourseFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			<form.AppField name="name">
				{(field) => <field.TextField label="Name" />}
			</form.AppField>
			<form.AppField name="description">
				{(field) => <field.TextAreaField label="Description" />}
			</form.AppField>
			<form.AppField name="completionStatus">
				{(field) => (
					<field.SelectField
						label="Completion Status"
						description="When the course is considered completed. Certificate is issued and
			course is locked."
						options={completionStatuses.map((s) => ({
							value: s,
							// @ts-ignore
							label: t[s],
						}))}
					/>
				)}
			</form.AppField>
			<Button type="submit">Submit</Button>
		</form>
	);
};
