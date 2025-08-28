import {
	type CourseFormType,
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
	const t = useTranslations("CourseForm");
	const tStatus = useTranslations("CompletionStatuses");
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
					{(field) => <field.TextField label={t.name} />}
				</form.AppField>
				<form.AppField name="description">
					{(field) => <field.TextAreaField label={t.description} />}
				</form.AppField>
				<form.AppField name="completionStatus">
					{(field) => (
						<field.SelectField
							label={t.completionStatus.label}
							description={t.completionStatus.description}
							options={completionStatuses.map((s) => ({
								value: s,
								label: tStatus[s],
							}))}
						/>
					)}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
