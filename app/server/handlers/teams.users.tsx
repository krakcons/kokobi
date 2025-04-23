import { db } from "@/server/db";
import { teams, users, usersToTeams } from "@/server/db/schema";
import { InviteMemberFormSchema } from "@/types/team";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { teamMiddleware } from "../middleware";
import { createServerFn } from "@tanstack/react-start";

export const getTeamUsersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const members = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.teamId, teamId),
			with: {
				user: true,
			},
		});

		return members.map(({ user, role, createdAt }) => ({
			...user,
			joinedAt: createdAt,
			role,
		}));
	});

export const createTeamUsersFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(InviteMemberFormSchema)
	.handler(async ({ context, data }) => {
		const id = context.teamId;
		const { email, role } = data;

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, id),
		});

		if (!team) {
			throw new Error("Team not found.");
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user) {
			throw new Error(
				"User email not found. Please ask them to sign up before continuing.",
			);
		}

		const existing = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, id),
			),
		});

		if (existing) {
			throw new Error("User is already in the team.");
		}

		await db.insert(usersToTeams).values({
			userId: user.id,
			teamId: id,
			role,
			connectType: "invite",
			connectStatus: "pending",
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
