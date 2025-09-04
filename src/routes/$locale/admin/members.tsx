import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { authClient, authQueryOptions } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { Role } from "@/types/team";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

export const Route = createFileRoute("/$locale/admin/members")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				authQueryOptions.organization.listMembers,
			),
			queryClient.ensureQueryData(
				authQueryOptions.organization.listInvitations,
			),
		]),
});

type MemberTable = {
	id: string;
	userId?: string;
	email: string;
	type: "member" | "invite";
	status?: string;
	role: string;
};

function RouteComponent() {
	const { data: auth } = useSuspenseQuery(orpc.auth.session.queryOptions());
	const tRoles = useTranslations("TeamRole");
	const t = useTranslations("Members");
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();

	const {
		data: { data: members },
	} = useSuspenseQuery(authQueryOptions.organization.listMembers);
	const {
		data: { data: invitations },
	} = useSuspenseQuery(authQueryOptions.organization.listInvitations);

	const removeMember = useMutation({
		mutationFn: async ({ memberId }: { memberId: string }) => {
			const { data, error } = await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
				organizationId: auth.session.activeOrganizationId!,
			});
			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(
				authQueryOptions.organization.listMembers,
			);
		},
	});

	const cancelInvitation = useMutation({
		mutationFn: async ({ invitationId }: { invitationId: string }) => {
			const { data, error } =
				await authClient.organization.cancelInvitation({
					invitationId,
				});
			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(
				authQueryOptions.organization.listInvitations,
			);
		},
	});

	const columns: ColumnDef<MemberTable>[] = [
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.email} column={column} />
			),
			cell: (cell) => (
				<div className="h-9 flex items-center">
					<p>{cell.row.original.email}</p>
				</div>
			),
		},
		{
			accessorKey: "role",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.role} column={column} />
			),
			accessorFn: ({ role }) => tRoles[role as Role],
		},
		createDataTableActionsColumn<MemberTable>([
			{
				name: t.edit,
				onClick: ({ type, id }) => {
					if (type === "invite") {
						toast.error(
							"Member must accept invitation before editing",
						);
					} else {
						navigate({
							to: "/$locale/admin/members/$id",
							params: { id },
							from: Route.fullPath,
						});
					}
				},
			},
			{
				name: t.remove,
				onClick: ({ type, id }) => {
					if (type === "invite") {
						cancelInvitation.mutate({
							invitationId: id,
						});
					} else {
						removeMember.mutate({
							memberId: id,
						});
					}
				},
			},
		]),
	];

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<DataTable
				data={
					[
						...(invitations ?? [])
							.filter(
								({ status }) =>
									!["canceled", "accepted"].includes(status),
							)
							.map((invitation) => ({
								id: invitation.id,
								email: invitation.email,
								type: "invite" as const,
								status: invitation.status,
								role: invitation.role,
							})),
						...(members?.members ?? []).map((member) => ({
							id: member.id,
							userId: member.userId,
							type: "member" as const,
							email: member.user.email,
							role: member.role,
						})),
					] as MemberTable[]
				}
				columns={columns}
				from={Route.fullPath}
			/>
		</Page>
	);
}
