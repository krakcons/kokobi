import { TableSearchSchema } from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { queryOptions } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/members")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.keys.all);
	},
});

function RouteComponent() {
	return (
		<Page>
			<PageHeader title="Members" description="Manage your members" />
			Hello "/$locale/admin/members"!
		</Page>
	);
}
