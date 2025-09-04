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
import { EditingLocaleSchema } from "@/types/router";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient, authQueryOptions } from "@/lib/auth.client";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: EditingLocaleSchema,
	beforeLoad: async ({ params, location, context: { queryClient } }) => {
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
		if (tenantId) {
			if (tenantId !== auth.session.activeOrganizationId) {
				try {
					await orpc.learner.organization.update.call({
						id: tenantId,
					});
					throw redirect({
						href: location.href,
						reloadDocument: true,
					});
				} catch (e) {
					throw redirect({
						to: "/$locale/not-admin",
						search: {
							organizationId: tenantId,
						},
						params: {
							locale: params.locale,
						},
					});
				}
			}
		} else {
			if (!auth.session.activeOrganizationId) {
				const { data: userOrganizations } =
					await queryClient.ensureQueryData(
						authQueryOptions.organization.list,
					);
				if (userOrganizations?.length === 0) {
					throw redirect({
						to: "/$locale/auth/create-organization",
						params: {
							locale: params.locale,
						},
					});
				} else {
					await authClient.organization.setActive({
						organizationId: userOrganizations?.[0].id!,
					});
					throw redirect({
						href: location.href,
						reloadDocument: true,
					});
				}
			}
		}
	},
	loader: ({ context: { queryClient } }) => {
		Promise.all([
			queryClient.ensureQueryData(authQueryOptions.organization.list),
			queryClient.ensureQueryData(authQueryOptions.session),
			queryClient.ensureQueryData(orpc.auth.tenant.queryOptions()),
			queryClient.ensureQueryData(orpc.course.get.queryOptions()),
			queryClient.ensureQueryData(orpc.collection.get.queryOptions()),
		]);
	},
});

function RouteComponent() {
	const t = useTranslations("AdminSidebar");
	const tLocales = useTranslations("Locales");
	const locale = useLocale();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const editingLocale = search.locale ?? locale;

	const { data: organizations } = useSuspenseQuery(
		orpc.organization.get.queryOptions(),
	);
	const { data: auth } = useSuspenseQuery(orpc.auth.session.queryOptions());
	const { data: tenantId } = useSuspenseQuery(
		orpc.auth.tenant.queryOptions(),
	);
	const { data: courses } = useSuspenseQuery(orpc.course.get.queryOptions());
	const { data: collections } = useSuspenseQuery(
		orpc.collection.get.queryOptions(),
	);

	return (
		<SidebarProvider>
			<AdminSidebar
				tenantId={tenantId ?? undefined}
				activeOrganizationId={auth.session.activeOrganizationId!}
				invitations={[]}
				organizations={organizations}
				courses={courses}
				collections={collections}
				user={auth.user}
				role={auth.member!.role}
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
