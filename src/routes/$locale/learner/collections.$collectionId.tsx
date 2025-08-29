import { ConnectionComponent } from "@/components/ConnectionComponent";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { orpc } from "@/server/client";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(
				orpc.collection.id.queryOptions({
					input: { id: params.collectionId },
				}),
			),
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			queryClient.ensureQueryData(
				orpc.collection.courses.get.queryOptions({
					input: { id: params.collectionId },
				}),
			),
			queryClient.ensureQueryData(
				orpc.connection.getOne.queryOptions({
					input: {
						senderType: "user",
						recipientType: "collection",
						id: params.collectionId,
					},
				}),
			),
		]);
	},
});

function RouteComponent() {
	const [collection, team, courses, connection] = Route.useLoaderData();
	const router = useRouter();

	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);
	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);

	return (
		<Page>
			<PageHeader
				title={collection.name}
				description={collection.description}
				UnderTitle={
					<ContentBranding
						contentTeam={collection.team}
						connectTeam={team}
					/>
				}
			>
				{connection && (
					<ConnectionStatusBadge hideOnSuccess {...connection} />
				)}
			</PageHeader>
			<ConnectionWrapper
				name={collection.name}
				connection={connection}
				onRequest={() =>
					createConnection.mutate({
						senderType: "user",
						recipientType: "collection",
						id: collection.id,
					})
				}
				onResponse={(status) => {
					updateConnection.mutate({
						senderType: "collection",
						recipientType: "user",
						id: collection.id,
						connectStatus: status,
					});
				}}
			>
				<h3>Courses</h3>
				{courses.map((course) => (
					<ConnectionComponent
						key={course.id}
						connection={connection!}
						{...course}
						type="course"
					/>
				))}
			</ConnectionWrapper>
		</Page>
	);
}
