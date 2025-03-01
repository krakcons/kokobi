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
import { queryOptions, useMutationOptions } from "@/lib/api";
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { locales, useLocale, useTranslations } from "@/lib/locale";
import { formatDate } from "@/lib/date";
import { useState } from "react";
import { LearnersForm } from "@/components/forms/LearnersForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
	const [open, setOpen] = useState(false);
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const { data: learners } = useSuspenseQuery(
		queryOptions.courses.learners({
			param: { id: params.id },
		}),
	);
	const t = useTranslations("Learner");
	const locale = useLocale();

	const mutationOptions = useMutationOptions();
	const createLearners = useMutation(mutationOptions.course.learners.create);
	const deleteLearner = useMutation(mutationOptions.course.learners.delete);

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
				formatDate({ date: startedAt, locale, type: "detailed" }),
			header: ({ column }) => (
				<DataTableColumnHeader title="Started At" column={column} />
			),
		},
		{
			accessorKey: "completedAt",
			accessorFn: ({ completedAt }) =>
				formatDate({ date: completedAt, locale, type: "detailed" }),
			header: ({ column }) => (
				<DataTableColumnHeader title="Completed At" column={column} />
			),
		},
		{
			accessorKey: "status",
			accessorFn: ({ status }) => t.statuses[status],
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
		createDataTableActionsColumn<
			Learner & { module: Module | null; joinLink?: string }
		>([
			{
				name: "Delete",
				onClick: ({ id }) =>
					deleteLearner.mutate(
						{
							param: {
								id: params.id,
								learnerId: id,
							},
						},
						{
							onSuccess: () => {
								setOpen(false);
							},
						},
					),
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
					<DialogContent className="sm:max-w-3xl w-full">
						<DialogHeader>
							<DialogTitle>Invite Learners</DialogTitle>
							<DialogDescription>
								Enter learners below to invite them to the
								course.
							</DialogDescription>
						</DialogHeader>
						<LearnersForm
							onSubmit={(value) => {
								createLearners.mutate({
									param: {
										id: params.id,
									},
									json: value.learners,
								});
							}}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
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
