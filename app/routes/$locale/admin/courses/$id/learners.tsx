import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { queryOptions } from "@/lib/api";
import { locales } from "@/lib/locale";
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "use-intl";
import dayjs from "dayjs";

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

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const { data: learners } = useSuspenseQuery(
		queryOptions.courses.learners({
			param: { id: params.id },
		}),
	);
	const t = useTranslations("Learner");

	const columns: ColumnDef<
		Learner & { module: Module | null; joinLink?: string }
	>[] = [
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
		{
			accessorKey: "startedAt",
			accessorFn: ({ startedAt }) =>
				dayjs(startedAt).format("DD-MMM-YYYY HH:mm:ss"),
			header: ({ column }) => (
				<DataTableColumnHeader title="Started At" column={column} />
			),
		},
		{
			accessorKey: "completedAt",
			accessorFn: ({ completedAt }) =>
				dayjs(completedAt).format("DD-MMM-YYYY HH:mm:ss"),
			header: ({ column }) => (
				<DataTableColumnHeader title="Completed At" column={column} />
			),
		},
		{
			accessorKey: "status",
			accessorFn: ({ status }) => t(`statuses.${status}`),
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
		},
		{
			accessorKey: "module.language",
			accessorFn: ({ module }) =>
				locales.find((l) => l.value === module?.language)?.label,
			header: ({ column }) => (
				<DataTableColumnHeader title="Language" column={column} />
			),
		},
		{
			accessorKey: "module.versionNumber",
			header: ({ column }) => (
				<DataTableColumnHeader title="Version" column={column} />
			),
		},
		{
			accessorKey: "score",
			accessorFn: ({ score }) => {
				if (score && score.raw && score.max) {
					return `${score.raw} / ${score.max}`;
				}
			},
			header: ({ column }) => (
				<DataTableColumnHeader title="Score" column={column} />
			),
		},
		createDataTableActionsColumn([]),
	];

	return (
		<Page>
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
		</Page>
	);
}
