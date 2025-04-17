import { ConnectionComponent } from "@/components/ConnectionComponent";
import { Page, PageHeader } from "@/components/Page";
import { getConnectionsFn } from "@/server/handlers/connections";
import { UserToCourseType } from "@/types/connections";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/learner/")({
	component: RouteComponent,
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
				{courses?.map((connection) => (
					<ConnectionComponent
						key={connection.courseId}
						{...connection.course}
						type="course"
						connection={connection}
					/>
				))}
			</div>
			<div className="flex flex-col gap-4">
				<h3>Collections</h3>
				<div className="flex flex-row gap-4">
					{collections?.map((connection) => (
						<ConnectionComponent
							key={connection.collectionId}
							{...connection.collection}
							type="collection"
							connection={connection}
						/>
					))}
				</div>
			</div>
		</Page>
	);
}
