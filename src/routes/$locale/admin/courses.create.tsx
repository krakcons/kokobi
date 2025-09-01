import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/courses/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const t = useTranslations("CourseForm");
	const search = Route.useSearch();
	const queryClient = useQueryClient();
	const createCourse = useMutation(
		orpc.course.create.mutationOptions({
			context: {
				headers: {
					locale: search.locale,
				},
			},
			onSuccess: (data) => {
				queryClient.invalidateQueries(orpc.course.get.queryOptions());
				navigate({
					to: "/$locale/admin/courses/$courseId/learners",
					params: {
						courseId: data.courseId,
					},
					search: (s) => s,
				});
			},
		}),
	);

	return (
		<Page>
			<PageHeader
				title={t.create.title}
				description={t.create.description}
			/>
			<CourseForm
				onSubmit={(values) =>
					createCourse.mutateAsync({
						...values,
					})
				}
			/>
		</Page>
	);
}
