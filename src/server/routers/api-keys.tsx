import { auth } from "@/lib/auth";
import { base, organizationProcedure } from "../middleware";
import z from "zod";
import { db } from "../db";
import { APIKeyFormSchema, type APIKeyMetaType } from "@/types/api-keys";

export const apiKeysRouter = base
	.prefix("/api-keys")
	.tag("API Keys")
	.router({
		get: organizationProcedure
			.route({
				method: "GET",
				path: "/",
				summary: "Get API Keys",
			})
			.handler(async ({ context }) => {
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
						) as APIKeyMetaType,
					}))
					.filter((key) => {
						return (
							key.metadata.organizationId ===
							context.session?.activeOrganizationId
						);
					});
			}),
		create: organizationProcedure
			.route({
				method: "POST",
				path: "/",
				summary: "Create API Key",
			})
			.input(APIKeyFormSchema)
			.handler(async ({ context, input }) => {
				return auth.api.createApiKey({
					headers: context.headers,
					body: {
						name: input.name,
						userId: context.session?.userId,
						metadata: {
							organizationId: context.activeOrganizationId,
						},
					},
				});
			}),
		delete: organizationProcedure
			.route({
				method: "DELETE",
				path: "/{id}",
				summary: "Delete API Key",
			})
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
			.route({
				method: "PUT",
				path: "/{id}",
				summary: "Update API Key",
			})
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
	});
