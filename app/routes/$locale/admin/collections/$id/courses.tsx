import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { CoursesForm } from "@/components/forms/CoursesForm";
import { Page, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { collection, queryOptions, useMutationOptions } from "@/lib/api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/$locale/admin/collections/$id/courses")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params, context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			queryOptions.collections.courses({
				param: {
					id: params.id,
				},
			}),
		);
		await queryClient.ensureQueryData(queryOptions.courses.all);
	},
});

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const params = Route.useParams();
	const { data: collectionCourses } = useSuspenseQuery(
		queryOptions.collections.courses({
			param: {
				id: params.id,
			},
		}),
	);
	const { data: courses } = useSuspenseQuery(queryOptions.courses.all);
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const mutationOptions = useMutationOptions();
	const createCourses = useMutation(mutationOptions.collections.courses.add);
	const deleteCourse = useMutation(
		mutationOptions.collections.courses.delete,
	);

	const columns: ColumnDef<
		InferResponseType<typeof collection.courses.$get>[0]
	>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader title="Name" column={column} />
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader title="Description" column={column} />
			),
			cell: ({ cell }) => (
				<div className="line-clamp-2">
					{cell.row.original.description}
				</div>
			),
		},
		createDataTableActionsColumn<
			InferResponseType<typeof collection.courses.$get>[0]
		>([
			{
				name: "Remove",
				onClick: ({ id }) =>
					deleteCourse.mutate({
						param: {
							id: params.id,
							courseId: id,
						},
					}),
			},
		]),
	];

	const courseFormCourses = useMemo(() => {
		return courses.filter((c) =>
			collectionCourses.find((cc) => cc.id === c.id) ? false : true,
		);
	}, [courses, collectionCourses]);

	console.log(courseFormCourses);

	return (
		<Page>
			<PageHeader
				title="Courses"
				description="Manage courses for this collection."
			>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus /> Add
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-3xl w-full">
						<DialogHeader>
							<DialogTitle>Add Courses</DialogTitle>
							<DialogDescription>
								Select the courses you want to add to this
								collection below.
							</DialogDescription>
						</DialogHeader>
						{courseFormCourses.length === 0 ? (
							<div className="flex flex-col gap-2">
								<p className="text-muted-foreground text-sm">
									No courses available. Create a course first
									here:
								</p>
								<Link
									to="/$locale/admin/courses/create"
									params={(p) => p}
									from={Route.fullPath}
								>
									<Button variant="secondary">
										Create Course
									</Button>
								</Link>
							</div>
						) : (
							<CoursesForm
								onSubmit={(value) =>
									createCourses.mutateAsync(
										{
											param: {
												id: params.id,
											},
											json: value,
										},
										{
											onSuccess: () => setOpen(false),
										},
									)
								}
								courses={courseFormCourses}
							/>
						)}
					</DialogContent>
				</Dialog>
			</PageHeader>
			<DataTable
				data={collectionCourses}
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
