import { useAppForm } from "../ui/form";
import { UserFormSchema, UserFormType } from "@/server/handlers/users";

export const UserForm = ({
	defaultValues,
	onSubmit,
}: {
	defaultValues?: UserFormType;
	onSubmit: (values: UserFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: UserFormSchema,
		},
		defaultValues: {
			name: "",
			description: "",
			completionStatus: "either",
			...defaultValues,
		} as UserFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form onSubmit={(e) => e.preventDefault()} className="space-y-8">
				<form.AppField name="firstName">
					{(field) => <field.TextField label="First Name" />}
				</form.AppField>
				<form.AppField name="lastName">
					{(field) => <field.TextField label="Last Name" />}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
