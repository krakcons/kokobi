import { FloatingPage } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCollectionFn } from "@/server/handlers/collections";
import {
	getConnectionFn,
	userConnectionResponseFn,
} from "@/server/handlers/connections";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId/invite",
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const [collection, connection] = await Promise.all([
			getCollectionFn({ data: { id: params.collectionId } }),
			getConnectionFn({
				data: { type: "collection", id: params.collectionId },
			}),
		]);
		if (connection?.connectType === "request") {
			throw redirect({
				to: `/$locale/learner/collections/$collectionId/request`,
				params: {
					courseId: params.collectionId,
				},
				search: {
					teamId: connection.teamId,
				},
			});
		}
		return [collection, connection];
	},
});

function RouteComponent() {
	const [collection, connection] = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
	});

	return (
		<FloatingPage className="flex flex-col gap-4 max-w-lg mx-auto">
			<h1>{collection.name}</h1>
			<p>{collection.description}</p>
			<Separator className="my-4" />
			<p>You are invited to join the collection "{collection.name}"</p>
			<div className="flex gap-4">
				<Button
					onClick={() =>
						connectionResponse.mutate(
							{
								data: {
									type: "collection",
									teamId: connection.teamId,
									id: collection.id,
									connectStatus: "accepted",
								},
							},
							{
								onSuccess: () => {
									navigate({
										to: "/$locale/learner/collections/$collectionId",
										params: {
											collectionId: collection.id,
										},
									});
								},
							},
						)
					}
				>
					Accept
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						connectionResponse.mutate(
							{
								data: {
									type: "collection",
									teamId: connection.teamId,
									id: collection.id,
									connectStatus: "rejected",
								},
							},
							{
								onSuccess: () => {
									navigate({
										to: "/$locale/learner",
									});
								},
							},
						)
					}
				>
					Decline
				</Button>
			</div>
		</FloatingPage>
	);
}
