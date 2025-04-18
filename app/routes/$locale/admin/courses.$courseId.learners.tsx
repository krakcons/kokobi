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
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { EmailsForm } from "@/components/forms/EmailsForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { getTeamFn } from "@/server/handlers/teams";
import { createConnectionLink } from "@/lib/invite";
import { User } from "@/types/users";
import { UserToCourseType } from "@/types/connections";
import {
	getTeamConnectionsFn,
	inviteUsersConnectionFn,
	removeConnectionFn,
	teamConnectionResponseFn,
} from "@/server/handlers/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/learners",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ params }) => {
		return Promise.all([
			getTeamConnectionsFn({
				data: {
					type: "course",
					id: params.courseId,
				},
			}),
			getTeamFn({
				data: {
					type: "admin",
				},
			}),
		]);
	},
});

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const [learners, team] = Route.useLoaderData();
	const router = useRouter();

	const connectionResponse = useMutation({
		mutationFn: teamConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const inviteConnection = useMutation({
		mutationFn: inviteUsersConnectionFn,
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

	const columns: ColumnDef<UserToCourseType & { user: User }>[] = [
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
			cell: ({ row: { original } }) => {
				return <ConnectionStatusBadge {...original} />;
			},
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
		createDataTableActionsColumn<UserToCourseType & { user: User }>([
			{
				name: "Accept",
				onClick: ({ userId }) =>
					connectionResponse.mutate({
						data: {
							id: params.courseId,
							type: "course",
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
							id: params.courseId,
							type: "course",
							toId: userId,
							connectStatus: "rejected",
						},
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: "Delete",
				onClick: ({ userId }) =>
					removeConnection.mutate({
						data: {
							id: params.courseId,
							type: "course",
							toId: userId,
						},
					}),
			},
		]),
	];

	const inviteLink = createConnectionLink({
		domain: team.domains.length > 0 ? team.domains[0] : undefined,
		type: "course",
		id: params.courseId,
		teamId: team.id,
	});

	return (
		<Page>
			<PageHeader
				title="Learners"
				description="Manage learners for this course."
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
								Enter emails below and submit to invite them to
								the course.
							</DialogDescription>
						</DialogHeader>
						<EmailsForm
							onSubmit={(value) =>
								inviteConnection.mutateAsync(
									{
										data: {
											...value,
											id: params.courseId,
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
