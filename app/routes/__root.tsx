import { IntlProvider, Locale, locales } from "@/lib/locale";
import { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
	notFound,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { FloatingPage } from "@/components/Page";
import { LoaderCircle } from "lucide-react";
import { getI18nFn, updateI18nFn } from "@/server/handlers/user";
import appCss from "@/index.css?url";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "vinxi/http";
import { env } from "@/server/env";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { domains } from "@/server/db/schema";

const getTenant = createServerFn({ method: "GET" }).handler(async () => {
	const hostname = getRequestHost();

	if (hostname === env.VITE_ROOT_DOMAIN) {
		return null;
	}

	const domain = await db.query.domains.findFirst({
		where: eq(domains.hostname, hostname),
	});

	return domain ? domain.teamId : null;
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async ({ location }) => {
			const i18n = await getI18nFn();
			let locale = i18n.locale;

			// Handle locale
			let pathLocale = location.pathname.split("/")[1];
			if (!["api", "cdn"].includes(pathLocale)) {
				console.log(pathLocale);
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

				const teamId = await getTenant();
				if (teamId) {
					if (
						!location.pathname.startsWith(
							`/${pathLocale}/learner/${teamId}`,
						)
					) {
						throw notFound();
					}
				}
			}

			return { locale };
		},
		pendingComponent: () => (
			<FloatingPage>
				<LoaderCircle className="animate-spin size-12" />
			</FloatingPage>
		),
		component: RootComponent,
		loader: ({ context: { locale } }) =>
			getI18nFn({
				headers: {
					locale,
				},
			}),
		head: () => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: "Kokobi | Learn, Teach, Connect, and Grow",
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
			],
		}),
	},
);

function RootComponent() {
	const i18n = Route.useLoaderData();

	return (
		<html>
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
