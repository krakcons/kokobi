import { LocaleToggle } from "@/components/LocaleToggle";
import { PublicUserButton } from "@/components/sidebars/UserButton";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import type { SessionWithImpersonatedBy } from "better-auth/plugins";
import { z } from "zod";
import WebsiteLogo from "/favicon.ico";

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
	const t = useTranslations("UserButton");

	const { data: auth } = useSuspenseQuery(
		orpc.auth.optionalSession.queryOptions(),
	);

	return (
		<div className="flex flex-col">
			<header className="border-b-elevation-4 flex h-16 min-w-screen items-center justify-between border-b shadow-md dark:shadow-white/7">
				<div className="flex flex-row mx-auto w-full px-10 xl:px-0 xl:max-w-screen-xl items-center justify-between">
					<Link to="/$locale" from={Route.fullPath}>
						<img
							src={WebsiteLogo}
							alt="Website Logo"
							className="min-h-10 min-w-10 max-w-10 max-h-10 rounded-full hover:grayscale-50"
						/>
					</Link>
					<div className="flex flex-row">
						{auth.user && auth.session ? (
							<PublicUserButton
								user={auth.user}
								session={
									auth.session as SessionWithImpersonatedBy
								}
								signOutRedirect={`/${locale}/auth/login?redirect=${location.pathname}`}
							/>
						) : (
							<Button
								size="md"
								className=" px-4"
								onClick={() =>
									navigate({ to: "/$locale/auth/login" })
								}
							>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className={"truncate text-sm"}>
										{t.signin}
									</span>
								</div>
							</Button>
						)}
						<div className="mx-1"></div>
						<LocaleToggle />
					</div>
				</div>
			</header>
			<main className="flex flex-row mx-auto w-full xl:max-w-screen-xl p-6">
				<Outlet />
			</main>
		</div>
	);
}
