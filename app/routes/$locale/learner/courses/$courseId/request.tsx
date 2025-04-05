import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/courses/$courseId/request",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/$locale/learner/courses/courseId/request"!</div>;
}
