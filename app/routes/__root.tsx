import { NotFound } from "@/components/NotFound";
import { queryOptions } from "@/lib/api";
import { IntlProvider } from "@/lib/locale";
import { seo } from "@/lib/seo";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
} from "@tanstack/react-router";
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
		loader: async ({ context: { queryClient } }) => {
			await queryClient.ensureQueryData(queryOptions.user.i18n);
		},
		notFoundComponent: () => <NotFound />,
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
