"use client";

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
import { client } from "@/lib/api";
import { CreateCourse, CreateCourseSchema } from "@/types/course";
import { Language } from "@/types/translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";

export const CreateCourseForm = ({ teamId, language }: { teamId: string; language: Language }) => {
	const router = useRouter();
	const form = useForm<CreateCourse>({
		resolver: zodResolver(CreateCourseSchema),
		defaultValues: {
			default: true,
			language,
			name: "",
			description: "",
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: InferRequestType<typeof client.api.courses.$post>) => {
			const res = await client.api.courses.$post(input);
			if (!res.ok) {
				throw new Error(await res.text());
			}
			return res;
		},
		onSuccess: async (res) => {
			const data = await res.json();
			router.invalidate();
			router.navigate({ href: `/dashboard/${teamId}/courses/${data.id}` });
		},
	});

	// 2. Define a submit handler.
	const onSubmit = (values: CreateCourse) => {
		mutate({
			json: values,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
				<Button type="submit" isPending={isPending}>
					Submit
				</Button>
			</form>
		</Form>
	);
};
