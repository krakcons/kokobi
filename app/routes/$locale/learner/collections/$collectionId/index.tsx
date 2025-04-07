import { FloatingPage, PageHeader } from "@/components/Page";
import { buttonVariants } from "@/components/ui/button";
import {
	getCollectionCoursesFn,
	getCollectionFn,
} from "@/server/handlers/collections";
import { getConnectionFn } from "@/server/handlers/connections";
import { getTeamByIdFn } from "@/server/handlers/teams";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId/",
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const connection = await getConnectionFn({
			data: { type: "collection", id: params.collectionId },
		});

		if (!connection) {
			throw redirect({
				to: "/$locale/learner/collections/$collectionId/request",
				params: {
					collectionId: params.collectionId,
				},
			});
		}

		if (
			connection.connectType === "invite" &&
			connection.connectStatus === "pending"
		) {
			throw redirect({
				to: "/$locale/learner/collections/$collectionId/invite",
				params: {
					collectionId: params.collectionId,
				},
			});
		}

		if (
			connection.connectType === "request" &&
			connection.connectStatus !== "accepted"
		) {
			throw redirect({
				to: "/$locale/learner/collections/$collectionId/request",
				params: {
					collectionId: params.collectionId,
				},
				search: {
					teamId: connection.teamId,
				},
			});
		}

		return Promise.all([
			getCollectionFn({ data: { id: params.collectionId } }),
			getTeamByIdFn({
				data: {
					teamId: connection.teamId,
				},
			}),
			getCollectionCoursesFn({
				data: {
					id: params.collectionId,
				},
			}),
		]);
	},
});

function RouteComponent() {
	const [collection, team, courses] = Route.useLoaderData();
	return (
		<FloatingPage>
			<div className="flex flex-col gap-8 w-full">
				<Link
					to="/$locale/learner"
					className={buttonVariants({
						variant: "link",
						className: "self-start",
					})}
				>
					<ArrowLeft />
					Dashboard
				</Link>
				<div className="flex gap-4 items-center">
					<img
						src="/favicon.ico"
						alt="favicon"
						className="w-10 h-10"
					/>
					<p>
						Delivered by <strong>{team.name}</strong>
					</p>
				</div>
				<PageHeader
					title={collection.name}
					description={collection.description}
				/>
				<div className="flex flex-col gap-4">
					<h3>Courses</h3>
					{courses?.map(({ id, name, description }) => (
						<Link
							key={id}
							to="/$locale/learner/courses/$courseId"
							from={Route.fullPath}
							params={{
								courseId: id,
							}}
							className="w-full rounded-lg p-4 border flex flex-col gap-4"
						>
							<p className="text-2xl font-bold">{name}</p>
							{description && <p>{description}</p>}
						</Link>
					))}
				</div>
			</div>
		</FloatingPage>
	);
}
