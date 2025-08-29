import { courseTranslations, courses } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ConnectionSchema } from "./connections";

export const BaseCourseSchema = createSelectSchema(courses);

export const CourseTranslationSchema = createSelectSchema(courseTranslations);
export type CourseTranslation = z.infer<typeof CourseTranslationSchema>;

export const CourseSchema = BaseCourseSchema.extend(
	CourseTranslationSchema.shape,
).extend({
	connection: ConnectionSchema.optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const completionStatuses = ["passed", "completed", "either"] as const;
export const CourseFormSchema = z.object({
	name: z.string().min(1),
	description: z.string(),
	completionStatus: CourseSchema.shape.completionStatus,
});
export type CourseFormType = z.infer<typeof CourseFormSchema>;
