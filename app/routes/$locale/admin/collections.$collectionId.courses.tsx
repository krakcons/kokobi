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
import {
	createCollectionCourseFn,
	deleteCollectionCourseFn,
	getCollectionCoursesFn,
} from "@/server/handlers/collections";
import { getCoursesFn } from "@/server/handlers/courses";
import { Course, CourseTranslation } from "@/types/course";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute(
	"/$locale/admin/collections/$collectionId/courses",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ params }) =>
		Promise.all([
			getCollectionCoursesFn({
				data: {
					id: params.collectionId,
				},
			}),
			getCoursesFn(),
		]),
});

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const params = Route.useParams();
	const [collectionCourses, courses] = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const router = useRouter();

	const createCourses = useMutation({
		mutationFn: createCollectionCourseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const deleteCourse = useMutation({
		mutationFn: deleteCollectionCourseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const columns: ColumnDef<Course & CourseTranslation>[] = [
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
		createDataTableActionsColumn<Course & CourseTranslation>([
			{
				name: "Remove",
				onClick: ({ id }) =>
					deleteCourse.mutate({
						data: {
							id: params.collectionId,
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
											data: {
												id: params.collectionId,
												...value,
											},
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
