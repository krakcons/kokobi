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
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { EmailsForm } from "@/components/forms/EmailsForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import type { User } from "@/types/users";
import type { UserToCourseType } from "@/types/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import type { Module } from "@/types/module";
import type { Learner } from "@/types/learner";
import { dateSortingFn, formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { isModuleSuccessful } from "@/lib/scorm";
import { orpc } from "@/server/client";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/learners",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params, context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(
				orpc.course.learners.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.course.link.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
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
	const queryClient = useQueryClient();

	const { data: learners } = useSuspenseQuery(
		orpc.course.learners.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const { data: inviteLink } = useSuspenseQuery(
		orpc.course.link.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);

	const locale = useLocale();
	const t = useTranslations("Learners");
	const tUser = useTranslations("User");
	const tConnect = useTranslations("ConnectionActions");
	const tLearner = useTranslations("Learner");
	const tActions = useTranslations("Actions");
	const tLocales = useTranslations("Locales");
	const tForm = useTranslations("LearnersForm");

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.course.learners.queryOptions({
						input: {
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);
	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.course.learners.queryOptions({
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
					orpc.course.learners.queryOptions({
						input: {
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);
	const resendCompletionEmail = useMutation(
		orpc.course.resendCompletionEmail.mutationOptions(),
	);

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
			accessorKey: "user.name",
			header: ({ column }) => (
				<DataTableColumnHeader title={tUser.name} column={column} />
			),
			accessorFn: ({ user }) => user.name ?? undefined,
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
					updateConnection.mutate({
						id: params.courseId,
						senderType: "user",
						recipientType: "course",
						connectToId: user.id,
						connectStatus: "accepted",
					}),
				visible: ({ connection }) =>
					connection.connectType === "request",
			},
			{
				name: tConnect.reject,
				onClick: ({ user }) =>
					updateConnection.mutate({
						id: params.courseId,
						senderType: "user",
						recipientType: "course",
						connectToId: user.id,
						connectStatus: "rejected",
					}),
				visible: ({ connection }) =>
					connection.connectType === "request",
			},
			{
				name: tLearner.resend,
				onClick: ({ user }) =>
					createConnection.mutate({
						senderType: "course",
						recipientType: "user",
						id: params.courseId,
						emails: [user.email],
					}),
			},
			{
				name: tLearner.recertify,
				onClick: ({ attempt }) =>
					resendCompletionEmail.mutate({
						attemptId: attempt!.id,
						id: params.courseId,
					}),
				visible: ({ attempt }) =>
					!!attempt &&
					isModuleSuccessful({
						completionStatus: course.completionStatus,
						status: attempt.status,
					}),
			},
			{
				name: tActions.delete,
				onClick: ({ user }) =>
					removeConnection.mutate({
						senderType: "course",
						recipientType: "user",
						id: params.courseId,
						connectToId: user.id,
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
								createConnection.mutateAsync(
									{
										senderType: "course",
										recipientType: "user",
										...value,
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
