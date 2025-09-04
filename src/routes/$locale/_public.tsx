import { LocaleToggle } from "@/components/LocaleToggle";
import { PublicUserButton } from "@/components/sidebars/PublicUserButton";
import { useLocale } from "@/lib/locale";
import { getAuthFn } from "@/server/handlers/auth";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { z } from "zod";
import WebsiteLogo from "../../../public/favicon.ico";

export const Route = createFileRoute("/$locale/_public")({
	component: RouteComponent,
	validateSearch: z.object({
		teamId: z.string().optional(),
	}),
	loader: () => {
		return Promise.all([getAuthFn()]);
	},
});

function RouteComponent() {
	const [auth] = Route.useLoaderData();
	const locale = useLocale();
	const location = useLocation();

	return (
		<div className="flex flex-col">
			<header className="border-b-elevation-4 flex h-16 w-full items-center justify-center border-b px-6 shadow-md dark:shadow-white/7">
				<a href="/">
					<img
						src={WebsiteLogo}
						alt="Website Logo"
						className="h-10 w-10 rounded-full border-1 hover:grayscale-50"
					/>
				</a>
				<nav className="flex w-full max-w-screen-lg items-center justify-end"></nav>
				<PublicUserButton
					user={auth.user}
					signOutRedirect={`/${locale}/auth/login?redirect=${location.pathname}`}
				/>
				<div className="mx-1"></div>
				<LocaleToggle />
			</header>
			<Outlet />
		</div>
	);
}
