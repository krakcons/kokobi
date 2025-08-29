import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { type Locale, locales } from "@/lib/locale";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { LocaleToggle } from "@/components/LocaleToggle";
import { AdminSidebar } from "@/components/sidebars/AdminSidebar";
import { getAuthFn } from "@/server/handlers/auth";
import {
	getAdminUserTeamsFn,
	updateUserTeamFn,
} from "@/server/handlers/users.teams";
import { EditingLocaleSchema } from "@/types/router";
import { getTeamCourseConnectionsFn } from "@/server/handlers/connections";
import { getTenantFn } from "@/server/handlers/teams";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: EditingLocaleSchema,
	beforeLoad: async ({ params, location }) => {
		const auth = await getAuthFn();

		if (!auth.user) {
			throw redirect({
				to: "/$locale/auth/login",
				search: (s: any) => ({
					...s,
					redirect: location.pathname,
				}),
				params,
			});
		}

		const tenantId = await getTenantFn();
		if (tenantId) {
			if (tenantId !== auth.teamId) {
				try {
					await updateUserTeamFn({
						data: {
							teamId: tenantId,
							type: "admin",
						},
					});
					throw redirect({
						href: location.href,
						reloadDocument: true,
					});
				} catch (e) {
					throw redirect({
						to: "/$locale/not-admin",
						search: {
							teamId: tenantId,
						},
						params: {
							locale: params.locale,
						},
					});
				}
			}
		} else {
			if (!auth.teamId) {
				const userTeams = await getAdminUserTeamsFn();
				const validTeams = userTeams.filter(
					({ connectStatus }) => connectStatus === "accepted",
				);
				if (validTeams.length === 0) {
					throw redirect({
						to: "/$locale/create-team",
						params: {
							locale: params.locale,
						},
					});
				} else {
					await updateUserTeamFn({
						data: {
							teamId: validTeams[0].teamId,
							type: "admin",
						},
					});
					throw redirect({
						href: location.href,
						reloadDocument: true,
					});
				}
			}
		}
	},
	loader: ({ context: { queryClient } }) =>
		Promise.all([
			getAuthFn(),
			getAdminUserTeamsFn(),
			queryClient.ensureQueryData(orpc.course.get.queryOptions()),
			queryClient.ensureQueryData(orpc.collection.get.queryOptions()),
			getTeamCourseConnectionsFn({
				data: {
					type: "to",
				},
			}),
			getTenantFn(),
		]),
});

function RouteComponent() {
	const t = useTranslations("AdminSidebar");
	const tLocales = useTranslations("Locales");
	const locale = useLocale();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const editingLocale = search.locale ?? locale;
	const [auth, teams, courses, collections, connections, tenantId] =
		Route.useLoaderData();

	return (
		<SidebarProvider>
			<AdminSidebar
				tenantId={tenantId ?? undefined}
				teamId={auth.teamId!}
				teams={teams}
				courses={courses}
				collections={collections}
				connections={connections}
				user={auth.user!}
				role={auth.role!}
			/>
			<SidebarInset className="max-w-full overflow-hidden">
				<header className="p-4 flex flex-row w-full items-center justify-between">
					<SidebarTrigger />
					<div className="flex flex-row items-center gap-2">
						<Select
							value={editingLocale}
							onValueChange={(value) => {
								navigate({
									// @ts-ignore
									search: (s) => ({
										...s,
										locale: value as Locale,
									}),
								});
							}}
						>
							<SelectTrigger className="gap-1 min-w-38">
								<p className="text-sm text-muted-foreground">
									{t.editing}
								</p>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{locales.map(({ value }) => (
									<SelectItem key={value} value={value}>
										{tLocales[value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<LocaleToggle />
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
