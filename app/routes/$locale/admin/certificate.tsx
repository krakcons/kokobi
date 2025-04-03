import { createFileRoute } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { Page, PageHeader } from "@/components/Page";
import { formatDate } from "@/lib/date";
import { getTeamFn } from "@/server/handlers/teams";
import { lazy, Suspense } from "react";
import { env } from "@/env";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
	loader: () => getTeamFn(),
});

const CertificatePDF = lazy(() => import("@/components/CertificatePDF"));

function RouteComponent() {
	const team = Route.useLoaderData();
	const locale = useLocale();
	const t = useTranslations("Certificate");

	return (
		<Page>
			<PageHeader
				title="Certificate"
				description="View how your certificate will look"
			/>
			<Suspense>
				<CertificatePDF
					certificate={{
						teamName: team?.name,
						logo: `${env.VITE_SITE_URL}/cdn/${team.id}/${locale}/logo`,
						name: "John Doe",
						course: "Volunteer Training",
						completedAt: formatDate({
							date: new Date(),
							locale,
						}),
						t: t.pdf,
					}}
				/>
			</Suspense>
		</Page>
	);
}
