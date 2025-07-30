import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/(old)/play/$teamId/courses/$courseId/join",
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
		});
	},
});
