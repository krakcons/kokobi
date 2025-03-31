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
import { queryOptions } from "@/lib/api";
import { useLocale, useTranslations } from "@/lib/locale";
import { LanguageToggle } from "@/components/LanguageToggle";
import { z } from "zod";
import { env } from "@/env";
import { AdminSidebar } from "@/components/AdminSidebar";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: z.object({
		locale: LocaleSchema.optional(),
	}),
	beforeLoad: async ({ context: { queryClient } }) => {
		const { user } = await queryClient.ensureQueryData(
			queryOptions.user.me,
		);

		if (!user) {
			throw redirect({
				href: env.VITE_API_URL + "/api/auth/google",
			});
		}

		const { locale, teamId } = await queryClient.ensureQueryData(
			queryOptions.user.preferences,
		);

		if (!teamId) {
			throw redirect({
				to: "/$locale/create-team",
				params: {
					locale,
				},
			});
		}
	},
	loader: async ({ context: { queryClient } }) => {
		Promise.all([
			queryClient.ensureQueryData(queryOptions.user.teams),
			queryClient.ensureQueryData(queryOptions.courses.all),
			queryClient.ensureQueryData(queryOptions.collections.all),
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
