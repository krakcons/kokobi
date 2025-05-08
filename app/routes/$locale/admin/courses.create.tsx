import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import { createCourseFn } from "@/server/handlers/courses";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/courses/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const t = useTranslations("CourseForm");
	const createCourse = useMutation({
		mutationFn: createCourseFn,
		onSuccess: (data) => {
			navigate({
				to: "/$locale/admin/courses/$courseId/learners",
				params: {
					courseId: data.courseId,
				},
				search: (s) => s,
			});
		},
	});
	const search = Route.useSearch();

	return (
		<Page>
			<PageHeader
				title={t.create.title}
				description={t.create.description}
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
