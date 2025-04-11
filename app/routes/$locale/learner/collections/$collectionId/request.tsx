import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCollectionFn } from "@/server/handlers/collections";
import {
	getConnectionFn,
	requestConnectionFn,
} from "@/server/handlers/connections";
import { getTeamFn } from "@/server/handlers/teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId/request",
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const [collection, connection, team] = await Promise.all([
			getCollectionFn({ data: { id: params.collectionId } }),
			getConnectionFn({
				data: { type: "collection", id: params.collectionId },
			}),
			getTeamFn({ data: { type: "learner" } }),
		]);
		if (connection?.connectStatus === "accepted") {
			throw redirect({
				to: `/$locale/learner`,
				params,
			});
		}
		return { collection, connection, team };
	},
});

function RouteComponent() {
	const { collection, connection, team } = Route.useLoaderData();
	const router = useRouter();

	const requestConnection = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<FloatingPage className="flex flex-col gap-4 max-w-lg mx-auto">
			<h1>{collection.name}</h1>
			<p>{collection.description}</p>
			<Separator className="my-4" />
			{connection ? (
				<>
					{connection.connectStatus === "rejected" ? (
						<p className="text-center">
							An admin has rejected your request to join the
							collection "{collection.name}".
						</p>
					) : (
						<p className="text-center">
							Requested to join the collection "{collection.name}
							", please wait for an admin to approve.
						</p>
					)}
				</>
			) : (
				<>
					<p>
						This collection is private. Would you like to request to
						join?
					</p>
					<div className="flex gap-4">
						<Button
							onClick={() =>
								requestConnection.mutate({
									data: {
										type: "collection",
										id: collection.id,
										teamId: team.id,
									},
								})
							}
						>
							Request Access
						</Button>
					</div>
				</>
			)}
		</FloatingPage>
	);
}
