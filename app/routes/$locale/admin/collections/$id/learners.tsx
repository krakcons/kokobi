import { useLocale, locales, useTranslations } from "@/lib/locale";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/date";
import { useState } from "react";
import { LearnersForm } from "@/components/forms/LearnersForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	getCollectionCoursesFn,
	getCollectionLearnersFn,
	inviteLearnerToCollectionFn,
} from "@/server/handlers/collections";
import { deleteLearnerFn } from "@/server/handlers/learners";

export const Route = createFileRoute("/$locale/admin/collections/$id/learners")(
	{
		component: RouteComponent,
		validateSearch: TableSearchSchema,
		loader: ({ params }) =>
			Promise.all([
				getCollectionLearnersFn({
					data: {
						id: params.id,
					},
				}),
				getCollectionCoursesFn({
					data: {
						id: params.id,
					},
				}),
			]),
	},
);

function RouteComponent() {
	const search = Route.useSearch();
	const params = Route.useParams();
	const [learners, courses] = Route.useLoaderData();
	const [open, setOpen] = useState(false);
	const t = useTranslations("Learner");
	const locale = useLocale();
	const router = useRouter();

	const createLearners = useMutation({
		mutationFn: inviteLearnerToCollectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const deleteLearner = useMutation({
		mutationFn: deleteLearnerFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();

	const columns: ColumnDef<Learner & { module: Module }>[] = [
		{
			accessorKey: "courseId",
			header: ({ column }) => (
				<DataTableColumnHeader title="Course" column={column} />
			),
			cell: ({ cell }) => (
				<Link
					to="/$locale/admin/courses/$id/settings"
					params={(p) => ({
						...p,
						id: cell.row.original.courseId,
					})}
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{
						courses.find(
							(c) => c.id === cell.row.original.courseId,
						)!.name
					}
				</Link>
			),
		},
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
			accessorKey: "module.locale",
			accessorFn: ({ module }) =>
				locales.find((l) => l.value === module?.locale)?.label,
			header: ({ column }) => (
				<DataTableColumnHeader title="Locale" column={column} />
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
				onClick: ({ id, courseId }) =>
					deleteLearner.mutate(
						{
							data: {
								courseId,
								learnerId: id,
							},
						},
						{
							onSuccess: () =>
								queryClient.invalidateQueries({
									queryKey: [
										getCollectionLearnersFn.url,
										params.id,
									],
								}),
						},
					),
			},
		]),
	];

	return (
		<Page>
			<PageHeader
				title="Learners"
				description="Manage learners for this collection."
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
								collection.
							</DialogDescription>
						</DialogHeader>
						<LearnersForm
							onSubmit={(value) =>
								createLearners.mutateAsync(
									{
										data: {
											...value,
											id: params.id,
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
