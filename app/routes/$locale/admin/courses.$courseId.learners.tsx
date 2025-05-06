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
import { getConnectionLinkFn } from "@/server/handlers/connections";
import { User } from "@/types/users";
import { UserToCourseType } from "@/types/connections";
import {
	getTeamConnectionsFn,
	inviteUsersConnectionFn,
	removeConnectionFn,
	teamConnectionResponseFn,
} from "@/server/handlers/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { Module } from "@/types/module";
import { Learner } from "@/types/learner";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";

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
			getConnectionLinkFn({
				data: {
					type: "course",
					id: params.courseId,
				},
			}),
		]);
	},
});

type LearnerTableType = {
	user: User;
	connection: UserToCourseType;
	attempt?: Learner;
	module: Module | null;
};

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const [learners, inviteLink] = Route.useLoaderData();
	const router = useRouter();
	const locale = useLocale();
	const tLearner = useTranslations("Learner");

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

	const columns: ColumnDef<LearnerTableType>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title="Email" column={column} />
			),
		},
		{
			accessorKey: "connection.connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
			cell: ({ row: { original } }) => {
				return <ConnectionStatusBadge {...original.connection} />;
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
		{
			accessorKey: "attempt.status",
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
			accessorFn: ({ attempt }) =>
				attempt && tLearner.statuses[attempt.status],
		},
		{
			accessorKey: "attempt.score",
			header: ({ column }) => (
				<DataTableColumnHeader title="Score" column={column} />
			),
			accessorFn: ({ attempt }) => {
				attempt &&
					["failed", "passed"].includes(attempt.status) &&
					attempt.score &&
					attempt.score.raw + " / " + attempt.score.max;
			},
		},
		{
			accessorKey: "attempt.startedAt",
			header: ({ column }) => (
				<DataTableColumnHeader title="Started At" column={column} />
			),
			accessorFn: ({ attempt }) =>
				formatDate({
					date: attempt?.createdAt,
					locale,
					type: "detailed",
				}),
		},
		{
			accessorKey: "attempt.completedAt",
			header: ({ column }) => (
				<DataTableColumnHeader title="Completed At" column={column} />
			),
			accessorFn: ({ attempt }) =>
				formatDate({
					date: attempt?.completedAt,
					locale,
					type: "detailed",
				}),
		},
		createDataTableActionsColumn<LearnerTableType>([
			{
				name: "Accept",
				onClick: ({ user }) =>
					connectionResponse.mutate({
						data: {
							id: params.courseId,
							type: "course",
							toId: user.id,
							connectStatus: "accepted",
						},
					}),
				visible: ({ connection }) =>
					connection.connectType === "request",
			},
			{
				name: "Reject",
				onClick: ({ user }) =>
					connectionResponse.mutate({
						data: {
							id: params.courseId,
							type: "course",
							toId: user.id,
							connectStatus: "rejected",
						},
					}),
				visible: ({ connection }) =>
					connection.connectType === "request",
			},
			{
				name: "Resend Invite",
				onClick: ({ user }) =>
					inviteConnection.mutate({
						data: {
							id: params.courseId,
							type: "course",
							emails: [user.email],
						},
					}),
			},
			{
				name: "Delete",
				onClick: ({ user }) =>
					removeConnection.mutate({
						data: {
							id: params.courseId,
							type: "course",
							toId: user.id,
						},
					}),
			},
		]),
	];

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
