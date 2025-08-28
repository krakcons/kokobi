import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/Page";
import {
	createTeamConnectionFn,
	getTeamCourseConnectionsFn,
	removeConnectionFn,
	updateTeamConnectionFn,
} from "@/server/handlers/connections";
import type { Team, TeamTranslation } from "@/types/team";
import type { TeamToCourseType } from "@/types/connections";
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
import { useTranslations } from "@/lib/locale";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { env } from "@/env";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/sharing",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params }) =>
		Promise.all([
			getTeamCourseConnectionsFn({
				data: {
					id: params.courseId,
					type: "from",
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
	const t = useTranslations("Sharing");
	const tActions = useTranslations("Actions");
	const tConnect = useTranslations("ConnectionActions");
	const tForm = useTranslations("TeamsForm");

	const createTeamConnection = useMutation({
		mutationFn: createTeamConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const updateTeamConnection = useMutation({
		mutationFn: updateTeamConnectionFn,
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
				<DataTableColumnHeader title={t.table.name} column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.status} column={column} />
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
				name: tConnect.accept,
				onClick: ({ teamId }) =>
					updateTeamConnection.mutate({
						data: {
							id: params.courseId,
							type: "course-from-team",
							toId: teamId,
							connectStatus: "accepted",
						},
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: tConnect.reject,
				onClick: ({ teamId }) =>
					updateTeamConnection.mutate({
						data: {
							id: params.courseId,
							type: "course-from-team",
							toId: teamId,
							connectStatus: "rejected",
						},
					}),
				visible: ({ connectType }) => connectType === "request",
			},
			{
				name: tActions.delete,
				onClick: ({ teamId }) =>
					removeConnection.mutate({
						data: {
							id: params.courseId,
							type: "from-team",
							toId: teamId,
						},
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
						<TeamsForm
							onSubmit={(value) =>
								createTeamConnection.mutateAsync(
									{
										data: {
											...value,
											connectType: "invite",
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
