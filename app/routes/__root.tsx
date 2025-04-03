import { IntlProvider, Locale, locales } from "@/lib/locale";
import { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { FloatingPage } from "@/components/Page";
import { LoaderCircle } from "lucide-react";
import { getI18nFn, updateI18nFn } from "@/server/handlers/user";
import appCss from "@/index.css?url";

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
