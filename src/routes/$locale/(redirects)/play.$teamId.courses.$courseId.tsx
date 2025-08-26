import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/(redirects)/play/$teamId/courses/$courseId",
)({
	component: () => <></>,
	loader: ({ params }) => {
		return redirect({
			to: "/$locale/learner/courses/$courseId",
			params: {
				courseId: params.courseId,
				locale: params.locale,
			},
			search: { teamId: params.teamId },
		})
	},
});
