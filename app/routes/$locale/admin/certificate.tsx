import { createFileRoute } from "@tanstack/react-router";
import { Certificate } from "@/components/Certificate";
import { PDFViewer } from "@react-pdf/renderer";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "@/lib/locale";
import { Page, PageHeader } from "@/components/Page";
import { formatDate } from "@/lib/date";
import { getTeamFn } from "@/server/handlers/teams";
import { env } from "@/env";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: [getTeamFn.url],
			queryFn: () => getTeamFn({ data: {} }),
		});
	},
});
function RouteComponent() {
	const locale = useLocale();
	const { data: team } = useSuspenseQuery({
		queryKey: [getTeamFn.url],
		queryFn: () => getTeamFn({ data: {} }),
	});
	const t = useTranslations("Certificate");

	return (
		<Page>
			<PageHeader
				title="Certificate"
				description="View how your certificate will look"
			/>
			<PDFViewer className="h-[700px] w-full">
				<Certificate
					{...{
						teamName: team?.name,
						teamLogo: `${env.VITE_SITE_URL}/cdn/${team.id}/${locale}/logo`,
						name: "John Doe",
						course: "Volunteer Training",
						completedAt: formatDate({
							date: new Date(),
							locale,
						}),
						t: t.pdf,
					}}
				/>
			</PDFViewer>
		</Page>
	);
}
