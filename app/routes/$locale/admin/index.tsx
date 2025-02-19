import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Can put tutorial, notifications, etc here</div>;
}
