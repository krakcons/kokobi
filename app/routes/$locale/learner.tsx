import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getAuthFn, getTeamsFn, setTeamFn } from "@/server/handlers/user";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getTenantFn } from "@/server/handlers/teams";
import { LearnerSidebar } from "@/components/sidebars/LearnerSidebar";
import { z } from "zod";
import { env } from "@/env";

export const Route = createFileRoute("/$locale/learner")({
	component: RouteComponent,
	validateSearch: z.object({
		teamId: z.string().optional(),
	}),
	beforeLoad: async ({ params, search, location }) => {
		const auth = await getAuthFn();
		throw new Error("Not implemented");

		if (!auth.user) {
			throw redirect({
				to: "/$locale/auth/login",
				search: (s) => ({
					...s,
					redirect: location.pathname,
				}),
				params,
			});
		}

		const tenantId = await getTenantFn();
		if (tenantId) {
			if (tenantId !== auth.learnerTeamId) {
				await setTeamFn({
					data: {
						teamId: tenantId,
						type: "learner",
					},
				});
				throw redirect({ href: location.href });
			}
		} else {
			if (search.teamId) {
				await setTeamFn({
					data: {
						teamId: search.teamId,
						type: "learner",
					},
				});
				const newUrl = new URL(env.VITE_SITE_URL + location.href);
				newUrl.searchParams.delete("teamId");
				throw redirect({
					href: newUrl.href,
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
					await setTeamFn({
						data: {
							teamId: teams[0].id,
							type: "learner",
						},
					});
					throw redirect({ href: location.href });
				}
			}
		}
	},
	loader: () =>
		Promise.all([
			getAuthFn(),
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
	const [auth, teams, courses, collections, tenantId] = Route.useLoaderData();

	return (
		<SidebarProvider>
			<LearnerSidebar
				tenantId={tenantId ?? undefined}
				teamId={auth.learnerTeamId!}
				teams={teams}
				courses={courses}
				collections={collections}
				user={auth.user!}
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
