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
import type { UserToCollectionType } from "@/types/connections";
import type { User } from "@/types/users";
import CopyButton from "@/components/CopyButton";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { useLocale, useTranslations } from "@/lib/locale";
import { dateSortingFn, formatDate } from "@/lib/date";
import { orpc } from "@/server/client";

export const Route = createFileRoute(
	"/$locale/admin/collections/$collectionId/learners",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ params, context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				orpc.collection.learners.queryOptions({
					input: {
						id: params.collectionId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.collection.connection.link.queryOptions({
					input: {
						id: params.collectionId,
					},
				}),
			),
		]),
});

function RouteComponent() {
	const search = Route.useSearch();
	const params = Route.useParams();
	const [learners, inviteLink] = Route.useLoaderData();
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const t = useTranslations("Learners");
	const tUser = useTranslations("User");
	const tLearner = useTranslations("Learner");
	const tForm = useTranslations("LearnersForm");
	const tActions = useTranslations("Actions");
	const tConnect = useTranslations("ConnectionActions");
	const locale = useLocale();

	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);
	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);
	const removeConnection = useMutation(
		orpc.connection.delete.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);
	const navigate = Route.useNavigate();

	const columns: ColumnDef<UserToCollectionType & { user: User }>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title={tUser.email} column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.status}
					column={column}
				/>
			),
			cell: ({ row: { original } }) => (
				<ConnectionStatusBadge {...original} />
			),
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
			accessorKey: "connection.createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={tLearner.connectedAt}
					column={column}
				/>
			),
			accessorFn: ({ createdAt }) =>
				formatDate({
					date: createdAt,
					locale,
					type: "detailed",
				}),
			sortUndefined: "last",
			sortingFn: (a, b) =>
				dateSortingFn(a.original.createdAt, b.original.createdAt),
		},
		createDataTableActionsColumn<UserToCollectionType & { user: User }>([
			{
				name: tConnect.accept,
				onClick: ({ userId }) =>
					updateConnection.mutate({
						id: params.collectionId,
						senderType: "user",
						recipientType: "collection",
						connectToId: userId,
						connectStatus: "accepted",
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: tConnect.reject,
				onClick: ({ userId }) =>
					updateConnection.mutate({
						id: params.collectionId,
						senderType: "user",
						recipientType: "collection",
						connectToId: userId,
						connectStatus: "rejected",
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: tLearner.resend,
				onClick: ({ user }) =>
					createConnection.mutate({
						senderType: "collection",
						recipientType: "user",
						id: params.collectionId,
						emails: [user.email],
					}),
			},
			{
				name: tActions.delete,
				onClick: ({ collectionId, user }) =>
					removeConnection.mutate({
						senderType: "collection",
						recipientType: "user",
						id: collectionId,
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
										senderType: "collection",
										recipientType: "user",
										id: params.collectionId,
										...value,
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
