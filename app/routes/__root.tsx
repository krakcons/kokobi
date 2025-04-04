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
import { teams } from "@/server/db/schema";

const getTenant = createServerFn({ method: "GET" }).handler(async () => {
	const host = getRequestHost();

	if (host === env.VITE_ROOT_DOMAIN) {
		return null;
	}

	const team = await db.query.teams.findFirst({
		where: eq(teams.customDomain, host),
	});

	return team ?? null;
});

// http://localhost:3000/courses/019600d9-c45e-7000-9483-7d88eb3d9ee8?learnerId=019600db-5b76-7000-a930-77de7c04eb60
// Redirect to /en/play/019600d9-c45e-7000-9483-7d88eb3d9ee8/courses/019600d9-c45e-7000-9483-7d88eb3d9ee8
// http://localhost:3000/en/play/0195f239-a289-7000-97df-fc9798fbf9b6/courses/019600d9-c45e-7000-9483-7d88eb3d9ee8/join

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async ({ location }) => {
			const { locale } = await getI18nFn();

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
					await updateI18nFn({
						data: {
							locale: pathLocale as Locale,
						},
					});
				}

				const tenant = await getTenant();
				if (tenant) {
					if (
						!location.pathname.startsWith(
							`/${pathLocale}/play/${tenant.id}`,
						)
					) {
						throw notFound();
					}
				}
			}
		},
		pendingComponent: () => (
			<FloatingPage>
				<LoaderCircle className="animate-spin size-12" />
			</FloatingPage>
		),
		component: RootComponent,
		loader: () => getI18nFn(),
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
