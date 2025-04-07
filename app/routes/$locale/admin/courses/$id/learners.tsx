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
import { useTranslations } from "@/lib/locale";
import { useState } from "react";
import { EmailsForm } from "@/components/forms/EmailsForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { getTeamFn } from "@/server/handlers/teams";
import { createCourseLink } from "@/lib/invite";
import { User } from "@/types/users";
import { UserToCourseType } from "@/types/connections";
import {
	getTeamConnectionsFn,
	inviteConnectionFn,
	removeConnectionFn,
	teamConnectionResponseFn,
} from "@/server/handlers/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";

export const Route = createFileRoute("/$locale/admin/courses/$id/learners")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ params }) => {
		return Promise.all([
			getTeamConnectionsFn({
				data: {
					type: "course",
					id: params.id,
				},
			}),
			getTeamFn(),
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
	const tConnect = useTranslations("ConnectionActions");

	const connectionResponse = useMutation({
		mutationFn: teamConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const inviteConnection = useMutation({
		mutationFn: inviteConnectionFn,
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
				const connectStatus = original.connectStatus;
				const connectType = original.connectType;
				return (
					<div className="flex items-center gap-2">
						<ConnectionStatusBadge
							connectStatus={connectStatus}
							connectType={connectType}
						/>
						{connectStatus === "pending" &&
							connectType === "request" && (
								<>
									<Button
										onClick={() =>
											connectionResponse.mutate({
												data: {
													id: params.id,
													type: "course",
													toId: original.userId,
													connectStatus: "accepted",
												},
											})
										}
									>
										{tConnect.accept}
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											connectionResponse.mutate({
												data: {
													id: params.id,
													type: "course",
													toId: original.userId,
													connectStatus: "rejected",
												},
											})
										}
									>
										{tConnect.reject}
									</Button>
								</>
							)}
					</div>
				);
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
				name: "Delete",
				onClick: ({ userId }) =>
					removeConnection.mutate({
						data: {
							id: params.id,
							type: "course",
							toId: userId,
						},
					}),
			},
		]),
	];

	const inviteLink = createCourseLink({
		domain: team.domains.length > 0 ? team.domains[0] : undefined,
		courseId: params.id,
		teamId: team.id,
		path: "request",
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
