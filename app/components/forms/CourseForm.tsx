import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
			completionStatus: "passed",
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
					<FormField
						control={form.control}
						name={"completionStatus"}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Completion Status</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-[150px]">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectGroup>
											{[
												"passed",
												"completed",
												"either",
											].map((status) => (
												<SelectItem
													key={status}
													value={status}
												>
													{status[0].toUpperCase() +
														status.slice(1)}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<FormDescription>
									When the course is considered completed.
									Certificate is issued and course is locked.
								</FormDescription>
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
