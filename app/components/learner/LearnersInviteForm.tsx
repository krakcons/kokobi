"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { labelVariants } from "@/components/ui/label";
import { locales } from "@/lib/locale";
import { CreateLearnerSchema } from "@/types/learner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export const InviteFormSchema = z.object({
	learners: z.array(CreateLearnerSchema.omit({ courseId: true })),
});
export type InviteForm = z.infer<typeof InviteFormSchema>;

export const LearnersInviteForm = ({
	onSubmit,
	isPending,
}: {
	isPending: boolean;
	onSubmit: (values: InviteForm) => void;
}) => {
	const form = useForm<InviteForm>({
		resolver: zodResolver(InviteFormSchema),
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
		},
	});

	const { fields, append, remove } = useFieldArray({
		name: "learners",
		control: form.control,
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{form.formState.errors.root?.message && (
					<FormError message={form.formState.errors.root.message} />
				)}
				<div className="flex w-full gap-2">
					<p
						className={labelVariants({
							className: "flex-1",
						})}
					>
						First Name
					</p>
					<p
						className={labelVariants({
							className: "flex-1",
						})}
					>
						Last Name
					</p>
					<p
						className={labelVariants({
							className: "flex-[2]",
						})}
					>
						Email
					</p>
					<p
						className={labelVariants({
							className: "w-[80px]",
						})}
					>
						Language
					</p>
					<div className="w-10"></div>
				</div>
				<hr />
				{fields.map((field, index) => (
					<div key={field.id} className="flex items-end gap-2">
						<FormField
							control={form.control}
							name={`learners.${index}.firstName`}
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`learners.${index}.lastName`}
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`learners.${index}.email`}
							render={({ field }) => (
								<FormItem className="flex-[2]">
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`learners.${index}.inviteLanguage`}
							render={({ field }) => (
								<FormItem>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-[80px]">
												<SelectValue placeholder="Select language" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												{locales.map((locale) => (
													<SelectItem
														key={locale.label}
														value={locale.value}
													>
														{locale.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type="button"
							onClick={() => remove(index)}
							variant="outline"
							size="icon"
							className="min-w-10"
						>
							<Trash2 size={18} />
						</Button>
					</div>
				))}
				<div className="flex justify-between">
					<Button
						type="button"
						onClick={() =>
							append({
								email: "",
								firstName: "",
								lastName: "",
								sendEmail: true,
								id: undefined,
							})
						}
						variant="outline"
					>
						Add Learner
					</Button>
					<Button type="submit" isPending={isPending}>
						Invite
					</Button>
				</div>
			</form>
		</Form>
	);
};
