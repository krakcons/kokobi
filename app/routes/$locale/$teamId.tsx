import { getTeamFn } from "@/server/handlers/teams";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/$teamId")({
	component: RouteComponent,
	beforeLoad: async ({ params, location }) => {
		if (location.pathname.startsWith(`/${params.locale}/admin`)) {
			const team = await getTeamFn();
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
	},
});

function RouteComponent() {
	return <Outlet />;
}
