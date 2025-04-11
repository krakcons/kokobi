import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { FloatingPage, Page, PageHeader } from "@/components/Page";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getAuthFn } from "@/server/handlers/user";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Container } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/")({
	component: RouteComponent,
	beforeLoad: async ({ params }) => {
		const { user } = await getAuthFn();

		if (!user) {
			throw redirect({
				to: "/$locale/auth/login",
				params,
			});
		}
	},
	loader: () =>
		Promise.all([
			getConnectionsFn({
				data: {
					type: "course",
				},
			}),
			getConnectionsFn({
				data: {
					type: "collection",
				},
			}),
		]),
});

function RouteComponent() {
	const [courses, collections] = Route.useLoaderData();

	return (
		<Page>
			<PageHeader
				title="Learner Dashboard"
				description="View all your progress, collections, teams, and certificates"
			/>
			<div className="flex flex-col gap-4">
				<h3>Courses</h3>
				{courses?.map(
					({
						connectStatus,
						connectType,
						course: { id, name, description },
					}) => (
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
							<ConnectionStatusBadge
								connectStatus={connectStatus}
								connectType={connectType}
							/>
						</Link>
					),
				)}
			</div>
			<div className="flex flex-col gap-4">
				<h3>Collections</h3>
				<div className="flex flex-row gap-4">
					{collections?.map(
						({
							connectType,
							connectStatus,
							collection: { id, name, description },
						}) => (
							<Link
								key={id}
								to="/$locale/learner/collections/$collectionId"
								params={{
									collectionId: id,
								}}
								className="p-4 gap-4 flex-col flex border rounded-lg flex-1"
							>
								<Container />
								<p className="text-2xl font-bold">{name}</p>
								{description && <p>{description}</p>}
								<ConnectionStatusBadge
									connectStatus={connectStatus}
									connectType={connectType}
								/>
							</Link>
						),
					)}
				</div>
			</div>
		</Page>
	);
}
