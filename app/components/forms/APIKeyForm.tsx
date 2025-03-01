import { Button } from "@/components/ui/button";
import { APIKeyFormType, APIKeyFormSchema } from "@/types/keys";
import { useAppForm } from "../ui/form";

export const APIKeyForm = ({
	onSubmit,
}: {
	onSubmit: (value: APIKeyFormType) => void;
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
		<form
			onSubmit={(e) => {
				e.stopPropagation();
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-6"
		>
			<form.AppField name="name">
				{(field) => <field.TextField label="Name" />}
			</form.AppField>
			<Button type="submit">Create Key</Button>
		</form>
	);
};
