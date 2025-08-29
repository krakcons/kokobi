import { TableSearchSchema } from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	createTeamConnectionFn,
	getTeamCourseConnectionFn,
	updateTeamConnectionFn,
} from "@/server/handlers/connections";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/admin/courses/$courseId/")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params, context: { queryClient } }) => {
		const [team, course, connection] = await Promise.all([
			getUserTeamFn({
				data: {
					type: "admin",
				},
			}),
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
			getTeamCourseConnectionFn({
				data: {
					type: "to",
					courseId: params.courseId,
				},
			}),
		]);

		const access = team.id === course.teamId ? "root" : "shared";

		if (access === "root" || connection?.connectStatus === "accepted") {
			throw redirect({
				to: `/$locale/admin/courses/$courseId/learners`,
				params,
			});
		}

		return { team, course, connection };
	},
});

function RouteComponent() {
	const { course, connection } = Route.useLoaderData();
	const router = useRouter();

	const respondToConnection = useMutation({
		mutationFn: updateTeamConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const requestConnection = useMutation({
		mutationFn: createTeamConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Page>
			<PageHeader title={course.name} description={course.description} />
			<ConnectionWrapper
				name={course.name}
				connection={connection}
				onRequest={() =>
					requestConnection.mutate({
						data: {
							connectType: "request",
							type: "course",
							id: course.id,
							teamIds: [course.teamId],
						},
					})
				}
				onResponse={(response) =>
					respondToConnection.mutate({
						data: {
							type: "course-to-team",
							id: course.id,
							toId: connection!.fromTeamId,
							connectStatus: response,
						},
					})
				}
			>
				<></>
			</ConnectionWrapper>
		</Page>
	);
}
