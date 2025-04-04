import { useAppForm } from "@/components/ui/form";
import { CollectionFormSchema, CollectionFormType } from "@/types/collections";

export const CollectionForm = ({
	defaultValues,
	onSubmit,
}: {
	onSubmit: (value: CollectionFormType) => Promise<any>;
	defaultValues?: CollectionFormType;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: CollectionFormSchema,
		},
		defaultValues: {
			name: "",
			description: "",
			...defaultValues,
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-8"
			>
				<form.AppField
					name="name"
					children={(field) => <field.TextField label="Name" />}
				/>
				<form.AppField
					name="description"
					children={(field) => (
						<field.TextAreaField label="Description" />
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
