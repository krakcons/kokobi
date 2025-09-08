import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale } from "@/lib/locale";
import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { z } from "zod";
import WebsiteLogo from "/favicon.ico";
import { PublicUserButton } from "@/components/sidebars/UserButton";
import { Button } from "@/components/ui/button";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { SessionWithImpersonatedBy } from "better-auth/plugins";

export const Route = createFileRoute("/$locale/_public")({
	component: RouteComponent,
	validateSearch: z.object({
		teamId: z.string().optional(),
	}),
	loader: async ({ context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(
				orpc.auth.optionalSession.queryOptions(),
			),
		]);
	},
});

function RouteComponent() {
	const locale = useLocale();
	const location = useLocation();
	const navigate = Route.useNavigate();

	const { data: auth } = useSuspenseQuery(
		orpc.auth.optionalSession.queryOptions(),
	);

	return (
		<div className="flex flex-col">
			<header className="border-b-elevation-4 flex h-16 w-full items-center justify-center border-b px-6 shadow-md dark:shadow-white/7">
				<Link to="/$locale" from={Route.fullPath}>
					<img
						src={WebsiteLogo}
						alt="Website Logo"
						className="h-10 w-10 rounded-full border-1 hover:grayscale-50"
					/>
				</Link>
				<nav className="flex w-full max-w-screen-lg items-center justify-end"></nav>
				{auth.user && auth.session ? (
					<PublicUserButton
						user={auth.user}
						session={auth.session as SessionWithImpersonatedBy}
						signOutRedirect={`/${locale}/auth/login?redirect=${location.pathname}`}
					/>
				) : (
					<Button
						size="md"
						className=" px-4"
						onClick={() => navigate({ to: "/$locale/auth/login" })}
					>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className={"truncate text-sm"}>Sign In</span>
						</div>
					</Button>
				)}
				<div className="mx-1"></div>
				<LocaleToggle />
			</header>
			<Outlet />
		</div>
	);
}
