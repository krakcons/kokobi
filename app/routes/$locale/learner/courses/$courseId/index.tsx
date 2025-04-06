import { FloatingPage, PageHeader } from "@/components/Page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { getCollectionFn } from "@/server/handlers/collections";
import { getAttemptsFn, getConnectionFn } from "@/server/handlers/connections";
import { getCourseFn } from "@/server/handlers/courses";
import { createAttemptFn } from "@/server/handlers/learners";
import { getTeamByIdFn } from "@/server/handlers/teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, Container } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const connection = await getConnectionFn({
			data: { type: "course", id: params.courseId },
		});

		if (!connection) {
			throw redirect({
				to: "/$locale/learner/courses/$courseId/request",
				params: {
					courseId: params.courseId,
				},
			});
		}

		if (
			connection.connectType === "invite" &&
			connection.connectStatus === "pending"
		) {
			throw redirect({
				to: "/$locale/learner/courses/$courseId/invite",
				params: {
					courseId: params.courseId,
				},
			});
		}

		if (
			connection.connectType === "request" &&
			connection.connectStatus === "pending"
		) {
			throw redirect({
				to: "/$locale/learner/courses/$courseId/request",
				params: {
					courseId: params.courseId,
				},
			});
		}

		return Promise.all([
			getCourseFn({ data: { courseId: params.courseId } }),
			getTeamByIdFn({
				data: {
					teamId: connection.teamId,
				},
			}),
			getAttemptsFn({
				data: {
					courseId: params.courseId,
					teamId: connection.teamId,
				},
			}),
			connection.collection &&
				getCollectionFn({ data: { id: connection.collectionId } }),
		]);
	},
});

function RouteComponent() {
	const [course, team, attempts, collection] = Route.useLoaderData();
	const t = useTranslations("Learner");
	const locale = useLocale();
	const navigate = Route.useNavigate();
	const params = Route.useParams();

	const createAttempt = useMutation({
		mutationFn: createAttemptFn,
		onSuccess: (attemptId) => {
			navigate({
				to: `/$locale/learner/courses/$courseId/play`,
				params: {
					courseId: params.courseId,
				},
				search: {
					attemptId,
				},
			});
		},
	});

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
					title={course.name}
					description={course.description}
				/>
				{attempts.length > 0 ? (
					<div className="flex flex-col gap-4">
						<h3>Attempts</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Score</TableHead>
									<TableHead>Started At</TableHead>
									<TableHead>Completed At</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{attempts.map((attempt) => (
									<TableRow key={attempt.id}>
										<TableCell>
											{t.statuses[attempt.status]}
										</TableCell>
										<TableCell>
											{attempt.score.raw +
												" / " +
												attempt.score.max}
										</TableCell>
										<TableCell>
											{attempt.startedAt &&
												formatDate({
													date: new Date(
														attempt.startedAt,
													),
													locale,
													type: "detailed",
												})}
										</TableCell>
										<TableCell>
											{attempt.completedAt &&
												formatDate({
													date: new Date(
														attempt.completedAt,
													),
													locale,
													type: "detailed",
												})}
										</TableCell>
										<TableCell>
											<Link
												to="/$locale/learner/courses/$courseId/play"
												params={{
													courseId: course.id,
													locale,
												}}
												search={{
													attemptId: attempt.id,
												}}
												className={buttonVariants()}
											>
												Continue
											</Link>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<Button
						onClick={() =>
							createAttempt.mutate({
								data: {
									courseId: course.id,
								},
							})
						}
					>
						Start Course
					</Button>
				)}
				{collection && (
					<>
						<h3>Collection</h3>
						<Link
							key={collection.id}
							to="/$locale/learner/collections/$collectionId"
							params={{
								collectionId: collection.id,
							}}
							className="p-4 gap-4 flex-col flex border rounded-lg"
						>
							<Container />
							<p className="text-2xl font-bold">
								{collection.name}
							</p>
							{collection.description && (
								<p>{collection.description}</p>
							)}
						</Link>
					</>
				)}
			</div>
		</FloatingPage>
	);
}
