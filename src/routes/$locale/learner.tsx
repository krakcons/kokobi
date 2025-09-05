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
} from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import { LearnerSidebar } from "@/components/sidebars/LearnerSidebar";
import { z } from "zod";
import { env } from "@/env";
import { UserButton } from "@/components/sidebars/UserButton";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { useLocale } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";

const getIsIframeFn = createServerFn().handler(() => {
	const secFestDest = getHeader("sec-fetch-dest");
	return secFestDest === "iframe";
});

export const Route = createFileRoute("/$locale/learner")({
	component: RouteComponent,
	validateSearch: z.object({
		organizationId: z.string().optional(),
	}),
	beforeLoad: async ({
		params,
		search,
		location,
		context: { queryClient },
	}) => {
		let auth = undefined;
		try {
			auth = await queryClient.ensureQueryData(
				orpc.auth.session.queryOptions(),
			);
		} catch (e) {
			throw redirect({
				to: "/$locale/auth/login",
				search: (s: any) => ({
					...s,
					redirect: location.pathname,
				}),
				params,
			});
		}

		const tenantId = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		let redirectHref = undefined;
		if (tenantId) {
			if (tenantId !== auth.session.activeLearnerOrganizationId) {
				await orpc.learner.organization.setActive.call({
					id: tenantId,
				});
			}
		} else {
			if (search.organizationId) {
				await orpc.learner.organization.setActive.call({
					id: search.organizationId,
				});
				const newUrl = new URL(env.VITE_SITE_URL + location.href);
				newUrl.searchParams.delete("organizationId");
				redirectHref = newUrl.href;
			}
			if (!auth.session.activeLearnerOrganizationId) {
				const organizations = await queryClient.ensureQueryData(
					orpc.learner.organization.get.queryOptions(),
				);
				await orpc.learner.organization.setActive.call({
					id: organizations[0].id,
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
	loader: ({ context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(orpc.auth.session.queryOptions()),
			queryClient.ensureQueryData(
				orpc.learner.organization.get.queryOptions(),
			),
			queryClient.ensureQueryData(orpc.auth.tenant.queryOptions()),
			queryClient.ensureQueryData(orpc.learner.course.get.queryOptions()),
			queryClient.ensureQueryData(
				orpc.learner.collection.get.queryOptions(),
			),
			queryClient.ensureQueryData(
				orpc.learner.course.available.queryOptions(),
			),
		]);
	},
});

function RouteComponent() {
	const locale = useLocale();
	const location = useLocation();

	const { isIframe } = Route.useRouteContext();

	const { data: auth } = useSuspenseQuery(orpc.auth.session.queryOptions());
	const { data: organizations } = useSuspenseQuery(
		orpc.learner.organization.get.queryOptions(),
	);
	const { data: tenantId } = useSuspenseQuery(
		orpc.auth.tenant.queryOptions(),
	);
	const { data: courses } = useSuspenseQuery(
		orpc.learner.course.get.queryOptions(),
	);
	const { data: collections } = useSuspenseQuery(
		orpc.learner.collection.get.queryOptions(),
	);
	const { data: availableCourses } = useSuspenseQuery(
		orpc.learner.course.available.queryOptions(),
	);

	const play = useMatch({
		from: "/$locale/learner/courses/$courseId/play",
		shouldThrow: false,
	});

	return (
		<SidebarProvider>
			{!isIframe && (
				<LearnerSidebar
					tenantId={tenantId ?? undefined}
					activeLearnerOrganizationId={
						auth.session.activeLearnerOrganizationId
					}
					organizations={organizations}
					availableCourses={availableCourses.filter(
						(c) =>
							!courses?.some(({ course }) => course?.id === c.id),
					)}
					courses={courses}
					collections={collections}
					user={auth.user}
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
