import z from "zod";
import { getTenant } from "../lib/tenant";
import {
	base,
	protectedProcedure,
	publicProcedure,
	superAdminProcedure,
} from "../middleware";
import { auth } from "@/lib/auth";
import { db } from "../db";
import { OrganizationSchema } from "@/types/organization";
import { ORPCError } from "@orpc/client";
import { handleLocalization } from "@/lib/locale";
import { organizations } from "../db/auth";
import { eq } from "drizzle-orm";

export const authRouter = base.prefix("/auth").router({
	session: protectedProcedure
		.route({
			tags: ["Auth"],
			method: "GET",
			path: "/session",
			summary: "Get Session",
		})
		.handler(async ({ context }) => {
			return {
				session: context.session,
				user: context.user,
				member: context.member,
			};
		}),
	optionalSession: publicProcedure.handler(async ({ context }) => {
		return {
			session: context.session,
			user: context.user,
			member: context.member,
		};
	}),
	tenant: publicProcedure
		.route({
			tags: ["Auth"],
			method: "GET",
			path: "/tenant",
			summary: "Get Tenant",
		})
		.output(OrganizationSchema.nullable())
		.handler(async ({ context }) => {
			let organizationId = await getTenant();
			if (!organizationId) {
				return null;
			}
			const organization = await db.query.organizations.findFirst({
				where: eq(organizations.id, organizationId),
				with: {
					translations: true,
				},
			});
			if (!organization) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Tenant organization not found",
				});
			}
			return handleLocalization(context, organization);
		}),
	invitation: {
		get: protectedProcedure
			.route({
				tags: ["Auth"],
				method: "GET",
				path: "/invitation",
				summary: "Get Invitations",
			})
			.handler(async ({ context }) => {
				return await auth.api.listUserInvitations({
					headers: context.headers,
				});
			}),
		id: protectedProcedure
			.route({
				tags: ["Auth"],
				method: "GET",
				path: "/invitation/{id}",
				summary: "Get Invitation",
			})
			.input(z.object({ id: z.string() }))
			.handler(async ({ context, input: { id } }) => {
				return await auth.api.getInvitation({
					headers: context.headers,
					query: {
						id,
					},
				});
			}),
	},
	super: {
		user: {
			get: superAdminProcedure
				.route({
					tags: ["Auth"],
					method: "GET",
					path: "/user",
					summary: "Get Users",
				})
				.handler(async ({ context }) => {
					return await auth.api.listUsers({
						headers: context.headers,
						query: {
							limit: 1000,
						},
					});
				}),
			impersonate: superAdminProcedure
				.route({
					tags: ["Auth"],
					method: "POST",
					path: "/user/impersonate",
					summary: "Impersonate User",
				})
				.input(
					z.object({
						id: z.string(),
					}),
				)
				.handler(async ({ context, input: { id } }) => {
					return await auth.api.impersonateUser({
						headers: context.headers,
						body: {
							userId: id,
						},
					});
				}),
		},
	},
});
