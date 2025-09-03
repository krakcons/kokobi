import { ConnectionComponent } from "@/components/ConnectionComponent";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { orpc } from "@/server/client";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			queryClient.ensureQueryData(
				orpc.collection.id.queryOptions({
					input: { id: params.collectionId },
				}),
			),
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
	const [team] = Route.useLoaderData();
	const params = Route.useParams();
	const queryClient = useQueryClient();

	const { data: collection } = useSuspenseQuery(
		orpc.collection.id.queryOptions({
			input: { id: params.collectionId },
		}),
	);
	const { data: courses } = useSuspenseQuery(
		orpc.collection.courses.get.queryOptions({
			input: { id: params.collectionId },
		}),
	);
	const { data: connection } = useSuspenseQuery(
		orpc.connection.getOne.queryOptions({
			input: {
				senderType: "user",
				recipientType: "collection",
				id: params.collectionId,
			},
		}),
	);

	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.learner.collection.get.queryOptions(),
				);
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "user",
							recipientType: "collection",
							id: params.collectionId,
						},
					}),
				);
			},
		}),
	);

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.learner.collection.get.queryOptions(),
				);
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "user",
							recipientType: "collection",
							id: params.collectionId,
						},
					}),
				);
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
				connection={connection || undefined}
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
