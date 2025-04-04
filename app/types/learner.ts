import { learners } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { Module } from "./module";
import { Scorm12DataSchema } from "./scorm/versions/12";
import { Scorm2004DataSchema } from "./scorm/versions/2004";
import { LanguageSchema } from "./translations";

export const BaseLearnerSchema = createSelectSchema(learners, {
	data: z.record(z.string()),
	email: z.string().email(),
});
export type BaseLearner = z.infer<typeof BaseLearnerSchema>;

export const LearnerSchema = BaseLearnerSchema.extend({
	status: z.enum([
		"completed",
		"passed",
		"failed",
		"in-progress",
		"not-started",
	]),
	score: z
		.object({
			raw: z.number().optional(),
			max: z.number().optional(),
			min: z.number().optional(),
		})
		.optional(),
});
export type Learner = z.infer<typeof LearnerSchema>;

export const ExtendLearner = (type?: Module["type"]) => {
	return BaseLearnerSchema.transform((data) => {
		return type === "1.2"
			? {
					...data,
					...Scorm12DataSchema.parse(data.data),
				}
			: type === "2004"
				? {
						...data,
						...Scorm2004DataSchema.parse(data.data),
					}
				: {
						...data,
						status: "not-started" as const,
						score: {
							raw: 0,
							max: 100,
							min: 0,
						},
					};
	}).refine((learner) => {
		if (learner.status === "not-started" && learner.startedAt) {
			learner.status = "in-progress";
		}
		return learner;
	});
};

export const JoinCourseFormSchema = z.object({
	id: z.string().optional(),
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	moduleId: z.string(),
});
export type JoinCourseFormType = z.infer<typeof JoinCourseFormSchema>;

export const LearnersFormSchema = z.object({
	learners: z
		.array(
			z.object({
				id: z.string().optional(),
				email: z.string().email(),
				firstName: z.string().min(1),
				lastName: z.string().min(1),
				sendEmail: z.boolean().optional(),
				inviteLanguage: LanguageSchema.optional(),
			}),
		)
		.min(1),
});
export type LearnersFormType = z.infer<typeof LearnersFormSchema>;

export const LearnerUpdateSchema = z.object({
	// Can update data
	data: z.record(z.string()),
});
export type LearnerUpdateType = z.infer<typeof LearnerUpdateSchema>;
