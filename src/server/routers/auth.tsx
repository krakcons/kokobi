import z from "zod";
import { getTenant } from "../lib/tenant";
import {
	base,
	protectedProcedure,
	publicProcedure,
	superAdminProcedure,
} from "../middleware";
import { auth } from "@/lib/auth";

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
	tenant: publicProcedure
		.route({
			tags: ["Auth"],
			method: "GET",
			path: "/tenant",
			summary: "Get Tenant",
		})
		.handler(async () => {
			return await getTenant();
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
