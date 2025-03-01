import { courseTranslations, courses } from "@/api/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const CourseSchema = createSelectSchema(courses);
export type Course = z.infer<typeof CourseSchema>;

export const DeleteCourseSchema = CourseSchema.pick({
	id: true,
});
export type DeleteCourse = z.infer<typeof DeleteCourseSchema>;

export const SelectCourseSchema = CourseSchema.pick({
	id: true,
});
export type SelectCourse = z.infer<typeof SelectCourseSchema>;

export const CourseTranslationSchema = createSelectSchema(courseTranslations);
export type CourseTranslation = z.infer<typeof CourseTranslationSchema>;

export const completionStatuses = ["passed", "completed", "either"];
export const CourseFormSchema = z.object({
	name: z.string().min(1),
	description: z.string(),
	completionStatus: CourseSchema.shape.completionStatus,
});
export type CourseFormType = z.infer<typeof CourseFormSchema>;
