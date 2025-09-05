import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { FloatingPage, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/$locale/not-admin")({
	component: RouteComponent,
	validateSearch: z.object({
		organizationId: z.string(),
	}),
	loaderDeps: ({ search: { organizationId } }) => ({ organizationId }),
	loader: async ({ deps, params, context: { queryClient } }) => {
		const organizations = await queryClient.ensureQueryData(
			orpc.organization.get.queryOptions(),
		);
		console.log(organizations, deps.organizationId);

		if (organizations?.find((o) => o.id === deps.organizationId)) {
			throw redirect({
				to: "/$locale/admin",
				params,
			});
		}

		return Promise.all([
			queryClient.ensureQueryData(
				orpc.auth.invitation.get.queryOptions(),
			),
			queryClient.ensureQueryData(
				orpc.organization.id.queryOptions({
					input: {
						id: deps.organizationId,
					},
				}),
			),
		]);
	},
});

function RouteComponent() {
	const t = useTranslations("NotAMember");
	const tError = useTranslations("Errors");
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const search = Route.useSearch();

	const { data: invitations } = useSuspenseQuery(
		orpc.auth.invitation.get.queryOptions(),
	);

	const invite = invitations.find(
		(i) =>
			i.organizationId === search.organizationId &&
			i.status === "pending",
	);
	const connection = invite
		? {
				connectType: "invite" as const,
				connectStatus:
					invite.status === "canceled" ? "rejected" : invite.status,
			}
		: undefined;

	console.log(invitations);

	const { data: organization } = useSuspenseQuery(
		orpc.organization.id.queryOptions({
			input: {
				id: search.organizationId,
			},
		}),
	);

	console.log(connection);

	return (
		<FloatingPage>
			<PageHeader
				title={organization.name}
				description={
					connection && connection.connectStatus !== "rejected"
						? t.inviteMessage
						: t.message
				}
			/>
			<ConnectionWrapper
				allowRequest={false}
				name={organization.name}
				connection={connection}
				onRequest={() => {}}
				onResponse={(status) => {
					if (status === "accepted") {
						authClient.organization.acceptInvitation(
							{
								invitationId: invite!.id,
							},
							{
								onSuccess: () => {
									queryClient.invalidateQueries();
									navigate({
										to: "/$locale/admin",
									});
								},
							},
						);
					}
					if (status === "rejected") {
						authClient.organization.rejectInvitation(
							{
								invitationId: invite!.id,
							},
							{
								onSuccess: () => {
									queryClient.invalidateQueries();
									navigate({
										to: "/$locale/admin",
									});
								},
							},
						);
					}
				}}
			>
				<Button
					className="self-start"
					onClick={(e) => {
						e.preventDefault();
						window.history.back();
					}}
				>
					<ArrowLeft />
					{tError.goBack}
				</Button>
			</ConnectionWrapper>
		</FloatingPage>
	);
}
