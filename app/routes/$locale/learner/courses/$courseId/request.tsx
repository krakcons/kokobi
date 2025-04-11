import { ContentBranding } from "@/components/ContentBranding";
import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	getConnectionFn,
	requestConnectionFn,
} from "@/server/handlers/connections";
import { getCourseFn } from "@/server/handlers/courses";
import { getTeamFn } from "@/server/handlers/teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/courses/$courseId/request",
)({
	component: RouteComponent,
	loaderDeps: ({ search: { teamId } }) => ({ teamId }),
	loader: async ({ params }) => {
		const [course, connection, team] = await Promise.all([
			getCourseFn({ data: { courseId: params.courseId } }),
			getConnectionFn({ data: { type: "course", id: params.courseId } }),
			getTeamFn({ data: { type: "learner" } }),
		]);
		if (connection?.connectStatus === "accepted") {
			throw redirect({
				to: `/$locale/learner/courses/$courseId`,
				params,
			});
		}
		return {
			course,
			connection,
			team,
		};
	},
});

function RouteComponent() {
	const { course, connection, team } = Route.useLoaderData();
	const router = useRouter();

	const connectCourse = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<FloatingPage className="flex flex-col gap-4 max-w-lg mx-auto">
			<h1>{course.name}</h1>
			<p>{course.description}</p>
			<Separator className="my-4" />
			{connection ? (
				<>
					{connection.connectStatus === "rejected" ? (
						<p className="text-center">
							An admin has rejected your request to join the
							course "{course.name}".
						</p>
					) : (
						<p className="text-center">
							Requested to join the course "{course.name}
							", please wait for an admin to approve.
						</p>
					)}
				</>
			) : (
				<>
					<p>
						This course is private. Would you like to request to
						join?
					</p>
					<div className="flex gap-4">
						<Button
							onClick={() =>
								connectCourse.mutate({
									data: {
										type: "course",
										id: course.id,
										teamId: team.id,
									},
								})
							}
						>
							Request Access
						</Button>
					</div>
				</>
			)}
			<ContentBranding team={course.team} connectTeam={team} />
		</FloatingPage>
	);
}
