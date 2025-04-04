import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader } from "@/components/Page";
import { createCourseFn } from "@/server/handlers/courses";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/courses/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const createCourse = useMutation({
		mutationFn: createCourseFn,
		onSuccess: (data) => {
			navigate({
				to: "/$locale/admin/courses/$id/learners",
				params: {
					id: data.id,
				},
				search: (s) => s,
			});
		},
	});
	const search = Route.useSearch();

	return (
		<Page>
			<PageHeader
				title="Create Course"
				description="Enter the details of your course below."
			/>
			<CourseForm
				onSubmit={(values) =>
					createCourse.mutateAsync({
						data: {
							...values,
						},
						headers: {
							...(search.locale && { locale: search.locale }),
						},
					})
				}
			/>
		</Page>
	);
}
