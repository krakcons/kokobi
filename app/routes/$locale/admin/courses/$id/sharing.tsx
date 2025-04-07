import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/Page";
import {
	getTeamConnectionsFn,
	inviteTeamConnectionFn,
	removeConnectionFn,
} from "@/server/handlers/connections";
import { Team, TeamTranslation } from "@/types/team";
import { TeamToCourseType } from "@/types/connections";
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
import { TeamsForm } from "@/components/forms/TeamsForm";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/$locale/admin/courses/$id/sharing")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params }) =>
		Promise.all([
			getTeamConnectionsFn({
				data: {
					id: params.id,
					type: "from-team",
				},
			}),
		]),
});

function RouteComponent() {
	const [connections] = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const params = Route.useParams();

	const inviteConnection = useMutation({
		mutationFn: inviteTeamConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const removeConnection = useMutation({
		mutationFn: removeConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const columns: ColumnDef<
		TeamToCourseType & { team: Team & TeamTranslation }
	>[] = [
		{
			accessorKey: "team.name",
			header: ({ column }) => (
				<DataTableColumnHeader title="Name" column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
			cell: ({ row: { original } }) => {
				const connectStatus = original.connectStatus;
				const connectType = original.connectType;
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
			TeamToCourseType & { team: Team & TeamTranslation }
		>([
			{
				name: "Delete",
				onClick: ({ teamId }) =>
					removeConnection.mutate({
						data: {
							id: params.id,
							type: "from-team",
							toId: teamId,
						},
					}),
			},
		]),
	];

	return (
		<Page>
			<PageHeader
				title="Sharing"
				description="Manage who can deliver this course."
			>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>Invite</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-xl w-full">
						<DialogHeader>
							<DialogTitle>Share Course</DialogTitle>
							<DialogDescription>
								Enter the identifier of the teams you want to
								share this course with.
							</DialogDescription>
						</DialogHeader>
						<TeamsForm
							onSubmit={(value) =>
								inviteConnection.mutateAsync(
									{
										data: {
											...value,
											id: params.id,
											type: "course",
										},
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
			<DataTable
				columns={columns}
				data={connections}
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
