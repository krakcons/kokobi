import { APIKeyFormType, APIKeyFormSchema } from "@/types/keys";
import { useAppForm } from "../ui/form";
import { useTranslations } from "@/lib/locale";

export const APIKeyForm = ({
	onSubmit,
}: {
	onSubmit: (value: APIKeyFormType) => Promise<any>;
}) => {
	const t = useTranslations("APIKeyForm");
	const form = useAppForm({
		validators: {
			onSubmit: APIKeyFormSchema,
		},
		defaultValues: {
			name: "",
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-6"
			>
				<form.AppField name="name">
					{(field) => <field.TextField label={t.name} />}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
