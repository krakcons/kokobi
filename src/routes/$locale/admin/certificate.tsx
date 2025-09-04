import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { Page, PageHeader } from "@/components/Page";
import { formatDate } from "@/lib/date";
import { PendingComponent } from "@/components/PendingComponent";
import { PDFViewer } from "@react-pdf/renderer";
import { Certificate } from "@/components/Certificate";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
	pendingComponent: PendingComponent,
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(orpc.organization.current.queryOptions()),
});

function RouteComponent() {
	const locale = useLocale();
	const t = useTranslations("Certificate");

	const { data: organization } = useSuspenseQuery(
		orpc.organization.current.queryOptions(),
	);

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<ClientOnly>
				<PDFViewer className="h-[700px] w-full">
					<Certificate
						certificate={{
							connectOrganization: organization,
							contentOrganization: organization,
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
