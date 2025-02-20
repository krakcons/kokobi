import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader } from "@/components/Page";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/courses/$id/settings")({
	component: RouteComponent,
	loader: async ({ params, context: { queryClient } }) => {
		queryClient.ensureQueryData(
			queryOptions.courses.id({
				param: {
					id: params.id,
				},
			}),
		);
	},
});

function RouteComponent() {
	const params = Route.useParams();

	const { editingLocale } = useSearch({
		from: "/$locale/admin",
	});

	const { data: course } = useSuspenseQuery(
		queryOptions.courses.id(
			{
				param: {
					id: params.id,
				},
			},
			{
				headers: {
					locale: editingLocale!,
				},
			},
		),
	);

	const mutationOptions = useMutationOptions();
	const { mutate } = useMutation(mutationOptions.course.update);

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your course, delete, and more"
			/>
			<CourseForm
				defaultValues={course}
				onSubmit={(values) => {
					mutate({
						param: { id: params.id },
						json: values,
					});
				}}
			/>
		</Page>
	);
}
