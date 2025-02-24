import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { APIKeyFormType, APIKeyFormSchema } from "@/types/keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export const APIKeyForm = ({
	onSubmit,
}: {
	onSubmit: (data: APIKeyFormType) => void;
}) => {
	const form = useForm({
		resolver: zodResolver(APIKeyFormSchema),
		defaultValues: {
			name: "",
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input placeholder="Key name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Create Key</Button>
			</form>
		</Form>
	);
};
