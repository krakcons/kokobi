import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	getConnectionFn,
	userConnectionResponseFn,
} from "@/server/handlers/connections";
import { getCourseFn } from "@/server/handlers/courses";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/courses/$courseId/invite",
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const [course, connection] = await Promise.all([
			getCourseFn({ data: { courseId: params.courseId } }),
			getConnectionFn({ data: { type: "course", id: params.courseId } }),
		]);
		if (connection?.connectType === "request") {
			throw redirect({
				to: `/$locale/learner/courses/$courseId/request`,
				params: {
					courseId: params.courseId,
				},
				search: {
					teamId: connection.teamId,
				},
			});
		}
		return [course, connection];
	},
});

function RouteComponent() {
	const [course, connection] = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
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
						connectionResponse.mutate(
							{
								data: {
									type: "course",
									teamId: connection.teamId,
									id: course.id,
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
						connectionResponse.mutate(
							{
								data: {
									type: "course",
									teamId: connection.teamId,
									id: course.id,
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
