import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { Page, PageHeader } from "@/components/Page";
import { formatDate } from "@/lib/date";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { PendingComponent } from "@/components/PendingComponent";
import { teamImageUrl } from "@/lib/file";
import { PDFViewer } from "@react-pdf/renderer";
import { Certificate } from "@/components/Certificate";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
	pendingComponent: PendingComponent,
	loader: () =>
		getUserTeamFn({
			data: {
				type: "admin",
			},
		}),
});

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
			<ClientOnly>
				<PDFViewer className="h-[700px] w-full">
					<Certificate
						certificate={{
							connectTeam: team,
							contentTeam: team,
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
			</ClientOnly>
		</Page>
	);
}
