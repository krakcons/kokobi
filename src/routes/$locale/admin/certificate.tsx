import { createFileRoute } from "@tanstack/react-router";
import { Certificate } from "@/components/Certificate";
import { PDFViewer } from "@react-pdf/renderer";
import { queryOptions } from "@/lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "@/lib/locale";
import { Page, PageHeader } from "@/components/Page";
import { formatDate } from "@/lib/date";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.team.me({}));
	},
});
function RouteComponent() {
	const locale = useLocale();
	const { data: team } = useSuspenseQuery(queryOptions.team.me({}));
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
						teamLogo: `${window.location.origin}/cdn/${team.id}/${locale}/logo`,
						name: "John Doe",
						course: "Volunteer Training",
						completedAt: formatDate({
							date: new Date(),
							locale,
						}),
						text: {
							title: t.pdf.title,
							message: t.pdf.message,
							congratulations: {
								1: t.pdf.congratulations["1"],
								2: t.pdf.congratulations["2"],
							},
							date: t.pdf.date,
						},
					}}
				/>
			</PDFViewer>
		</Page>
	);
}
