import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	deleteCourseFn,
	getCourseFn,
	updateCourseFn,
} from "@/server/handlers/courses";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/courses/$id/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: async ({ params, context: { queryClient }, deps }) => {
		await queryClient.ensureQueryData({
			queryKey: [getCourseFn.url, params.id, deps.locale],
			queryFn: () =>
				getCourseFn({
					data: {
						id: params.id,
						locale: deps.locale,
						fallbackLocale: "none",
					},
				}),
		});
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const { data: course } = useSuspenseQuery({
		queryKey: [getCourseFn.url, params.id, search.locale],
		queryFn: () =>
			getCourseFn({
				data: {
					id: params.id,
					locale: search.locale,
					fallbackLocale: "none",
				},
			}),
	});

	const updateCourse = useMutation({
		mutationFn: updateCourseFn,
	});
	const deleteCourse = useMutation({
		mutationFn: deleteCourseFn,
	});

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your course settings"
			/>
			<CourseForm
				key={course.language}
				defaultValues={course}
				onSubmit={(values) =>
					updateCourse.mutateAsync({
						data: {
							...values,
							id: params.id,
							locale: search.locale,
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
				onClick={async () => {
					await deleteCourse.mutateAsync({
						data: { id: params.id },
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
