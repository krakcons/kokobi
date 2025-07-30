import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/(old)/courses/$courseId/join")({
	component: () => <></>,
	loader: ({ params }) => {
		return redirect({
			to: "/$locale/learner/courses/$courseId",
			params,
		});
	},
});
