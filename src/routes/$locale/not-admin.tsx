import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { FloatingPage, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { authQueryOptions } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
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
		const { data: organizations } = await queryClient.ensureQueryData(
			authQueryOptions.organization.list,
		);

		if (organizations?.find((o) => o.id === deps.organizationId)) {
			throw redirect({
				to: "/$locale/admin",
				params,
			});
		}

		return Promise.all([
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
	const search = Route.useSearch();

	const { data: organizations } = useSuspenseQuery(
		authQueryOptions.organization.list,
	);
	const { data: team } = useSuspenseQuery(
		orpc.organization.id.queryOptions({
			input: {
				id: search.organizationId,
			},
		}),
	);

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				navigate({
					to: "/$locale/admin",
				});
			},
		}),
	);

	return (
		<FloatingPage>
			<></>
			{/*
				<PageHeader
				title={team.name}
				description={connection ? t.inviteMessage : t.message}
			/>
			<ConnectionWrapper
				allowRequest={false}
				name={team.name}
				connection={connection}
				onRequest={() => {}}
				onResponse={(status) => {
					updateConnection.mutate({
						senderType: "team",
						recipientType: "user",
						id: team.id,
						connectStatus: status,
					});
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
			</ConnectionWrapper>*/}
		</FloatingPage>
	);
}
