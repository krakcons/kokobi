import { db } from "@/server/db";
import { usersToTeams } from "@/server/db/schema";
import { TeamUsersFormSchema } from "@/types/team";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { teamMiddleware } from "../lib/middleware";
import { createServerFn } from "@tanstack/react-start";
import { getUserList } from "../lib/connection";

export const getTeamUsersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const members = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.teamId, context.teamId),
			with: {
				user: true,
			},
		});

		return members;
	});

export const createTeamUsersFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(TeamUsersFormSchema)
	.handler(async ({ context, data }) => {
		const users = await getUserList({
			emails: data.users.map((u) => u.email),
		});

		await db
			.insert(usersToTeams)
			.values(
				users.map((user) => ({
					userId: user.id,
					teamId: context.teamId,
					role: data.users.find((u) => u.email === user.email)?.role,
					connectType: "invite" as const,
					connectStatus: "pending" as const,
				})),
			)
			.onConflictDoUpdate({
				target: [usersToTeams.userId, usersToTeams.teamId],
				set: {
					updatedAt: new Date(),
				},
			});

		return null;
	});

export const deleteTeamUsersFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(z.object({ userId: z.string() }))
	.handler(async ({ context, data: { userId } }) => {
		const id = context.teamId;

		await db
			.delete(usersToTeams)
			.where(
				and(
					eq(usersToTeams.userId, userId),
					eq(usersToTeams.teamId, id),
				),
			);

		return null;
	});
