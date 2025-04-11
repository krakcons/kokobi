import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import {
	getAuthFn,
	getTeamsFn,
	setLearnerTeamFn,
	setTeamFn,
} from "@/server/handlers/user";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getTeamFn, getTenantFn } from "@/server/handlers/teams";
import { LearnerSidebar } from "@/components/sidebars/LearnerSidebar";
import { z } from "zod";

export const Route = createFileRoute("/$locale/learner")({
	component: RouteComponent,
	validateSearch: z.object({
		teamId: z.string().optional(),
	}),
	beforeLoad: async ({ params, search, location }) => {
		const auth = await getAuthFn();

		if (!auth.user) {
			throw redirect({
				to: "/$locale/auth/login",
				params,
			});
		}

		if (search.teamId) {
			await setLearnerTeamFn({
				data: {
					teamId: search.teamId,
				},
			});
			throw redirect({
				href: location.pathname,
			});
		}

		if (!auth.learnerTeamId) {
			const teams = await getTeamsFn({
				data: {
					type: "learner",
				},
			});
			if (teams.length === 0) {
				throw new Error("No learner team found");
			} else {
				await setLearnerTeamFn({
					data: {
						teamId: teams[0].id,
					},
				});
				throw redirect({
					to: "/$locale/learner",
					params: {
						locale: params.locale,
					},
				});
			}
		}
	},
	loader: () =>
		Promise.all([
			getTeamFn({
				data: {
					type: "learner",
				},
			}),
			getTeamsFn({
				data: {
					type: "learner",
				},
			}),
			getConnectionsFn({
				data: {
					type: "course",
				},
			}),
			getConnectionsFn({
				data: {
					type: "collection",
				},
			}),
			getTenantFn(),
		]),
});

function RouteComponent() {
	const [team, teams, courses, collections, tenantId] = Route.useLoaderData();

	return (
		<SidebarProvider>
			<LearnerSidebar
				tenantId={tenantId}
				activeTeam={team}
				teams={teams}
				courses={courses}
				collections={collections}
			/>
			<SidebarInset>
				<header className="p-4 flex flex-row items-center justify-between">
					<SidebarTrigger />
					<LocaleToggle />
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
