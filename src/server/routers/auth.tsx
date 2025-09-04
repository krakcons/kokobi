import z from "zod";
import { getTenant } from "../lib/tenant";
import { protectedProcedure, publicProcedure } from "../middleware";
import { auth } from "@/lib/auth";

export const authRouter = {
	session: protectedProcedure.handler(async ({ context }) => {
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
};
