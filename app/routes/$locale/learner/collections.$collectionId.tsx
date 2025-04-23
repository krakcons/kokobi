import { ConnectionComponent } from "@/components/ConnectionComponent";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { getCollectionByIdFn } from "@/server/handlers/collections";
import { getCollectionCoursesFn } from "@/server/handlers/collections.courses";
import {
	getConnectionFn,
	requestConnectionFn,
	userConnectionResponseFn,
} from "@/server/handlers/connections";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params }) => {
		return Promise.all([
			getCollectionByIdFn({ data: { id: params.collectionId } }),
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			getCollectionCoursesFn({
				data: {
					id: params.collectionId,
				},
			}),
			getConnectionFn({
				data: { type: "collection", id: params.collectionId },
			}),
		]);
	},
});

function RouteComponent() {
	const [collection, team, courses, connection] = Route.useLoaderData();
	const router = useRouter();

	const requestConnection = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Page>
			<div className="flex flex-col gap-8 w-full">
				<ContentBranding
					contentTeam={collection.team}
					connectTeam={team}
				/>
				<PageHeader
					title={collection.name}
					description={collection.description}
				>
					{connection && (
						<ConnectionStatusBadge hideOnSuccess {...connection} />
					)}
				</PageHeader>
				<ConnectionWrapper
					name={collection.name}
					connection={connection}
					onRequest={() =>
						requestConnection.mutate({
							data: {
								type: "collection",
								id: collection.id,
							},
						})
					}
					onResponse={(status) => {
						connectionResponse.mutate({
							data: {
								type: "collection",
								id: collection.id,
								connectStatus: status,
							},
						});
					}}
				>
					<div className="flex flex-col gap-4">
						<h3>Courses</h3>
						{courses.map((course) => (
							<ConnectionComponent
								key={course.id}
								connection={connection!}
								{...course}
								type="course"
							/>
						))}
					</div>
				</ConnectionWrapper>
			</div>
		</Page>
	);
}
