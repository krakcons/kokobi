import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getAuthFn, getTeamsFn } from "@/server/handlers/user";
import { EditingLocaleSchema } from "@/types/router";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getTenantFn } from "@/server/handlers/teams";
import { LearnerSidebar } from "@/components/sidebars/LearnerSidebar";

export const Route = createFileRoute("/$locale/learner")({
	component: RouteComponent,
	validateSearch: EditingLocaleSchema,
	beforeLoad: async ({ params }) => {
		const auth = await getAuthFn();

		if (!auth.user) {
			throw redirect({
				to: "/$locale/auth/login",
				params,
			});
		}
	},
	loader: () =>
		Promise.all([
			getAuthFn(),
			getTeamsFn(),
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
	const [auth, teams, courses, collections, tenantId] = Route.useLoaderData();

	return (
		<SidebarProvider>
			<LearnerSidebar
				tenantId={tenantId}
				teamId={auth.teamId!}
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
