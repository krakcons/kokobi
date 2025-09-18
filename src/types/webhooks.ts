import { webhooks } from "@/server/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const WebhookSchema = createSelectSchema(webhooks);
export type Webhook = z.infer<typeof WebhookSchema>;

export const WebhookFormSchema = createInsertSchema(webhooks, {
	url: z.url(),
}).omit({
	id: true,
	organizationId: true,
	secret: true,
	createdAt: true,
	updatedAt: true,
});
export type WebhookFormType = z.infer<typeof WebhookFormSchema>;

export const eventTypes = [
	"learner.complete",
	"learner.created",
	"learner.started",
	"learner.updated",
] as const;
