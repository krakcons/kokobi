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
	onSubmit: (values: CourseFormType) => Promise<any>;
}) => {
	const t = useTranslations("CompletionStatuses");
	const form = useAppForm({
		validators: {
			onSubmit: CourseFormSchema,
		},
		defaultValues: {
			name: "",
			description: "",
			completionStatus: "either",
			...defaultValues,
		} as CourseFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form onSubmit={(e) => e.preventDefault()} className="space-y-8">
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
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
