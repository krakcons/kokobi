import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/Page";

export const Route = createFileRoute("/$locale/admin/certificate")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Page>
			<PageHeader
				title="Certificate"
				description="View how your certificate will look"
			/>
			WIP
		</Page>
	);
}
