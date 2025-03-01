import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/courses/$id/settings")({
	component: RouteComponent,
	loader: async ({ params, context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			queryOptions.courses.id({
				param: {
					id: params.id,
				},
				query: {
					"fallback-locale": "none",
				},
			}),
		);
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const { data: course } = useSuspenseQuery(
		queryOptions.courses.id({
			param: {
				id: params.id,
			},
			query: {
				"fallback-locale": "none",
			},
		}),
	);

	const mutationOptions = useMutationOptions();
	const updateCourse = useMutation(mutationOptions.course.update);
	const deleteCourse = useMutation(mutationOptions.course.delete);

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your course, delete, and more"
			/>
			<CourseForm
				key={course.language}
				defaultValues={course}
				onSubmit={(values) => {
					updateCourse.mutate({
						param: { id: params.id },
						json: values,
					});
				}}
			/>
			<Separator className="my-4" />
			<PageSubHeader
				title="Delete Course"
				description="This will delete the course and all associated data. This action cannot be undone."
			/>
			<Button
				variant="destructive"
				onClick={async () => {
					await deleteCourse.mutateAsync({
						param: { id: params.id },
					});
					await navigate({ to: "/$locale/admin" });
				}}
				className="self-start"
			>
				<Trash />
				Delete
			</Button>
		</Page>
	);
}
