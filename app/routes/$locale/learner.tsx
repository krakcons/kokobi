import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	createFileRoute,
	Outlet,
	redirect,
	useLocation,
	useMatch,
	useRouter,
} from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import {
	getLearnerUserTeamsFn,
	updateUserTeamFn,
} from "@/server/handlers/users.teams";
import { getAuthFn } from "@/server/handlers/auth";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getTenantFn } from "@/server/handlers/teams";
import { LearnerSidebar } from "@/components/sidebars/LearnerSidebar";
import { z } from "zod";
import { env } from "@/env";
import { getAvailableCoursesFn } from "@/server/handlers/courses";
import { UserButton } from "@/components/sidebars/UserButton";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { useLocale } from "@/lib/locale";

const getIsIframeFn = createServerFn().handler(() => {
	const secFestDest = getHeader("sec-fetch-dest");
	return secFestDest === "iframe";
});

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
				search: (s) => ({
					...s,
					redirect: location.pathname,
				}),
				params,
			});
		}

		const tenantId = await getTenantFn();
		let redirectHref = undefined;
		if (tenantId) {
			if (tenantId !== auth.learnerTeamId) {
				await updateUserTeamFn({
					data: {
						teamId: tenantId,
						type: "learner",
					},
				});
				redirectHref = location.href;
			}
		} else {
			if (search.teamId) {
				await updateUserTeamFn({
					data: {
						teamId: search.teamId,
						type: "learner",
					},
				});
				const newUrl = new URL(env.VITE_SITE_URL + location.href);
				newUrl.searchParams.delete("teamId");
				redirectHref = newUrl.href;
			}
			if (!auth.learnerTeamId) {
				const teams = await getLearnerUserTeamsFn();
				await updateUserTeamFn({
					data: {
						teamId: teams[0].teamId,
						type: "learner",
					},
				});
				redirectHref = location.href;
			}
		}
		if (redirectHref) {
			throw redirect({
				href: redirectHref,
				reloadDocument: true,
			});
		}
		return {
			isIframe:
				(await getIsIframeFn()) ||
				(typeof window !== "undefined" && window.self !== window.top),
		};
	},
	loader: () => {
		return Promise.all([
			getAuthFn(),
			getLearnerUserTeamsFn(),
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
			getAvailableCoursesFn(),
		]);
	},
});

function RouteComponent() {
	const [auth, teams, courses, collections, tenantId, availableCourses] =
		Route.useLoaderData();
	const locale = useLocale();
	const location = useLocation();

	const { isIframe } = Route.useRouteContext();

	const play = useMatch({
		from: "/$locale/learner/courses/$courseId/play",
		shouldThrow: false,
	});

	return (
		<SidebarProvider>
			{!isIframe && (
				<LearnerSidebar
					tenantId={tenantId ?? undefined}
					teamId={auth.learnerTeamId!}
					teams={teams}
					availableCourses={availableCourses.filter(
						(c) =>
							!courses?.some(({ course }) => course?.id === c.id),
					)}
					courses={courses}
					collections={collections}
					user={auth.user!}
				/>
			)}
			<SidebarInset className="max-w-full overflow-hidden">
				{!play && (
					<header className="p-4 h-20 flex flex-row items-center justify-between">
						{!isIframe ? (
							<SidebarTrigger />
						) : (
							<UserButton
								user={auth.user!}
								signOutRedirect={`/${locale}/auth/login?redirect=${location.pathname}`}
							/>
						)}
						<LocaleToggle />
					</header>
				)}
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
