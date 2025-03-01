import { Button } from "@/components/ui/button";
import { ModuleFormType, ModuleFormSchema } from "@/types/module";
import { useAppForm } from "../ui/form";

const ModuleForm = ({
	onSubmit,
}: {
	onSubmit: (module: ModuleFormType) => void;
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
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			<form.AppField name="file">
				{(field) => (
					<field.FileField label="File" accept="application/zip" />
				)}
			</form.AppField>
			<Button type="submit">Submit</Button>
		</form>
	);
};

export default ModuleForm;
