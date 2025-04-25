import { Certificate } from "@/components/Certificate";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
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
import {
	getConnectionFn,
	requestConnectionFn,
	updateUserConnectionFn,
} from "@/server/handlers/connections";
import { getCourseFn } from "@/server/handlers/courses";
import {
	createUserModuleFn,
	getUserModulesByCourseFn,
} from "@/server/handlers/users.modules";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { getAuthFn } from "@/server/handlers/auth";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useMutation } from "@tanstack/react-query";
import {
	ClientOnly,
	createFileRoute,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { AlertCircle, Award, Play } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/")({
	component: RouteComponent,
	loader: ({ params }) => {
		return Promise.all([
			getCourseFn({ data: { courseId: params.courseId } }),
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			getUserModulesByCourseFn({
				data: {
					courseId: params.courseId,
				},
			}),
			getConnectionFn({
				data: { type: "course", id: params.courseId },
			}),
			getAuthFn(),
		]);
	},
});

function RouteComponent() {
	const [course, team, attempts, connection, { user }] =
		Route.useLoaderData();
	const t = useTranslations("Course");
	const tLearner = useTranslations("Learner");
	const tCert = useTranslations("Certificate");
	const locale = useLocale();
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const router = useRouter();

	const createAttempt = useMutation({
		mutationFn: createUserModuleFn,
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
	const requestConnection = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const connectionResponse = useMutation({
		mutationFn: updateUserConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Page>
			<PageHeader
				title={course.name}
				description={course.description}
				UnderTitle={
					<ContentBranding
						contentTeam={course.team}
						connectTeam={team}
					/>
				}
			>
				{connection && (
					<ConnectionStatusBadge hideOnSuccess {...connection} />
				)}
			</PageHeader>
			<ConnectionWrapper
				name={course.name}
				connection={connection}
				onRequest={() =>
					requestConnection.mutate({
						data: {
							type: "course",
							id: course.id,
						},
					})
				}
				onResponse={(status) => {
					connectionResponse.mutate({
						data: {
							type: "course",
							id: course.id,
							connectStatus: status,
						},
					});
				}}
			>
				{attempts.length > 0 ? (
					<div className="flex flex-col gap-4">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{tLearner.status}</TableHead>
									<TableHead>{tLearner.score}</TableHead>
									<TableHead>{tLearner.startedAt}</TableHead>
									<TableHead>
										{tLearner.completedAt}
									</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{attempts.map((attempt) => (
									<TableRow key={attempt.id}>
										<TableCell>
											{tLearner.statuses[attempt.status]}
										</TableCell>
										<TableCell>
											{["failed", "passed"].includes(
												attempt.status,
											) &&
												attempt.score.raw +
													" / " +
													attempt.score.max}
										</TableCell>
										<TableCell className="text-nowrap">
											{attempt.createdAt &&
												formatDate({
													date: new Date(
														attempt.createdAt,
													),
													locale,
													type: "detailed",
												})}
										</TableCell>
										<TableCell className="text-nowrap">
											{attempt.completedAt &&
												formatDate({
													date: new Date(
														attempt.completedAt,
													),
													locale,
													type: "detailed",
												})}
										</TableCell>
										<TableCell className="flex justify-end items-center gap-2">
											{attempt.completedAt && (
												<>
													{user?.firstName &&
													user?.lastName ? (
														<ClientOnly
															fallback={
																<Button
																	variant="outline"
																	disabled
																>
																	<Award />
																	{
																		tCert.download
																	}
																</Button>
															}
														>
															<PDFDownloadLink
																fileName={`${tCert.fileName}`}
																document={
																	<Certificate
																		certificate={{
																			name:
																				user?.firstName +
																				" " +
																				user?.lastName,
																			teamName:
																				team.name,
																			course: course.name,
																			completedAt:
																				attempt.completedAt &&
																				formatDate(
																					{
																						date: new Date(
																							attempt.completedAt,
																						),
																						locale,
																						type: "readable",
																					},
																				),
																			t: tCert.pdf,
																		}}
																	/>
																}
																className={buttonVariants(
																	{
																		variant:
																			"outline",
																	},
																)}
															>
																<Award />
																{tCert.download}
															</PDFDownloadLink>
														</ClientOnly>
													) : (
														<Button
															variant="outline"
															onClick={() => {
																navigate({
																	to: ".",
																	search: {
																		accountDialog:
																			true,
																	},
																});
															}}
														>
															<AlertCircle />
															{tCert["no-name"]}
														</Button>
													)}
												</>
											)}
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
												<Play className="size-3.5" />
												{t.continue}
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
						{t.start}
					</Button>
				)}
			</ConnectionWrapper>
		</Page>
	);
}
