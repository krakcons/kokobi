import { OrganizationIcon } from "@/components/OrganizationIcon";
import { PageHeader } from "@/components/Page";
import { buttonVariants } from "@/components/ui/button";
import { organizationImageUrl } from "@/lib/file";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Blocks, Book } from "lucide-react";

export const Route = createFileRoute("/$locale/_public/")({
	component: Home,
	loader: async ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(orpc.auth.tenant.queryOptions()),
		]),
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
	const { data: tenant } = useSuspenseQuery(orpc.auth.tenant.queryOptions());

	if (tenant) {
		return (
			<div>
				<OrganizationIcon
					src={organizationImageUrl(tenant, "logo")}
					className="my-4"
				/>
				<PageHeader
					title={tenant.name}
					description={t["organization-description"]}
				/>
				<CTA />
			</div>
		);
	} else {
		return (
			<div className="flex w-full flex-col items-start gap-8 justify-center py-10">
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
		);
	}
}
