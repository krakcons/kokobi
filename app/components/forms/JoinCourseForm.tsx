import { Module } from "@/types/module";
import { useAppForm } from "../ui/form";
import { locales, useTranslations } from "@/lib/locale";
import { JoinCourseFormSchema, JoinCourseFormType } from "@/types/learner";

export const JoinCourseForm = ({
	onSubmit,
	moduleOptions,
	defaultValues,
}: {
	onSubmit: (value: JoinCourseFormType) => Promise<any>;
	moduleOptions: Module[];
	defaultValues?: JoinCourseFormType;
}) => {
	const t = useTranslations("Form");
	const tJoin = useTranslations("Join");

	const form = useAppForm({
		onSubmit: ({ value }) => onSubmit(value),
		validators: {
			onSubmit: JoinCourseFormSchema,
		},
		defaultValues,
	});

	return (
		<form.AppForm>
			<form className="space-y-4">
				<form.AppField
					name="moduleId"
					children={(field) => (
						<field.SelectField
							label={tJoin.language}
							options={moduleOptions.map((m) => ({
								label: locales.find(
									(l) => l.value === m.language,
								)!.label,
								value: m.id,
							}))}
						/>
					)}
				/>
				<form.AppField
					name="firstName"
					children={(field) => (
						<field.TextField
							label={t.learner.firstName}
							disabled={!!defaultValues?.firstName}
						/>
					)}
				/>
				<form.AppField
					name="lastName"
					children={(field) => (
						<field.TextField
							label={t.learner.lastName}
							disabled={!!defaultValues?.lastName}
						/>
					)}
				/>
				<form.AppField
					name="email"
					children={(field) => (
						<field.TextField
							label={t.learner.email}
							disabled={!!defaultValues?.email}
						/>
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
