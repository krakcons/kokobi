import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Locale, locales } from "@/lib/locale";
import { getLocale, setLocale } from "@/lib/locale/actions";
import { i18nQueryOptions } from "@/lib/locale/query";
import { SessionValidationResult } from "@/server/auth";
import { getAuth } from "@/server/auth/actions";
import appCss from "@/styles/app.css?url";
import { seo } from "@/utils/seo";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	redirect,
	useParams,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Meta, Scripts } from "@tanstack/start";
import * as React from "react";
import { Toaster } from "sonner";
import { IntlProvider, useLocale } from "use-intl";

export type Context = SessionValidationResult & { queryClient: QueryClient };
export const Route = createRootRouteWithContext<Context>()({
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
	beforeLoad: async ({ location, context }) => {
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

		// Handle auth
		const auth = await getAuth();

		// if (auth.user && auth.user.locale && auth.user.locale !== locale) {
		// 	Promise.all([
		// 		updateUserFn({ data: { locale: locale as Locale } }),
		// 		updateAnonymousSessionFn({
		// 			data: { locale: locale as Locale },
		// 		}),
		// 	]);
		// }

		// Return context
		return {
			...context,
			...auth,
			locale: locale as Locale,
		} satisfies Context & { locale: Locale };
	},
	notFoundComponent: () => <NotFound />,
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const { locale } = Route.useRouteContext();
	const { data: i18n } = useSuspenseQuery(i18nQueryOptions(locale as Locale));

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className="overflow-x-hidden"
		>
			<head>
				<Meta />
			</head>
			<body>
				<IntlProvider {...i18n}>{children}</IntlProvider>
				<TanStackRouterDevtools position="bottom-right" />
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
