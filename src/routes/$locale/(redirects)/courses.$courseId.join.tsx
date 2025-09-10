import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/(redirects)/courses/$courseId/join",
)({
	component: () => <></>,
	loader: ({ params }) => {
		console.log("redirecting to", params);
		throw redirect({
			to: "/$locale/courses/$courseId",
			params,
		});
	},
});
