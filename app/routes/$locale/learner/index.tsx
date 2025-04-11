import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import {
	FloatingPage,
	Page,
	PageHeader,
	PageSubHeader,
} from "@/components/Page";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getAuthFn } from "@/server/handlers/user";
import { UserToCourseType } from "@/types/connections";
import { Course, CourseTranslation } from "@/types/course";
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

const CourseComponent = ({
	course,
	connection,
}: {
	course: Course & CourseTranslation;
	connection?: UserToCourseType;
}) => {
	return (
		<Link
			to="/$locale/learner/courses/$courseId"
			from={Route.fullPath}
			params={{
				courseId: course.id,
			}}
			className="w-full rounded-lg p-4 border flex flex-col gap-4"
		>
			<PageSubHeader title={course.name} description={course.description}>
				{connection && <ConnectionStatusBadge {...connection} />}
			</PageSubHeader>
		</Link>
	);
};

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
					<CourseComponent
						key={connection.courseId}
						course={connection.course}
						connection={connection}
					/>
				))}
			</div>
			<div className="flex flex-col gap-4">
				<h3>Collections</h3>
				<div className="flex flex-row gap-4">
					{collections?.map((connection) => (
						<div
							key={connection.collectionId}
							className="w-full rounded-lg p-4 border flex flex-col gap-4"
						>
							<PageSubHeader
								title={connection.collection.name}
								description={connection.collection.description}
							>
								<ConnectionStatusBadge {...connection} />
							</PageSubHeader>
							{connection.collection.courses.map((course) => (
								<CourseComponent
									key={course.id}
									course={course}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</Page>
	);
}
