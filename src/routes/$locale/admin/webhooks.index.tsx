import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { Secret } from "@/components/Secret";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { Webhook } from "@/types/webhooks";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/webhooks/")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				orpc.organization.webhook.get.queryOptions(),
			),
		]),
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const t = useTranslations("Webhooks");
	const tActions = useTranslations("Actions");
	const queryClient = useQueryClient();
	const { data: webhooks } = useSuspenseQuery(
		orpc.organization.webhook.get.queryOptions(),
	);

	const updateWebhook = useMutation(
		orpc.organization.webhook.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.organization.webhook.get.queryOptions(),
				);
			},
		}),
	);

	const deleteWebhook = useMutation(
		orpc.organization.webhook.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.organization.webhook.get.queryOptions(),
				);
			},
		}),
	);

	const columns: ColumnDef<Webhook>[] = [
		{
			accessorKey: "url",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.url} column={column} />
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.descriptionHeader}
					column={column}
				/>
			),
		},
		{
			accessorKey: "events",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.events} column={column} />
			),
			accessorFn: ({ events }) =>
				events && events.length > 0 ? events.join(", ") : t.eventsEmpty,
		},
		{
			accessorKey: "secret",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.secret} column={column} />
			),
			cell: ({ row: { original } }) => (
				<Secret secret={original.secret} />
			),
		},
		{
			accessorKey: "enabled",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.enabled} column={column} />
			),
			cell: ({ row: { original } }) => (
				<Checkbox
					className="size-5"
					id={original.id}
					name={original.id}
					checked={original.enabled}
					onCheckedChange={(checked) =>
						updateWebhook.mutateAsync({
							...original,
							enabled: checked as boolean,
						})
					}
				/>
			),
		},
		createDataTableActionsColumn<Webhook>([
			{
				name: tActions.edit,
				onClick: (webhook) =>
					navigate({
						to: "/$locale/admin/webhooks/$webhookId",
						params: {
							webhookId: webhook.id,
						},
					}),
			},
			{
				name: tActions.delete,
				onClick: (webhook) =>
					deleteWebhook.mutateAsync({
						id: webhook.id,
					}),
			},
		]),
	];

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Link to="/$locale/admin/webhooks/create" from={Route.fullPath}>
					<Button>
						<Plus />
						{tActions.create}
					</Button>
				</Link>
			</PageHeader>
			<DataTable
				columns={columns}
				data={webhooks}
				search={search}
				onSearchChange={(search) => navigate({ search })}
			/>
		</Page>
	);
}
