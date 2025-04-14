import { ConnectionActions } from "@/components/ConnectionActions";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import {
	getConnectionsFn,
	userConnectionResponseFn,
} from "@/server/handlers/connections";
import { ConnectionType, UserToCourseType } from "@/types/connections";
import { Course, CourseTranslation } from "@/types/course";
import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";

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

const CourseComponent = ({
	course,
	connection,
	disabled,
}: {
	course: Course & CourseTranslation;
	connection?: UserToCourseType;
	disabled?: boolean;
}) => {
	const router = useRouter();
	const { mutate: userConnectionResponse } = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Link
			to="/$locale/learner/courses/$courseId"
			from={Route.fullPath}
			params={{
				courseId: course.id,
			}}
			className="w-full rounded-lg p-4 border flex flex-col gap-4"
			disabled={disabled}
		>
			<PageSubHeader title={course.name} description={course.description}>
				{connection && (
					<div className="flex gap-2 items-center">
						<ConnectionStatusBadge {...connection} />
						{connection.connectStatus === "pending" && (
							<ConnectionActions
								connection={connection}
								onSubmit={(connectStatus) => {
									userConnectionResponse({
										data: {
											type: "course",
											id: course.id,
											teamId: connection.teamId,
											connectStatus,
										},
									});
								}}
							/>
						)}
					</div>
				)}
			</PageSubHeader>
		</Link>
	);
};

function RouteComponent() {
	const [courses, collections] = Route.useLoaderData();
	const router = useRouter();
	const { mutate: userConnectionResponse } = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

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
						disabled={connection?.connectStatus !== "accepted"}
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
								<div className="flex gap-2 items-center">
									<ConnectionStatusBadge {...connection} />
									{connection.connectStatus === "pending" && (
										<ConnectionActions
											connection={connection}
											onSubmit={(connectStatus) => {
												userConnectionResponse({
													data: {
														type: "collection",
														id: connection
															.collection.id,
														teamId: connection.teamId,
														connectStatus,
													},
												});
											}}
										/>
									)}
								</div>
							</PageSubHeader>
							{connection.collection.courses.map((course) => (
								<CourseComponent
									key={course.id}
									course={course}
									disabled={
										connection?.connectStatus !== "accepted"
									}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</Page>
	);
}
