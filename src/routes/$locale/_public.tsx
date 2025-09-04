import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getAuthFn } from "@/server/handlers/auth";
import { z } from "zod";
import { useLocale, useTranslations } from "@/lib/locale";
import { PublicUserButton } from "@/components/sidebars/PublicUserButton";
import { buttonVariants } from "@/components/ui/button";
import { Home } from "lucide-react";

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
	const t = useTranslations("Errors");

	return (
		<div className="flex flex-col">
			<header className="border-b-elevation-4 flex h-16 w-full items-center justify-center border-b px-6">
				<a
					href="/"
					className={buttonVariants({
						variant: "outline",
					})}
				>
					<Home />
					{t.NotFound.home}
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
