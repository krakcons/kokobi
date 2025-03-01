import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Locale, locales, useLocale } from "@/lib/locale";
import { CreateLearnerSchema } from "@/types/learner";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Trash } from "lucide-react";
import { FieldError } from "../ui/field-error";

export const LearnersFormSchema = z.object({
	learners: z.array(CreateLearnerSchema).min(1),
});
export type LearnersForm = z.infer<typeof LearnersFormSchema>;

export const LearnersForm = ({
	onSubmit,
}: {
	onSubmit: (values: LearnersForm) => void;
}) => {
	const locale = useLocale();
	const form = useForm({
		validators: {
			onSubmit: LearnersFormSchema,
		},
		defaultValues: {
			learners: [
				{
					email: "",
					firstName: "",
					lastName: "",
					sendEmail: true,
					id: undefined,
					inviteLanguage: "en",
				},
			],
		} as LearnersForm,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-4"
		>
			<div className="flex w-full gap-2">
				<p className="flex-1 text-sm leading-none font-medium">
					First Name
				</p>
				<p className="flex-1 text-sm leading-none font-medium">
					Last Name
				</p>
				<p className="flex-[2] text-sm leading-none font-medium">
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
								<form.Field
									name={`learners[${index}].firstName`}
								>
									{(subField) => (
										<div className="flex-1">
											<Input
												value={subField.state.value}
												onChange={(e) =>
													subField.handleChange(
														e.target.value,
													)
												}
											/>
											<FieldError
												errors={
													subField.state.meta.errors
												}
											/>
										</div>
									)}
								</form.Field>
								<form.Field
									name={`learners[${index}].lastName`}
								>
									{(subField) => (
										<div className="flex-1">
											<Input
												value={subField.state.value}
												onChange={(e) =>
													subField.handleChange(
														e.target.value,
													)
												}
											/>
											<FieldError
												errors={
													subField.state.meta.errors
												}
											/>
										</div>
									)}
								</form.Field>
								<form.Field name={`learners[${index}].email`}>
									{(subField) => (
										<div className="flex-[2]">
											<Input
												value={subField.state.value}
												onChange={(e) =>
													subField.handleChange(
														e.target.value,
													)
												}
											/>
											<FieldError
												errors={
													subField.state.meta.errors
												}
											/>
										</div>
									)}
								</form.Field>
								<form.Field
									name={`learners[${index}].inviteLanguage`}
								>
									{(subField) => (
										<div className="min-w-[100px] w-[100px]">
											<Select
												onValueChange={(
													value: Locale,
												) =>
													subField.handleChange(value)
												}
												defaultValue={
													subField.state.value
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select language" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{locales.map(
															(locale) => (
																<SelectItem
																	key={
																		locale.label
																	}
																	value={
																		locale.value
																	}
																>
																	{
																		locale.label
																	}
																</SelectItem>
															),
														)}
													</SelectGroup>
												</SelectContent>
											</Select>
											<FieldError
												errors={
													subField.state.meta.errors
												}
											/>
										</div>
									)}
								</form.Field>
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
							<Button type="submit">Invite</Button>
						</div>
					</>
				)}
			</form.Field>
		</form>
	);
};
