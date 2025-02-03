import { courseTranslations, courses } from "@/server/db/schema";
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

export const UpdateCourseSettingsSchema = CourseSchema.pick({
	completionStatus: true,
});
export type UpdateCourseSettings = z.infer<typeof UpdateCourseSettingsSchema>;

export const CreateCourseSchema = CourseTranslationSchema.pick({
	language: true,
	name: true,
	description: true,
	default: true,
}).extend({
	name: z.string().min(1),
});
export type CreateCourse = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseTranslationSchema = CourseTranslationSchema.pick({
	name: true,
	description: true,
	language: true,
});
