import {
	createFileRoute,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { LocaleToggle } from "@/components/LocaleToggle";
import {
	getLearnerUserTeamsFn,
	updateUserTeamFn,
} from "@/server/handlers/users.teams";
import { getAuthFn } from "@/server/handlers/auth";
import { getTenantFn } from "@/server/handlers/teams";
import { z } from "zod";
import { env } from "@/env";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { useLocale } from "@/lib/locale";
import { orpc } from "@/server/client";
import { PublicUserButton } from "@/components/sidebars/PublicUserButton";

const getIsIframeFn = createServerFn().handler(() => {
	const secFestDest = getHeader("sec-fetch-dest");
	return secFestDest === "iframe";
});

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
			<header className="border-b-elevation-4 flex h-14 w-full items-center justify-center border-b px-6">
				<PublicUserButton
					user={auth.user}
					signOutRedirect={`/${locale}/auth/login?redirect=${location.pathname}`}
				/>
				<nav className="flex w-full max-w-screen-lg items-center justify-end"></nav>
				<LocaleToggle />
			</header>
			<Outlet />
		</div>
	);
}
