import { buttonVariants } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { getTeamByIdFn, getTenantFn } from "@/server/handlers/teams";
import { FloatingPage, PageHeader } from "@/components/Page";
import { Blocks, Book } from "lucide-react";
import { TeamAvatar, TeamAvatarImage } from "@/components/ui/team-avatar";
import { env } from "@/env";

export const Route = createFileRoute("/$locale/")({
	component: Home,
	loader: async () => {
		let team = undefined;
		const tenantId = await getTenantFn();
		if (tenantId) {
			team = await getTeamByIdFn({
				data: {
					teamId: tenantId,
				},
			});
		}
		return {
			team,
		};
	},
});

const CTA = () => {
	const t = useTranslations("Home");
	return (
		<div className="flex items-center gap-2">
			<Link
				to="/$locale/learner"
				from={Route.fullPath}
				className={buttonVariants()}
			>
				<Book />
				{t["go-to-learning"]}
			</Link>
			<Link
				to="/$locale/admin"
				from={Route.fullPath}
				className={buttonVariants({ variant: "outline" })}
			>
				<Blocks />
				{t["go-to-admin"]}
			</Link>
		</div>
	);
};

function Home() {
	const t = useTranslations("Home");
	const { team } = Route.useLoaderData();
	const locale = useLocale();

	if (team) {
		return (
			<FloatingPage className="flex flex-col max-w-screen-lg mx-auto text-center">
				<TeamAvatar>
					<TeamAvatarImage
						src={`${env.VITE_SITE_URL}/cdn/${team.id}/${locale}/logo`}
					/>
				</TeamAvatar>
				<PageHeader
					title={team.name}
					description={t["team-description"]}
				/>
				<CTA />
			</FloatingPage>
		);
	} else {
		return (
			<>
				<header className="border-b-elevation-4 flex h-14 w-full items-center justify-center border-b px-6">
					<nav className="flex w-full max-w-screen-lg items-center justify-end"></nav>
				</header>
				<main className="mx-auto w-full max-w-screen-xl">
					<div className="flex w-full flex-col items-start gap-8 justify-center p-10 sm:p-20">
						<h1 className="flex flex-col gap-3 text-5xl sm:text-7xl font-extrabold">
							{t.title["1"]}
							<span className="whitespace-nowrap text-green-400">
								{t.title["2"]}
							</span>
						</h1>
						<div className="flex">
							<p>{t.description}</p>
						</div>
						<CTA />
					</div>
				</main>
			</>
		);
	}
}

export default Home;
