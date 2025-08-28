import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { useAppForm } from "../ui/form";
import { TeamUsersFormSchema, type TeamUsersFormType } from "@/types/team";
import { useTranslations } from "@/lib/locale";

export const TeamUsersForm = ({
	onSubmit,
}: {
	onSubmit: (values: TeamUsersFormType) => Promise<any>;
}) => {
	const t = useTranslations("MembersForm");
	const tRole = useTranslations("TeamRole");
	const form = useAppForm({
		defaultValues: {
			users: [
				{
					email: "",
					role: "member",
				},
			],
		} as TeamUsersFormType,
		validators: {
			onSubmit: TeamUsersFormSchema,
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-2 w-full"
			>
				<form.Field name="users" mode="array">
					{(arrayField) => (
						<>
							{arrayField.state.value.map((_, index) => (
								<div
									key={index}
									className="flex items-start gap-2 flex-1 w-full"
								>
									<form.AppField
										name={`users[${index}].email`}
									>
										{(subField) => (
											<div className="flex-1">
												<subField.TextField
													label=""
													autoComplete="email"
												/>
											</div>
										)}
									</form.AppField>
									<form.AppField
										name={`users[${index}].role`}
									>
										{(subField) => (
											<subField.SelectField
												label=""
												options={[
													{
														value: "owner",
														label: tRole.owner,
													},
													{
														value: "member",
														label: tRole.member,
													},
												]}
											/>
										)}
									</form.AppField>
									<Button
										type="button"
										onClick={() => {
											arrayField.removeValue(index);
										}}
										variant="outline"
										size="icon"
									>
										<Trash size={18} />
									</Button>
								</div>
							))}
							<div className="flex justify-between">
								<Button
									type="button"
									onClick={() => {
										arrayField.pushValue({
											email: "",
											role: "member",
										});
									}}
									variant="outline"
								>
									<Plus />
									{t.add}
								</Button>
								<form.SubmitButton />
							</div>
						</>
					)}
				</form.Field>
			</form>
		</form.AppForm>
	);
};
