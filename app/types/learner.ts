import { learners } from "@/server/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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

export const InsertLearnerSchema = createInsertSchema(learners, {
	data: z.record(z.string()),
});
export type InsertLearner = z.infer<typeof InsertLearnerSchema>;

export const CreateLearnerSchema = InsertLearnerSchema.extend({
	email: z.string().email(),
	sendEmail: z.boolean().optional(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	inviteLanguage: LanguageSchema.optional(),
}).omit({
	completedAt: true,
	startedAt: true,
});
export type CreateLearner = z.infer<typeof CreateLearnerSchema>;

export type FullLearner = Prettify<
	Learner & {
		status: string;
		score?: {
			raw?: number | string;
			max?: number | string;
			min?: number | string;
		};
	}
>;

export const SelectLearnerSchema = LearnerSchema.pick({
	id: true,
});
export type SelectLearner = z.infer<typeof SelectLearnerSchema>;

export const SelectLearnersSchema = LearnerSchema.pick({
	moduleId: true,
});
export type SelectLearners = z.infer<typeof SelectLearnersSchema>;

export const UpdateLearnerSchema = LearnerSchema.pick({
	id: true,
	moduleId: true,
	data: true,
});
export type UpdateLearner = z.infer<typeof UpdateLearnerSchema>;
