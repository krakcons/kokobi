import { useAppForm } from "@/components/ui/form";
import { useTranslations } from "@/lib/locale";
import { CollectionFormSchema, CollectionFormType } from "@/types/collections";

export const CollectionForm = ({
	defaultValues,
	onSubmit,
}: {
	onSubmit: (value: CollectionFormType) => Promise<any>;
	defaultValues?: CollectionFormType;
}) => {
	const t = useTranslations("CollectionForm");
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
					children={(field) => <field.TextField label={t.name} />}
				/>
				<form.AppField
					name="description"
					children={(field) => (
						<field.TextAreaField label={t.description} />
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
