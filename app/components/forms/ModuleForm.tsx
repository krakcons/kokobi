import { Button, buttonVariants } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModuleForm, ModuleFormSchema } from "@/types/module";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const ModuleForm = ({
	onSubmit,
}: {
	onSubmit: (module: ModuleForm) => void;
}) => {
	const form = useForm<ModuleForm>({
		resolver: zodResolver(ModuleFormSchema),
		defaultValues: {
			file: undefined,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="file"
					render={({ field: { value, onChange, ...fieldProps } }) => (
						<FormItem>
							<Label>File {value ? `(${value.name})` : ""}</Label>
							<div className="flex gap-2 items-center mt-2">
								<FormLabel
									className={buttonVariants({
										size: "sm",
										variant: "secondary",
										className: "cursor-pointer",
									})}
								>
									Upload File
								</FormLabel>
								{value && (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => {
											onChange("");
										}}
									>
										Remove
									</Button>
								)}
							</div>
							<FormControl>
								<Input
									{...fieldProps}
									placeholder="Module File"
									type="file"
									className="hidden"
									accept="application/zip"
									onChange={(event) => {
										onChange(
											event.target.files &&
												event.target.files[0],
										);
									}}
								/>
							</FormControl>
							<FormDescription>File type: zip</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
};

export default ModuleForm;
