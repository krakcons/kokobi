import { auth } from "@/lib/auth";
import { organizationProcedure } from "../middleware";
import z from "zod";
import { db } from "../db";
import { APIKeyFormSchema, type APIKeyMetadata } from "@/types/api-keys";

export const apiKeysRouter = {
	get: organizationProcedure.handler(async ({ context }) => {
		const apiKeys = await db.query.apikeys.findMany({
			with: {
				user: true,
			},
		});
		return apiKeys
			.map(({ key, ...apiKey }) => ({
				...apiKey,
				metadata: JSON.parse(
					String(JSON.parse(String(apiKey.metadata))),
				) as APIKeyMetadata,
			}))
			.filter((key) => {
				console.log(key.metadata);
				return (
					key.metadata.organizationId ===
					context.session.activeOrganizationId
				);
			});
	}),
	create: organizationProcedure
		.input(APIKeyFormSchema)
		.handler(async ({ context, input }) => {
			return auth.api.createApiKey({
				headers: context.headers,
				body: {
					name: input.name,
					userId: context.session.userId,
					metadata: {
						organizationId: context.session.activeOrganizationId,
					},
				},
			});
		}),
	delete: organizationProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			return auth.api.deleteApiKey({
				headers: context.headers,
				body: { keyId: input.id },
			});
		}),
	update: organizationProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			return auth.api.updateApiKey({
				headers: context.headers,
				body: {
					keyId: input.id,
					name: input.name,
				},
			});
		}),
};
