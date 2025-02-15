import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Locale, locales } from "@/lib/locale";
import { getLocale, setLocale } from "@/lib/locale/actions";
import { i18nQueryOptions } from "@/lib/locale/query";
import appCss from "@/styles/app.css?url";
import { seo } from "@/utils/seo";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	redirect,
	useLocation,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import * as React from "react";
import { Toaster } from "sonner";
import { IntlProvider } from "use-intl";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		head: () => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				...seo({
					title: "Kokobi | Learn, Teach, Connect, and Grow",
					description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
				}),
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/favicon.ico" },
			],
		}),
		errorComponent: (props) => {
			return (
				<RootDocument>
					<DefaultCatchBoundary {...props} />
				</RootDocument>
			);
		},
		beforeLoad: async ({ location }) => {
			// Handle locale
			let locale = location.pathname.split("/")[1];
			if (!locales.some(({ value }) => value === locale)) {
				locale = await getLocale();
				throw redirect({
					href: `/${locale}${location.pathname}${location.searchStr}`,
				});
			} else {
				await setLocale({ data: locale as Locale });
			}
		},
		notFoundComponent: () => <NotFound />,
		component: RootComponent,
	},
);

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const { pathname } = useLocation();
	const locale = pathname.split("/")[1];
	const { data: i18n } = useSuspenseQuery(i18nQueryOptions(locale as Locale));

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className="overflow-x-hidden"
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<IntlProvider {...i18n}>{children}</IntlProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
