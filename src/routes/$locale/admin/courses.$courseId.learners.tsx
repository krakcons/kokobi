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
import {
	getConnectionLinkFn,
	updateTeamConnectionFn,
} from "@/server/handlers/connections";
import { User } from "@/types/users";
import { UserToCourseType } from "@/types/connections";
import {
	getTeamConnectionsFn,
	inviteUsersConnectionFn,
	removeConnectionFn,
} from "@/server/handlers/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { Module } from "@/types/module";
import { Learner } from "@/types/learner";
import { dateSortingFn, formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { resendCompletionEmailFn } from "@/server/handlers/users.modules";

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
	const t = useTranslations("Learners");
	const tUser = useTranslations("User");
	const tConnect = useTranslations("ConnectionActions");
	const tLearner = useTranslations("Learner");
	const tActions = useTranslations("Actions");
	const tLocales = useTranslations("Locales");
	const tForm = useTranslations("LearnersForm");

	const connectionResponse = useMutation({
		mutationFn: updateTeamConnectionFn,
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
	const resendCompletionEmail = useMutation({
		mutationFn: resendCompletionEmailFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const columns: ColumnDef<LearnerTableType>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title={tUser.email} column={column} />
			),
		},
		{
			accessorKey: "connection.connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.connectStatus}
					column={column}
				/>
			),
			cell: ({ row: { original } }) => {
				return <ConnectionStatusBadge {...original.connection} />;
			},
		},
		{
			accessorKey: "user.firstName",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tUser.firstName}
					column={column}
				/>
			),
			accessorFn: ({ user }) => user.firstName ?? undefined,
			sortUndefined: "last",
		},
		{
			accessorKey: "user.lastName",
			header: ({ column }) => (
				<DataTableColumnHeader title={tUser.lastName} column={column} />
			),
			accessorFn: ({ user }) => user.lastName ?? undefined,
			sortUndefined: "last",
		},
		{
			accessorKey: "attempt.status",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.status}
					column={column}
				/>
			),
			sortUndefined: "last",
			accessorFn: ({ attempt }) =>
				attempt && tLearner.statuses[attempt.status],
		},
		{
			accessorKey: "attempt.score",
			header: ({ column }) => (
				<DataTableColumnHeader title={tLearner.score} column={column} />
			),
			accessorFn: ({ attempt }) =>
				attempt &&
				attempt.score &&
				attempt.score.raw !== undefined &&
				attempt.score.max !== undefined
					? attempt.score.raw + " / " + attempt.score.max
					: undefined,
			sortingFn: (a, b) =>
				Number(a.original.attempt?.score?.raw) -
				Number(b.original.attempt?.score?.raw),
			sortUndefined: "last",
		},
		{
			accessorKey: "attempt.startedAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.startedAt}
					column={column}
				/>
			),
			accessorFn: ({ attempt }) =>
				formatDate({
					date: attempt?.createdAt,
					locale,
					type: "detailed",
				}),
			sortUndefined: "last",
			sortingFn: (a, b) =>
				dateSortingFn(
					a.original.attempt?.createdAt,
					b.original.attempt?.createdAt,
				),
		},
		{
			accessorKey: "attempt.completedAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.completedAt}
					column={column}
				/>
			),
			accessorFn: ({ attempt }) =>
				formatDate({
					date: attempt?.completedAt ?? undefined,
					locale,
					type: "detailed",
				}),
			sortUndefined: "last",
			sortingFn: (a, b) =>
				dateSortingFn(
					a.original.attempt?.completedAt ?? undefined,
					b.original.attempt?.completedAt ?? undefined,
				),
		},
		{
			accessorKey: "connection.createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.connectedAt}
					column={column}
				/>
			),
			accessorFn: ({ connection }) =>
				formatDate({
					date: connection?.createdAt,
					locale,
					type: "detailed",
				}),
			sortUndefined: "last",
			sortingFn: (a, b) =>
				dateSortingFn(
					a.original.connection.createdAt,
					b.original.connection.createdAt,
				),
		},
		{
			accessorKey: "module.language",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.moduleLocale}
					column={column}
				/>
			),
			sortUndefined: "last",
			accessorFn: ({ module }) => module && tLocales[module.locale],
		},
		{
			accessorKey: "module.versionNumber",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.moduleVersion}
					column={column}
				/>
			),
			sortUndefined: "last",
		},
		createDataTableActionsColumn<LearnerTableType>([
			{
				name: tConnect.accept,
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
				name: tConnect.reject,
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
				name: tLearner.resend,
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
				name: tLearner.recertify,
				onClick: ({ attempt }) =>
					resendCompletionEmail.mutate({
						data: {
							attemptId: attempt!.id,
							courseId: params.courseId,
						},
					}),
				visible: ({ attempt }) => !!attempt?.completedAt,
			},
			{
				name: tActions.delete,
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
