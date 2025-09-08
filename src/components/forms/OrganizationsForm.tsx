import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { useAppForm } from "../ui/form";
import { z } from "zod";
import { useTranslations } from "@/lib/locale";

export const OrganizationsFormSchema = z.object({
	organizationIds: z.string().array(),
});
export type OrganizationsFormType = z.infer<typeof OrganizationsFormSchema>;

export const OrganizationsForm = ({
	onSubmit,
}: {
	onSubmit: (values: OrganizationsFormType) => Promise<any>;
}) => {
	const t = useTranslations("OrganizationsForm");
	const form = useAppForm({
		validators: {
			onSubmit: OrganizationsFormSchema,
		},
		defaultValues: {
			organizationIds: [""],
		} as OrganizationsFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-2 w-full"
			>
				<form.Field name="organizationIds" mode="array">
					{(arrayField) => (
						<>
							{arrayField.state.value.map((_, index) => (
								<div
									key={index}
									className="flex items-start gap-2 flex-1 w-full"
								>
									<form.AppField
										name={`organizationIds[${index}]`}
									>
										{(subField) => (
											<div className="flex-1">
												<subField.TextField label="" />
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
										arrayField.pushValue("");
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
