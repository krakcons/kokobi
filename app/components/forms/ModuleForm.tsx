import { ModuleFormType, ModuleFormSchema } from "@/types/module";
import { useAppForm } from "../ui/form";

const ModuleForm = ({
	onSubmit,
}: {
	onSubmit: (module: ModuleFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: ModuleFormSchema,
		},
		defaultValues: {
			file: "",
		} as ModuleFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<div className="space-y-8">
				<form.AppField name="file">
					{(field) => (
						<field.FileField
							label="File"
							accept="application/zip"
						/>
					)}
				</form.AppField>
				<form.SubmitButton />
			</div>
		</form.AppForm>
	);
};

export default ModuleForm;
