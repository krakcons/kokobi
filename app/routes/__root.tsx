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
import "../styles/app.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async ({ context: { queryClient } }) => {
			const i18n = await queryClient.ensureQueryData(
				queryOptions.user.i18n,
			);

			// Handle locale
			let locale = location.pathname.split("/")[1];
			if (!locales.some(({ value }) => value === locale)) {
				locale = i18n.locale;
				throw redirect({
					replace: true,
					to: "/$locale/admin",
					params: { locale },
					search: (p) => p,
				});
			} else {
				await client.api.user.preferences.$put({
					json: {
						locale: locale as Locale,
					},
				});
			}
		},
		component: RootComponent,
	},
);

function RootComponent() {
	const { data: i18n } = useSuspenseQuery(queryOptions.user.i18n);

	return (
		<>
			<HeadContent />
			<IntlProvider i18n={i18n}>
				<Outlet />
			</IntlProvider>
			<Toaster />
		</>
	);
}
