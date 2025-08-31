import { TableSearchSchema } from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
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
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const { data: connection } = useSuspenseQuery(
		orpc.connection.getOne.queryOptions({
			input: {
				senderType: "team",
				recipientType: "course",
				id: params.courseId,
			},
		}),
	);

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: (_, { connectStatus }) => {
				queryClient.invalidateQueries(orpc.course.get.queryOptions());
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "team",
							recipientType: "course",
							id: params.courseId,
						},
					}),
				);
				if (connectStatus === "accepted") {
					navigate({
						to: `/$locale/admin/courses/$courseId/learners`,
						params,
					});
				}
			},
		}),
	);
	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(orpc.course.get.queryOptions());
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "team",
							recipientType: "course",
							id: params.courseId,
						},
					}),
				);
			},
		}),
	);

	return (
		<Page>
			<PageHeader title={course.name} description={course.description} />
			<ConnectionWrapper
				name={course.name}
				connection={connection || undefined}
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
