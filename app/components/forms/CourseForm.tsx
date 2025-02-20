import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { CourseFormType, CourseFormSchema } from "@/types/course";

export const CourseForm = ({
	defaultValues,
	onSubmit,
}: {
	defaultValues?: CourseFormType;
	onSubmit: (values: CourseFormType) => void;
}) => {
	const form = useForm<CourseFormType>({
		resolver: zodResolver(CourseFormSchema),
		defaultValues: {
			name: "",
			description: "",
			completionStatus: "incomplete",
			...defaultValues,
		},
	});

	return (
		<main>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit">Submit</Button>
				</form>
			</Form>
		</main>
	);
};
