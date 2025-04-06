import { useLocale, locales, useTranslations } from "@/lib/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/date";
import { useState } from "react";
import { EmailsForm } from "@/components/forms/EmailsForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	getCollectionCoursesFn,
	getCollectionLearnersFn,
} from "@/server/handlers/collections";
import {
	inviteConnectionFn,
	removeConnectionFn,
	teamConnectionResponseFn,
} from "@/server/handlers/connections";
import { UserToCollectionType } from "@/types/connections";
import { User } from "@/types/users";
import { createCollectionLink } from "@/lib/invite";
import { getTeamFn } from "@/server/handlers/teams";
import CopyButton from "@/components/CopyButton";

export const Route = createFileRoute("/$locale/admin/collections/$id/learners")(
	{
		component: RouteComponent,
		validateSearch: TableSearchSchema,
		loader: ({ params }) =>
			Promise.all([
				getCollectionLearnersFn({
					data: {
						id: params.id,
					},
				}),
				getTeamFn(),
			]),
	},
);

function RouteComponent() {
	const search = Route.useSearch();
	const params = Route.useParams();
	const [learners, team] = Route.useLoaderData();
	const [open, setOpen] = useState(false);
	const t = useTranslations("Learner");
	const locale = useLocale();
	const router = useRouter();

	const createConnection = useMutation({
		mutationFn: inviteConnectionFn,
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
	const queryClient = useQueryClient();

	const columns: ColumnDef<UserToCollectionType & { user: User }>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title="Email" column={column} />
			),
		},
		{
			accessorKey: "connectType",
			accessorFn: ({ connectType }) =>
				connectType.slice(0, 1).toUpperCase() + connectType.slice(1),
			header: ({ column }) => (
				<DataTableColumnHeader title="Type" column={column} />
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
						<div>
							{connectStatus.slice(0, 1).toUpperCase() +
								connectStatus.slice(1)}
						</div>
						{connectStatus === "pending" &&
							connectType === "request" && (
								<>
									<Button
										onClick={() =>
											connectionResponse.mutate({
												data: {
													id: params.id,
													type: "collection",
													userId: original.userId,
													connectStatus: "accepted",
												},
											})
										}
									>
										Accept
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											connectionResponse.mutate({
												data: {
													id: params.id,
													type: "collection",
													userId: original.userId,
													connectStatus: "rejected",
												},
											})
										}
									>
										Reject
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
		createDataTableActionsColumn<UserToCollectionType & { user: User }>([
			{
				name: "Delete",
				onClick: ({ collectionId, user }) =>
					removeConnection.mutate(
						{
							data: {
								type: "collection",
								id: collectionId,
								userId: user.id,
							},
						},
						{
							onSuccess: () =>
								queryClient.invalidateQueries({
									queryKey: [
										getCollectionLearnersFn.url,
										params.id,
									],
								}),
						},
					),
			},
		]),
	];

	const inviteLink = createCollectionLink({
		domain: team.domains.length > 0 ? team.domains[0] : undefined,
		collectionId: params.id,
		teamId: team.id,
		path: "request",
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
