import {
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { PageHeader } from "@/components/Page";
import { queryOptions } from "@/lib/api";
import { Learner } from "@/types/learner";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/$locale/admin/courses/$id/learners")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			queryOptions.courses.learners({
				param: { id: params.id },
			}),
		);
	},
});

const columns: ColumnDef<Learner>[] = [
	{
		accessorKey: "firstName",
		header: ({ column }) => (
			<DataTableColumnHeader title="First Name" column={column} />
		),
	},
	{
		accessorKey: "lastName",
		header: ({ column }) => (
			<DataTableColumnHeader title="Last Name" column={column} />
		),
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader title="Email" column={column} />
		),
	},
];

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const { data: learners } = useSuspenseQuery(
		queryOptions.courses.learners({
			param: { id: params.id },
		}),
	);

	return (
		<div>
			<PageHeader
				title="Learners"
				description="Manage learners for this course."
			/>
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
		</div>
	);
}
