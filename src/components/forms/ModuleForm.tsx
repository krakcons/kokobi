import { type ModuleFormType, ModuleFormSchema } from "@/types/module";
import { useAppForm } from "../ui/form";
import { useTranslations } from "@/lib/locale";

const ModuleForm = ({
	onSubmit,
}: {
	onSubmit: (module: ModuleFormType) => Promise<any>;
}) => {
	const t = useTranslations("ModuleForm");
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
			<form.BlockNavigation />
			<form onSubmit={(e) => e.preventDefault()} className="space-y-8">
				<form.AppField name="file">
					{(field) => (
						<field.FileField
							label={t.file}
							accept="application/zip"
						/>
					)}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

export default ModuleForm;
