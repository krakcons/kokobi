import { learners } from "@/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { WithUser } from "./users";

export const LearnerSchema = createSelectSchema(learners);
export type Learner = typeof learners.$inferSelect;

export const InsertLearnerSchema = createInsertSchema(learners);
export type InsertLearner = typeof learners.$inferInsert;

export const UpdateLearnerSchema = LearnerSchema.pick({
	id: true,
	courseId: true,
	data: true,
});
export type UpdateLearner = z.infer<typeof UpdateLearnerSchema>;

export const DeleteLearnerSchema = LearnerSchema.shape.id;
export type DeleteLearner = z.infer<typeof DeleteLearnerSchema>;

export const CreateLearnerSchema = LearnerSchema.pick({
	courseId: true,
}).extend({
	email: z.string().email().nullable(),
	sendEmail: z.boolean().optional(),
});
export type CreateLearner = z.infer<typeof CreateLearnerSchema>;

export type FullLearner = WithUser<Learner> & {
	data: {
		status: string;
		score?: {
			raw?: number | string;
			max?: number | string;
			min?: number | string;
		};
	};
};
