import { useAppForm } from "@/components/ui/form";
import { useTranslations } from "@/lib/locale";
import { roles, type Role } from "@/types/organization";

type MemberFormType = {
	email: string;
	role: Role;
};

export const MemberForm = ({
	defaultValues,
	onSubmit,
	disableEmail,
}: {
	defaultValues?: MemberFormType;
	onSubmit: ({ value }: { value: MemberFormType }) => Promise<any>;
	disableEmail?: boolean;
}) => {
	const t = useTranslations("MemberForm");
	const tRoles = useTranslations("Role");
	const form = useAppForm({
		defaultValues: {
			email: defaultValues?.email ?? "",
			role: "member",
		} as { email: string; role: Role },
		onSubmit: async ({ value }) => {
			await onSubmit({
				value,
			});
		},
	});

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault();
				}}
				className="flex flex-col gap-4"
			>
				<form.AppField
					name="email"
					children={(field) => (
						<field.TextField
							label={t.email}
							disabled={disableEmail}
						/>
					)}
				/>
				<form.AppField
					name="role"
					children={(field) => (
						<field.SelectField
							label={t.role}
							options={roles.map((role) => ({
								label: tRoles[role as Role],
								value: role,
							}))}
						/>
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
