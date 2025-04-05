import { Button } from "@/components/ui/button";
import { locales, useLocale } from "@/lib/locale";
import { Trash } from "lucide-react";
import { useAppForm } from "../ui/form";
import { LearnersFormType, LearnersFormSchema } from "@/types/learner";

export const LearnersForm = ({
	onSubmit,
}: {
	onSubmit: (values: LearnersFormType) => Promise<any>;
}) => {
	const locale = useLocale();
	const form = useAppForm({
		validators: {
			onSubmit: LearnersFormSchema,
		},
		defaultValues: {
			learners: [
				{
					email: "",
					sendEmail: true,
					id: undefined,
					inviteLanguage: "en",
				},
			],
		} as LearnersFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form onSubmit={(e) => e.preventDefault()} className="space-y-4">
				<div className="flex w-full gap-2">
					<p className="flex-1 text-sm leading-none font-medium">
						Email
					</p>
					<p className="w-[100px] text-sm leading-none font-medium">
						Language
					</p>
					<div className="w-9"></div>
				</div>
				<hr />
				<form.Field name="learners" mode="array">
					{(arrayField) => (
						<>
							{arrayField.state.value.map((field, index) => (
								<div
									key={field.id}
									className="flex items-start gap-2"
								>
									<form.AppField
										name={`learners[${index}].email`}
									>
										{(subField) => (
											<div className="flex-[2]">
												<subField.TextField label="" />
											</div>
										)}
									</form.AppField>
									<form.AppField
										name={`learners[${index}].inviteLanguage`}
									>
										{(subField) => (
											<div className="min-w-[100px] w-[100px]">
												<subField.SelectField
													label=""
													options={locales}
												/>
											</div>
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
											firstName: "",
											lastName: "",
											sendEmail: true,
											inviteLanguage: locale,
											id: undefined,
										});
									}}
									variant="outline"
								>
									Add Learner
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
