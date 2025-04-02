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
import { Locale, locales, LocaleSchema } from "@/lib/locale";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { LanguageToggle } from "@/components/LanguageToggle";
import { z } from "zod";
import { env } from "@/env";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getAuthFn, getTeamsFn } from "@/server/handlers/user";
import { getCollectionsFn } from "@/server/handlers/collections";
import { getCoursesFn } from "@/server/handlers/courses";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: z.object({
		locale: LocaleSchema.optional(),
	}),
	beforeLoad: async ({ context: { queryClient } }) => {
		const { user, teamId } = await queryClient.ensureQueryData({
			queryKey: [getAuthFn.url],
			queryFn: () => getAuthFn(),
		});

		if (!user) {
			throw redirect({
				href: env.VITE_SITE_URL + "/api/auth/google",
			});
		}

		if (!teamId) {
			throw redirect({
				to: "/$locale/create-team",
			});
		}
	},
	loader: async ({ context: { queryClient } }) => {
		Promise.all([
			queryClient.ensureQueryData({
				queryKey: [getTeamsFn.url],
				queryFn: () => getTeamsFn({ data: {} }),
			}),
			queryClient.ensureQueryData({
				queryKey: [getCoursesFn.url],
				queryFn: () => getCoursesFn({ data: {} }),
			}),
			queryClient.ensureQueryData({
				queryKey: [getCollectionsFn.url],
				queryFn: () => getCollectionsFn({ data: {} }),
			}),
		]);
	},
});

function RouteComponent() {
	const t = useTranslations("Nav");
	const userLocale = useLocale();
	const { locale } = useSearch({
		from: "/$locale/admin",
	});
	const navigate = useNavigate();

	const editingLocale = locale ?? userLocale;

	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>
				<header className="p-4 flex flex-row items-center justify-between">
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
							<SelectTrigger className="gap-1">
								<p className="text-sm text-muted-foreground">
									{t.top.editing}
								</p>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{locales.map(({ label, value }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<LanguageToggle />
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
