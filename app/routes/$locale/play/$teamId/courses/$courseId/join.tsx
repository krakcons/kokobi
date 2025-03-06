import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/join",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return <div></div>;
}
