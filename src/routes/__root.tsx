import { client, queryOptions } from "@/lib/api";
import { IntlProvider, Locale, locales } from "@/lib/locale";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	redirect,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { FloatingPage } from "@/components/Page";
import { LoaderCircle } from "lucide-react";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async ({ context: { queryClient }, location }) => {
			const { locale } = await queryClient.ensureQueryData(
				queryOptions.user.i18n,
			);

			// Handle locale
			let pathLocale = location.pathname.split("/")[1];
			if (!locales.some(({ value }) => value === pathLocale)) {
				throw redirect({
					replace: true,
					reloadDocument: true,
					href: `/${locale}${location.href}`,
				});
			}

			if (pathLocale !== locale) {
				await client.api.user.preferences.$put({
					json: {
						locale: pathLocale as Locale,
					},
				});
			}
		},
		pendingComponent: () => (
			<FloatingPage>
				<LoaderCircle className="animate-spin size-12" />
			</FloatingPage>
		),
		component: RootComponent,
	},
);

function RootComponent() {
	const { data: i18n } = useSuspenseQuery(queryOptions.user.i18n);

	return (
		<IntlProvider i18n={i18n}>
			<HeadContent />
			<Outlet />
			<Toaster />
		</IntlProvider>
	);
}
