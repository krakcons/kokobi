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
	const { mutateAsync } = useMutation({
		mutationFn: createCourseFn,
	});
	const search = Route.useSearch();

	return (
		<Page>
			<PageHeader
				title="Create Course"
				description="Enter the details of your course below."
			/>
			<CourseForm
				onSubmit={async (values) => {
					const data = await mutateAsync({
						data: {
							...values,
							locale: search.locale,
						},
					});
					navigate({
						to: "/$locale/admin/courses/$id/learners",
						params: {
							id: data.id,
						},
						search: (s) => s,
					});
				}}
			/>
		</Page>
	);
}
