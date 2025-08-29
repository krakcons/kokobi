import { TableSearchSchema } from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
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
			queryClient.ensureQueryData(
				orpc.connection.getOne.queryOptions({
					input: {
						senderType: "team",
						recipientType: "course",
						id: params.courseId,
					},
				}),
			),
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

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);
	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);

	return (
		<Page>
			<PageHeader title={course.name} description={course.description} />
			<ConnectionWrapper
				name={course.name}
				connection={connection}
				onRequest={() =>
					createConnection.mutate({
						senderType: "team",
						recipientType: "course",
						id: course.id,
					})
				}
				onResponse={(response) =>
					updateConnection.mutate({
						senderType: "course",
						recipientType: "team",
						id: course.id,
						connectToId: connection!.fromTeamId,
						connectStatus: response,
					})
				}
			>
				<></>
			</ConnectionWrapper>
		</Page>
	);
}
