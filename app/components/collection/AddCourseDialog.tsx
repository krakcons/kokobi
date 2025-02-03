"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { client } from "@/lib/api";
import { translate } from "@/lib/translation";
import { Course, CourseTranslation } from "@/types/course";
import { Language } from "@/types/translations";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { Plus } from "lucide-react";

const addCourseFn = client.api.collections[":id"].courses.$post;

export const AddCourseDialog = ({
	collectionId,
	courses,
	language,
}: {
	collectionId: string;
	courses: (Course & { translations: CourseTranslation[] })[];
	language: Language;
}) => {
	const router = useRouter();
	const { mutate } = useMutation({
		mutationFn: async (input: InferRequestType<typeof addCourseFn>) => {
			const res = await addCourseFn(input);
			if (!res.ok) {
				throw new Error(await res.text());
			}
		},
		onSuccess: async () => {
			router.invalidate();
		},
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex h-32 flex-col">
					<div className="flex flex-col items-center justify-center gap-4">
						<Plus size={24} />
						Add Course
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-screen overflow-y-auto">
				<DialogTitle>Add Course</DialogTitle>
				{courses.length === 0 && (
					<p className="mt-4 text-center text-muted-foreground">
						No courses available to add.
					</p>
				)}
				<div className="grid grid-cols-2 gap-4">
					{courses.map((course) => (
						<Button
							key={course.id}
							variant="outline"
							className="relative h-32 w-full gap-4 p-4"
							onClick={() => {
								mutate({
									param: { id: collectionId },
									json: { id: course.id },
								});
							}}
						>
							<p className="truncate text-center">
								{translate(course.translations, language).name}
							</p>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};
