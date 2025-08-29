import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { FloatingPage, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { getTeamByIdFn } from "@/server/handlers/teams";
import { getUserTeamConnectionFn } from "@/server/handlers/users.teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/$locale/not-admin")({
	component: RouteComponent,
	validateSearch: z.object({
		teamId: z.string(),
	}),
	loaderDeps: ({ search: { teamId } }) => ({ teamId }),
	loader: async ({ deps, params }) => {
		const connection = await getUserTeamConnectionFn({
			data: {
				type: "admin",
				teamId: deps.teamId,
			},
		});

		if (connection && connection.connectStatus === "accepted") {
			throw redirect({
				to: "/$locale/admin",
				params,
			});
		}

		return {
			connection,
			team: await getTeamByIdFn({
				data: {
					teamId: deps.teamId,
				},
			}),
		};
	},
});

function RouteComponent() {
	const t = useTranslations("NotAMember");
	const { connection, team } = Route.useLoaderData();
	const tError = useTranslations("Errors");
	const navigate = Route.useNavigate();

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
			</ConnectionWrapper>
		</FloatingPage>
	);
}
