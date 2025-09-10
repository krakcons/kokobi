import {
	IntlProvider,
	rootLocaleMiddleware,
	i18nQueryOptions,
} from "@/lib/locale";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	ErrorComponent,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { NotFound } from "@/components/NotFound";
import { organizationImageUrl } from "@/lib/file";
import { z } from "zod";
import { PendingComponent } from "@/components/PendingComponent";
import { useTheme } from "@/lib/theme";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { orpc } from "@/server/client";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	publicOrganizationId?: string;
}>()({
	validateSearch: z.object({
		accountDialog: z.boolean().optional(),
	}),
	beforeLoad: async ({ location, context: { queryClient } }) => {
		await rootLocaleMiddleware({
			location,
			ignorePaths: ["api", "cdn", "assets"],
			queryClient,
		});
	},
	errorComponent: ErrorComponent,
	notFoundComponent: NotFound,
	pendingComponent: PendingComponent,
	component: RootComponent,
	loader: async ({ context: { queryClient } }) => {
		const i18n = await queryClient.ensureQueryData(i18nQueryOptions({}));
		const tenant = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		let favicon = "/favicon.ico";
		let title = "Kokobi | Learn, Teach, Connect, and Grow ";

		if (tenant) {
			if (tenant.favicon)
				favicon = organizationImageUrl(tenant, "favicon") || favicon;
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
});

function RootComponent() {
	const { theme, systemTheme } = useTheme();
	const { data: i18n } = useSuspenseQuery(i18nQueryOptions({}));

	return (
		<html
			className={theme === "system" ? systemTheme : theme}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<IntlProvider i18n={i18n}>
					<Outlet />
				</IntlProvider>
				<ReactQueryDevtools initialIsOpen={false} />
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
