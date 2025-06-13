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
import { useTranslations } from "@/lib/locale";
import {
	createCollectionCourseFn,
	deleteCollectionCourseFn,
	getCollectionCoursesFn,
} from "@/server/handlers/collections.courses";
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
					collectionId: params.collectionId,
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
	const t = useTranslations("CollectionCourses");
	const tActions = useTranslations("Actions");
	const tForm = useTranslations("CoursesForm");

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
				<DataTableColumnHeader title={t.table.name} column={column} />
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.table.description}
					column={column}
				/>
			),
			cell: ({ cell }) => (
				<div className="line-clamp-2">
					{cell.row.original.description}
				</div>
			),
		},
		createDataTableActionsColumn<Course & CourseTranslation>([
			{
				name: tActions.delete,
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
			<PageHeader title={t.title} description={t.description}>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							{tActions.create}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-3xl w-full">
						<DialogHeader>
							<DialogTitle>{tForm.title}</DialogTitle>
							<DialogDescription>
								{tForm.description}
							</DialogDescription>
						</DialogHeader>
						{courseFormCourses.length === 0 ? (
							<div className="flex flex-col gap-2">
								<p className="text-muted-foreground text-sm">
									{tForm.empty}
								</p>
								<Link
									to="/$locale/admin/courses/create"
									params={(p) => p}
									from={Route.fullPath}
								>
									<Button variant="secondary">
										{tForm.create}
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
