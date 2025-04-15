import { ContentBranding } from "@/components/ContentBranding";
import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCollectionFn } from "@/server/handlers/collections";
import {
	getConnectionFn,
	GetConnectionSchema,
	requestConnectionFn,
} from "@/server/handlers/connections";
import { getCourseFn } from "@/server/handlers/courses";
import { getTeamByIdFn, getTeamFn } from "@/server/handlers/teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/learner/request")({
	component: RouteComponent,
	validateSearch: GetConnectionSchema,
	loaderDeps: ({ search: { teamId, id, type } }) => ({ teamId, id, type }),
	loader: async ({ params, deps }) => {
		const [connection, team] = await Promise.all([
			getConnectionFn({ data: deps }),
			getTeamFn({ data: { type: "learner" } }),
		]);
		if (connection?.connectStatus === "accepted") {
			if (deps.type === "course") {
				throw redirect({
					to: `/$locale/learner/courses/$courseId`,
					params: {
						...params,
						courseId: deps.id,
					},
				});
			}
			if (deps.type === "collection") {
				throw redirect({
					to: "/$locale/learner",
					params,
				});
			}
		}

		if (connection?.connectType === "invite") {
			throw redirect({
				to: "/$locale/learner",
				params,
			});
		}

		const details =
			deps.type === "course"
				? await getCourseFn({
						data: { courseId: deps.id },
					})
				: await getCollectionFn({
						data: { id: deps.id },
					});

		return {
			connection,
			team,
			contentTeam: await getTeamByIdFn({
				data: { teamId: details.teamId },
			}),
			details,
		};
	},
});

function RouteComponent() {
	const {
		details: { name, description },
		connection,
		contentTeam,
		team,
	} = Route.useLoaderData();
	const router = useRouter();
	const search = Route.useSearch();

	const requestConnection = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<FloatingPage className="flex flex-col gap-4 max-w-lg mx-auto text-center">
			<h1>{name}</h1>
			<p>{description}</p>
			<Separator className="my-4" />
			{connection ? (
				<>
					{connection.connectStatus === "rejected" ? (
						<p>
							An admin has rejected your request to join "{name}".
						</p>
					) : (
						<p>
							Requested to join "{name}
							", please wait for an admin to approve.
						</p>
					)}
				</>
			) : (
				<>
					<p>Would you like to request to join "{name}"?</p>
					<div className="flex gap-4">
						<Button
							onClick={() =>
								requestConnection.mutate({
									data: search,
								})
							}
						>
							Request Access
						</Button>
					</div>
				</>
			)}
			<ContentBranding contentTeam={contentTeam} connectTeam={team} />
		</FloatingPage>
	);
}
