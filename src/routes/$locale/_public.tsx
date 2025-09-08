import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale } from "@/lib/locale";
import { getAuthFn } from "@/server/handlers/auth";
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
	const navigate = Route.useNavigate();

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
				{auth.user ? (
					<PublicUserButton
						user={auth.user}
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
