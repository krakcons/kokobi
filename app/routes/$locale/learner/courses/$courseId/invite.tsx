import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { connectToCourseFn, getMyCourseFn } from "@/server/handlers/user";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/courses/$courseId/invite",
)({
	component: RouteComponent,
	loader: ({ params }) =>
		getMyCourseFn({
			data: {
				courseId: params.courseId,
			},
		}),
});

function RouteComponent() {
	const course = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const connectCourse = useMutation({
		mutationFn: connectToCourseFn,
	});

	return (
		<FloatingPage className="flex flex-col gap-4 max-w-lg mx-auto">
			<h1>{course.name}</h1>
			<p>{course.description}</p>
			<Separator className="my-4" />
			<p>You are invited to join the course "{course.name}"</p>
			<div className="flex gap-4">
				<Button
					onClick={() =>
						connectCourse.mutate(
							{
								data: {
									courseId: course.id,
									connectStatus: "accepted",
								},
							},
							{
								onSuccess: () => {
									navigate({
										to: "/$locale/learner/courses/$courseId",
										params: {
											courseId: course.id,
										},
									});
								},
							},
						)
					}
				>
					Accept
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						connectCourse.mutate(
							{
								data: {
									courseId: course.id,
									connectStatus: "rejected",
								},
							},
							{
								onSuccess: () => {
									navigate({
										to: "/$locale/learner",
									});
								},
							},
						)
					}
				>
					Decline
				</Button>
			</div>
		</FloatingPage>
	);
}
