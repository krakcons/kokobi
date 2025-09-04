import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/Page";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { OrganizationsForm } from "@/components/forms/OrganizationsForm";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useTranslations } from "@/lib/locale";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { env } from "@/env";
import { orpc } from "@/server/client";
import type { Organization } from "@/types/organization";
import type { ConnectionType } from "@/types/connections";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/sharing",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params, context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				orpc.course.sharedOrganizations.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
		]),
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [open, setOpen] = useState(false);
	const params = Route.useParams();
	const t = useTranslations("Sharing");
	const tActions = useTranslations("Actions");
	const tConnect = useTranslations("ConnectionActions");
	const tForm = useTranslations("OrganizationsForm");
	const queryClient = useQueryClient();

	const { data: sharedOrganizations } = useSuspenseQuery(
		orpc.course.sharedOrganizations.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);

	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.course.sharedOrganizations.queryOptions({
						input: {
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);
	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.course.sharedOrganizations.queryOptions({
						input: {
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);
	const removeConnection = useMutation(
		orpc.connection.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.course.sharedOrganizations.queryOptions({
						input: {
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);

	const columns: ColumnDef<
		Organization & {
			connection: ConnectionType;
		}
	>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.name} column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.status} column={column} />
			),
			cell: ({ row: { original } }) => {
				const connectStatus = original.connection.connectStatus;
				const connectType = original.connection.connectType;
				if (!connectStatus || !connectType) {
					return null;
				}
				return (
					<div className="flex items-center gap-2">
						<ConnectionStatusBadge
							connectStatus={connectStatus}
							connectType={connectType}
						/>
					</div>
				);
			},
		},
		createDataTableActionsColumn<
			Organization & { connection: ConnectionType }
		>([
			{
				name: tConnect.accept,
				onClick: ({ id }) =>
					updateConnection.mutate({
						senderType: "organization",
						recipientType: "course",
						id: params.courseId,
						connectToId: id,
						connectStatus: "accepted",
					}),
				visible: ({ connection }) =>
					connection?.connectType === "request",
			},
			{
				name: tConnect.reject,
				onClick: ({ id }) =>
					updateConnection.mutate({
						senderType: "organization",
						recipientType: "course",
						id: params.courseId,
						connectToId: id,
						connectStatus: "rejected",
					}),
				visible: ({ connection }) =>
					connection?.connectType === "request",
			},
			{
				name: tActions.delete,
				onClick: ({ id }) =>
					removeConnection.mutate({
						senderType: "organization",
						recipientType: "course",
						id: params.courseId,
						connectToId: id,
					}),
			},
		]),
	];

	const inviteLink = `${env.VITE_SITE_URL}/admin/courses/${params.courseId}`;

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							{tActions.create}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-xl w-full">
						<DialogHeader>
							<DialogTitle>{tForm.title}</DialogTitle>
							<DialogDescription>
								{tForm.description}
							</DialogDescription>
						</DialogHeader>
						<OrganizationsForm
							onSubmit={(value) =>
								createConnection.mutateAsync(
									{
										...value,
										senderType: "course",
										recipientType: "organization",
										id: params.courseId,
									},
									{
										onSuccess: () => setOpen(false),
									},
								)
							}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
			<div className="bg-secondary rounded flex gap-2 items-center px-3 py-2 overflow-x-auto">
				<p className="truncate text-sm text-muted-foreground">
					{inviteLink}
				</p>
				<CopyButton text={inviteLink} />
			</div>
			<DataTable
				columns={columns}
				data={sharedOrganizations}
				search={search}
				onSearchChange={(search) => {
					navigate({
						search: (prev) => ({
							...prev,
							...search,
						}),
					});
				}}
			/>
		</Page>
	);
}
