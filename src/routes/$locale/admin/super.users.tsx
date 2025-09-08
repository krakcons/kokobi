import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { authClient } from "@/lib/auth.client";
import { orpc } from "@/server/client";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserWithRole } from "better-auth/plugins";

export const Route = createFileRoute("/$locale/admin/super/users")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(
				orpc.auth.super.user.get.queryOptions(),
			),
		]);
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { data: users } = useSuspenseQuery(
		orpc.auth.super.user.get.queryOptions(),
	);
	const impersonate = useMutation({
		mutationFn: ({ id }: { id: string }) =>
			authClient.admin.impersonateUser({
				userId: id,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
	});
	const columns: ColumnDef<UserWithRole>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader title={"Name"} column={column} />
			),
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader title={"Email"} column={column} />
			),
		},
		//{
		//	accessorKey: "banned",
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title={"Banned"} column={column} />
		//	),
		//},
		createDataTableActionsColumn<UserWithRole>([
			{
				name: "Impersonate",
				onClick: ({ id }) => {
					navigate({
						to: "/$locale/admin",
					});
					impersonate.mutate({
						id,
					});
				},
			},
		]),
	];
	return (
		<Page>
			<PageHeader
				title="Manage Users"
				description="View users, impersonate, etc"
			/>
			<DataTable
				columns={columns}
				data={users.users.map((user) => ({
					...user,
					createdAt: new Date(user.createdAt),
					updatedAt: new Date(user.updatedAt),
				}))}
				search={search}
				onSearchChange={(value) => {
					navigate({
						search: value,
					});
				}}
			/>
		</Page>
	);
}
