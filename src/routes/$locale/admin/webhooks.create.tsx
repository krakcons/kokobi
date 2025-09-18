import { WebhookForm } from "@/components/forms/WebhookForm";
import { Page, PageHeader } from "@/components/Page";
import { orpc } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/webhooks/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const createWebhook = useMutation(
		orpc.organization.webhook.create.mutationOptions({
			onSuccess: ({ id }) => {
				navigate({
					to: "/$locale/admin/webhooks/$webhookId",
					params: {
						webhookId: id,
					},
				});
			},
		}),
	);

	return (
		<Page>
			<PageHeader
				title="Create Webhook"
				description="Create a new webhook for this organization."
			/>
			<WebhookForm
				onSubmit={async (values) => createWebhook.mutateAsync(values)}
			/>
		</Page>
	);
}
