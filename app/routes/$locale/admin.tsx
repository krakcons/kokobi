import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuth } from "@/server/auth/actions";
import { db } from "@/server/db/db";
import { usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { getCookie, getEvent, setCookie } from "vinxi/http";

const handleUserTeam = createServerFn({ method: "GET" }).handler(async () => {
	const { user } = await getAuth();

	if (!user) {
		throw redirect({ href: "/api/auth/google" });
	}

	const teamId = getCookie("teamId");

	// If team cookie check for team and redirect
	if (teamId) {
		const userToTeam = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, teamId),
			),
			with: {
				team: true,
			},
		});

		if (userToTeam?.team) {
			return;
		}
	}

	const teamsList = await db.query.usersToTeams.findMany({
		where: eq(usersToTeams.userId, user.id),
		with: {
			team: {
				with: {
					translations: true,
				},
			},
		},
	});

	if (teamsList.length === 0) {
		throw redirect({ href: "/dashboard/create" });
	} else {
		const event = getEvent();
		setCookie(event, "teamId", teamsList[0].team.id, {
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "lax",
		});
	}
});

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	beforeLoad: async () => {
		await handleUserTeam();
	},
});

function RouteComponent() {
	return <div>Hello "/$locale/admin"!</div>;
}
