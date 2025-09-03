import { buttonVariants } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslations } from "@/lib/locale";
import { FloatingPage, PageHeader } from "@/components/Page";
import { Blocks, Book } from "lucide-react";
import { TeamIcon } from "@/components/TeamIcon";
import { teamImageUrl } from "@/lib/file";
import { LocaleToggle } from "@/components/LocaleToggle";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/")({
	component: Home,
	loader: async ({ context: { queryClient } }) => {
		let team = undefined;
		const tenantId = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		if (tenantId) {
			team = await queryClient.fetchQuery(
				orpc.organization.id.queryOptions({
					input: {
						id: tenantId,
					},
				}),
			);
		}

		return { team };
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

	if (team) {
		return (
			<FloatingPage>
				<TeamIcon src={teamImageUrl(team, "logo")} className="my-4" />
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
					<LocaleToggle />
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
