import { getTeamFn } from "@/server/handlers/teams";
import { setTeamFn } from "@/server/handlers/user";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/$teamId")({
	component: RouteComponent,
	beforeLoad: async ({ params, location }) => {
		const team = await getTeamFn();

		if (location.pathname.startsWith(`/${params.locale}/admin`)) {
			if (!team) {
				throw redirect({
					to: "/$locale/create-team",
					params: { locale: params.locale },
				});
			} else {
				throw redirect({
					to: "/$locale/$teamId/admin",
					params: { locale: params.locale, teamId: team.id },
				});
			}
		}

		if (team && team.id !== params.teamId) {
			await setTeamFn({
				data: {
					teamId: params.teamId,
				},
			});
		}
	},
});

function RouteComponent() {
	return <Outlet />;
}
