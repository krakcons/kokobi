import { WebhookForm } from "@/components/forms/WebhookForm";
import { Page, PageHeader } from "@/components/Page";
import { Secret } from "@/components/Secret";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/$locale/admin/webhooks/$webhookId")({
	component: RouteComponent,
	loader: async ({ context, params }) =>
		Promise.all([
			context.queryClient.ensureQueryData(
				orpc.organization.webhook.id.queryOptions({
					input: {
						id: params.webhookId,
					},
				}),
			),
		]),
});

function RouteComponent() {
	const params = Route.useParams();

	const t = useTranslations("UpdateWebhook");

	const { data: webhook } = useSuspenseQuery(
		orpc.organization.webhook.id.queryOptions({
			input: {
				id: params.webhookId,
			},
		}),
	);

	const updateWebhook = useMutation(
		orpc.organization.webhook.update.mutationOptions({
			onSuccess: () => {
				toast.success(t.toast);
			},
		}),
	);

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<div className="flex flex-col gap-2 pb-4 items-start">
				<p className="font-medium text-sm">{t.signingSecret}</p>
				<div className="bg-secondary rounded flex gap-2 items-center px-3 py-2 overflow-x-auto">
					<Secret secret={webhook.secret} />
				</div>
			</div>
			<WebhookForm
				defaultValues={webhook}
				onSubmit={(values) =>
					updateWebhook.mutateAsync({
						...values,
						id: params.webhookId,
					})
				}
			/>
		</Page>
	);
}
