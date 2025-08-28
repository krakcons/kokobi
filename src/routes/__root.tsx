import { IntlProvider, Locale, locales } from "@/lib/locale";
import { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
	ErrorComponent,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { getI18nFn, updateI18nFn } from "@/server/handlers/i18n";
// @ts-ignore
import appCss from "@/index.css?url";
import { NotFound } from "@/components/NotFound";
import { getTeamByIdFn, getTenantFn } from "@/server/handlers/teams";
import { teamImageUrl } from "@/lib/file";
import { z } from "zod";
import { PendingComponent } from "@/components/PendingComponent";
import { useTheme } from "@/lib/theme";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		validateSearch: z.object({
			accountDialog: z.boolean().optional(),
		}),
		beforeLoad: async ({ location }) => {
			const i18n = await getI18nFn();
			let locale = i18n.locale;

			// Handle locale
			let pathLocale = location.pathname.split("/")[1];
			if (!["api", "cdn"].includes(pathLocale)) {
				if (!locales.some(({ value }) => value === pathLocale)) {
					throw redirect({
						replace: true,
						reloadDocument: true,
						href: `/${locale}${location.href}`,
					});
				}

				if (pathLocale !== locale) {
					locale = pathLocale as Locale;
					await updateI18nFn({
						data: {
							locale,
						},
					});
				}
			}

			return { locale };
		},
		errorComponent: ErrorComponent,
		notFoundComponent: NotFound,
		pendingComponent: PendingComponent,
		component: RootComponent,
		loader: async ({ context: { locale } }) => {
			const tenantId = await getTenantFn();
			let favicon = "/favicon.ico";
			let title = "Kokobi | Learn, Teach, Connect, and Grow";

			const i18n = await getI18nFn({
				headers: {
					locale,
				},
			});

			if (tenantId) {
				const tenant = await getTeamByIdFn({
					headers: {
						locale,
					},
					data: {
						teamId: tenantId,
					},
				});
				if (tenant.favicon)
					favicon = teamImageUrl(tenant, "favicon") || favicon;
				title = `${tenant.name}`;
			} else {
				title = i18n.messages.SEO.title;
			}

			return {
				i18n,
				meta: {
					favicon,
					title,
				},
			};
		},
		head: ({ loaderData }) => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: loaderData?.meta.title,
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				{
					rel: "icon",
					href: loaderData?.meta.favicon,
				},
				{
					rel: "preconnect",
					href: "https://fonts.googleapis.com",
				},
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
				},
			],
		}),
	},
);

function RootComponent() {
	const { i18n } = Route.useLoaderData();
	const { theme, systemTheme } = useTheme();

	return (
		<html className={theme === "system" ? systemTheme : theme}>
			<head>
				<HeadContent />
			</head>
			<body>
				<IntlProvider i18n={i18n}>
					<HeadContent />
					<Outlet />
					<Toaster />
				</IntlProvider>
				<Scripts />
			</body>
		</html>
	);
}
