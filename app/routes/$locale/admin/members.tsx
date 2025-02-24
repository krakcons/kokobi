import {
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { queryOptions } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { Role, User } from "@/types/users";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/$locale/admin/members")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.team.members);
	},
});

function RouteComponent() {
	const locale = useLocale();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data: members } = useSuspenseQuery(queryOptions.team.members);
	const t = useTranslations("Role");

	const columns: ColumnDef<User & { role: Role; joinedAt: Date }>[] = [
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
		},
		{
			accessorKey: "role",
			accessorFn: ({ role }) => t[role],
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Role" />
			),
		},
		{
			accessorKey: "joinedAt",
			accessorFn: ({ joinedAt }) =>
				formatDate({ date: joinedAt, locale, type: "detailed" }),
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Joined" />
			),
		},
	];

	return (
		<Page>
			<PageHeader title="Members" description="Manage your members" />
			<DataTable
				data={members.map((member) => ({
					...member,
					createdAt: new Date(member.createdAt),
					updatedAt: new Date(member.updatedAt),
					joinedAt: new Date(member.joinedAt),
				}))}
				columns={columns}
				search={search}
				onSearchChange={(search) => {
					navigate({
						search,
					});
				}}
			/>
		</Page>
	);
}
