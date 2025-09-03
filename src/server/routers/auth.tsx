import { getTenant } from "../lib/tenant";
import { protectedProcedure, publicProcedure } from "../middleware";

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
};
