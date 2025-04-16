import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { EmailsForm } from "@/components/forms/EmailsForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	getTeamConnectionsFn,
	inviteUsersConnectionFn,
	removeConnectionFn,
	teamConnectionResponseFn,
} from "@/server/handlers/connections";
import { UserToCollectionType } from "@/types/connections";
import { User } from "@/types/users";
import { getTeamFn } from "@/server/handlers/teams";
import CopyButton from "@/components/CopyButton";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { createRequestLink } from "@/lib/invite";

export const Route = createFileRoute("/$locale/admin/collections/$id/learners")(
	{
		component: RouteComponent,
		validateSearch: TableSearchSchema,
		loader: ({ params }) =>
			Promise.all([
				getTeamConnectionsFn({
					data: {
						type: "collection",
						id: params.id,
					},
				}),
				getTeamFn({
					data: {
						type: "admin",
					},
				}),
			]),
	},
);

function RouteComponent() {
	const search = Route.useSearch();
	const params = Route.useParams();
	const [learners, team] = Route.useLoaderData();
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const createConnection = useMutation({
		mutationFn: inviteUsersConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const connectionResponse = useMutation({
		mutationFn: teamConnectionResponseFn,
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
	const navigate = Route.useNavigate();

	const columns: ColumnDef<UserToCollectionType & { user: User }>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title="Email" column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
			cell: ({ row: { original } }) => (
				<ConnectionStatusBadge {...original} />
			),
		},
		{
			accessorKey: "user.firstName",
			header: ({ column }) => (
				<DataTableColumnHeader title="First Name" column={column} />
			),
		},
		{
			accessorKey: "user.lastName",
			header: ({ column }) => (
				<DataTableColumnHeader title="Last Name" column={column} />
			),
		},
		createDataTableActionsColumn<UserToCollectionType & { user: User }>([
			{
				name: "Accept",
				onClick: ({ userId }) =>
					connectionResponse.mutate({
						data: {
							id: params.id,
							type: "collection",
							toId: userId,
							connectStatus: "accepted",
						},
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: "Reject",
				onClick: ({ userId }) =>
					connectionResponse.mutate({
						data: {
							id: params.id,
							type: "collection",
							toId: userId,
							connectStatus: "rejected",
						},
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: "Delete",
				onClick: ({ collectionId, user }) =>
					removeConnection.mutate({
						data: {
							type: "collection",
							id: collectionId,
							toId: user.id,
						},
					}),
			},
		]),
	];

	const inviteLink = createRequestLink({
		domain: team.domains.length > 0 ? team.domains[0] : undefined,
		type: "collection",
		id: params.id,
		teamId: team.id,
	});

	return (
		<Page>
			<PageHeader
				title="Learners"
				description="Manage learners for this collection."
			>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							Create
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-xl w-full">
						<DialogHeader>
							<DialogTitle>Invite Learners</DialogTitle>
							<DialogDescription>
								Enter emails and submit below to invite them to
								the collection.
							</DialogDescription>
						</DialogHeader>
						<EmailsForm
							onSubmit={(value) =>
								createConnection.mutateAsync(
									{
										data: {
											type: "collection",
											id: params.id,
											...value,
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
			<div className="bg-secondary rounded flex gap-2 items-center px-3 py-2 overflow-x-auto">
				<p className="truncate text-sm text-muted-foreground">
					{inviteLink}
				</p>
				<CopyButton text={inviteLink} />
			</div>
			<DataTable
				data={learners}
				columns={columns}
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
