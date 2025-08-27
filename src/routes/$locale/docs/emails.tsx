import Invite from "@/components/emails/Invite";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/docs/emails")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<Invite />
		</div>
	);
}
