import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId/",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/$locale/learner/collections/$collectionId/"!</div>;
}
