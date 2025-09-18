import { db } from "@/server/db";
import { webhooks } from "@/server/db/schema";
import type { Learner } from "@/types/learner";
import type { Webhook, WebhookEventType } from "@/types/webhooks";
import { asyncQueue } from "@tanstack/pacer";
import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";

export type WebhookPayload = {
	"learner.updated": Learner;
	"learner.started": Learner;
	"learner.completed": Learner;
};

const getRetryDelay = (retries: number) => {
	const retryDelays = [
		0, // Immediately
		5 * 1000, // 5 seconds
		5 * 60 * 1000, // 5 minutes
		30 * 60 * 1000, // 30 minutes
		2 * 60 * 60 * 1000, // 2 hours
		5 * 60 * 60 * 1000, // 5 hours
		10 * 60 * 60 * 1000, // 10 hours
	];
	return retryDelays[Math.min(retries, retryDelays.length - 1)];
};

export const callWebhook = asyncQueue(
	async <T extends WebhookEventType>({
		event,
		webhook,
		retries = 0,
		data,
	}: {
		event: T;
		webhook: Webhook;
		retries?: number;
		data: WebhookPayload[T];
	}) => {
		if (retries > 7) {
			console.error("Retries exceeded, giving up", webhook.url);
			return;
		}

		const body = JSON.stringify({
			event,
			data,
		});

		const timestamp = new Date().toISOString();
		const signature = createHmac("sha256", webhook.secret)
			.update(`${timestamp}.${body}`)
			.digest("hex");

		const res = await fetch(webhook.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"webhook-timestamp": timestamp,
				"webhook-signature": signature,
				...webhook.headers,
			},
			body,
		});
		if (!res.ok) {
			console.error("Failed to trigger webhook", webhook.url);

			setTimeout(() => {
				callWebhook({
					event,
					webhook,
					retries: retries + 1,
					data,
				});
			}, getRetryDelay(retries));
		}
	},
	{
		concurrency: 10,
	},
);

export const triggerWebhook = asyncQueue(
	async <T extends WebhookEventType>({
		event,
		organizationId,
		data,
	}: {
		event: T;
		organizationId: string;
		data: WebhookPayload[T];
	}) => {
		const webhookList = await db.query.webhooks.findMany({
			where: eq(webhooks.organizationId, organizationId),
		});
		for (const webhook of webhookList) {
			if (
				webhook.enabled &&
				(webhook.events === null || webhook.events.includes(event))
			) {
				callWebhook({
					event,
					webhook,
					data,
				});
			}
		}
	},
	{
		concurrency: 10,
	},
);
