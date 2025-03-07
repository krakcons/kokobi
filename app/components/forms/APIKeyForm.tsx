import { APIKeyFormType, APIKeyFormSchema } from "@/types/keys";
import { useAppForm } from "../ui/form";

export const APIKeyForm = ({
	onSubmit,
}: {
	onSubmit: (value: APIKeyFormType) => Promise<void>;
}) => {
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
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-6"
			>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" />}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
