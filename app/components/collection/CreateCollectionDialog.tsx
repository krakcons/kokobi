"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/api";
import {
	CreateCollectionTranslation,
	CreateCollectionTranslationSchema,
} from "@/types/collections";
import { CreateCourse } from "@/types/course";
import { Language } from "@/types/translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const CreateCollectionDialog = ({ language }: { language: Language }) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const form = useForm<CreateCollectionTranslation>({
		resolver: zodResolver(CreateCollectionTranslationSchema),
		defaultValues: {
			language,
			default: true,
			name: "",
			description: "",
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: InferRequestType<typeof client.api.collections.$post>) => {
			const res = await client.api.collections.$post(input);
			if (!res.ok) {
				throw new Error(await res.text());
			}
		},
		onSuccess: async () => {
			router.invalidate();
			form.reset();
			setOpen(false);
		},
	});

	// 2. Define a submit handler.
	const onSubmit = (values: CreateCourse) => {
		mutate({
			json: values,
		});
	};

	return (
		<Dialog open={open} onOpenChange={(open) => setOpen(open)}>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex h-32 flex-col">
					<div className="flex flex-col items-center justify-center gap-4">
						<Plus size={24} />
						Create Collection
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>Create Collection</DialogTitle>
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
			</DialogContent>
		</Dialog>
	);
};
