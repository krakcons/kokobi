import { ORPCError, os } from "@orpc/server";
import { roles, type Role } from "@/types/team";
import type { OrpcContext } from "./context";

export const base = os.$context<OrpcContext>();

export const publicProcedure = base;

export const protectedProcedure = base.use(
	base.middleware(async ({ next, context }) => {
		const { session, user } = context;
		if (!session || !user) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				session,
				user,
			},
		});
	}),
);

export const teamProcedure = ({ role = "member" }: { role?: Role } = {}) =>
	protectedProcedure.use(
		base.middleware(async ({ context, next }) => {
			const { teamId, role: teamRole } = context;
			if (
				!teamId ||
				(teamRole && roles.indexOf(teamRole) > roles.indexOf(role))
			) {
				throw new Error("No admin team or role not permitted");
			}

			return next({
				context: {
					...context,
					teamId,
					role: teamRole,
				},
			});
		}),
	);

export const learnerProcedure = protectedProcedure.use(
	base.middleware(async ({ context, next }) => {
		const { learnerTeamId } = context;
		if (!learnerTeamId) {
			throw new Error("No learner team");
		}

		return next({
			context: {
				...context,
				learnerTeamId,
			},
		});
	}),
);
