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
import { getI18nFn, updateI18nFn } from "@/server/handlers/user";
import appCss from "@/index.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		beforeLoad: async ({ context: { queryClient }, location }) => {
			const { locale } = await queryClient.ensureQueryData({
				queryKey: [getI18nFn.url],
				queryFn: () => getI18nFn({ data: {} }),
			});

			// Handle locale
			let pathLocale = location.pathname.split("/")[1];
			if (pathLocale === "api") {
				return;
			}

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
		},
		pendingComponent: () => (
			<FloatingPage>
				<LoaderCircle className="animate-spin size-12" />
			</FloatingPage>
		),
		component: RootComponent,
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
					title: "Kokobi",
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
	const { data: i18n } = useSuspenseQuery({
		queryKey: [getI18nFn.url],
		queryFn: () => getI18nFn({ data: {} }),
	});

	return (
		<IntlProvider i18n={i18n}>
			<HeadContent />
			<Outlet />
			<Toaster />
		</IntlProvider>
	);
}
