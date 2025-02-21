import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { client, queryOptions } from "@/lib/api";
import { type Locale, locales } from "@/lib/locale";
import { IntlProvider } from "@/lib/locale";
import { i18nQueryOptions } from "@/lib/locale/query";
import { seo } from "@/lib/seo";
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
			links: [{ rel: "icon", href: "/favicon.ico" }],
		}),
		errorComponent: (props) => {
			return (
				<RootDocument>
					<DefaultCatchBoundary {...props} />
				</RootDocument>
			);
		},
		beforeLoad: async ({ location, context: { queryClient } }) => {
			const i18n = await queryClient.ensureQueryData(
				queryOptions.user.i18n,
			);

			// Handle locale
			let locale = location.pathname.split("/")[1];
			if (!locales.some(({ value }) => value === locale)) {
				locale = i18n.locale;
				throw redirect({
					href: `/${locale}${location.pathname}${location.searchStr}`,
				});
			} else {
				await client.api.user.preferences.$put({
					json: { locale: locale as Locale },
				});
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
	const { data: i18n } = useSuspenseQuery(queryOptions.user.i18n);

	return (
		<html
			lang={i18n.locale}
			suppressHydrationWarning
			className="overflow-x-hidden"
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<IntlProvider i18n={i18n}>{children}</IntlProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
