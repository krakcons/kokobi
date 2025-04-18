import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	deleteCourseFn,
	getCourseFn,
	updateCourseFn,
} from "@/server/handlers/courses";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/settings",
)({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params, deps }) =>
		getCourseFn({
			data: {
				courseId: params.courseId,
			},
			headers: {
				...(deps.locale && { locale: deps.locale }),
				fallbackLocale: "none",
			},
		}),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const course = Route.useLoaderData();
	const router = useRouter();

	const updateCourse = useMutation({
		mutationFn: updateCourseFn,
		onSuccess: () => {
			toast.success("Course updated");
			router.invalidate();
		},
	});

	const deleteCourse = useMutation({
		mutationFn: deleteCourseFn,
		onSuccess: () => {
			navigate({ to: "/$locale/admin" });
		},
	});

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your course settings"
			/>
			<CourseForm
				key={course.locale}
				defaultValues={course}
				onSubmit={(values) =>
					updateCourse.mutateAsync({
						data: {
							...values,
							id: params.courseId,
						},
						headers: {
							...(search.locale && { locale: search.locale }),
						},
					})
				}
			/>
			<Separator className="my-4" />
			<PageSubHeader
				title="Delete Course"
				description="This will delete the course and all associated data. This action cannot be undone."
			/>
			<Button
				variant="destructive"
				onClick={() => {
					deleteCourse.mutate({
						data: { id: params.courseId },
					});
				}}
				className="self-start"
			>
				<Trash />
				Delete
			</Button>
		</Page>
	);
}
