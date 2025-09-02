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
	createUserModuleFn,
	getUserModulesByCourseFn,
} from "@/server/handlers/users.modules";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { getAuthFn } from "@/server/handlers/auth";
import { pdf } from "@react-pdf/renderer";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Eye, FileBadge2, Play } from "lucide-react";
import { useMemo } from "react";
import { isModuleSuccessful } from "@/lib/scorm";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/_public/courses/$courseId/")({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
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
			getAuthFn(),
			queryClient.ensureQueryData(
				orpc.connection.getOne.queryOptions({
					input: {
						senderType: "user",
						recipientType: "course",
						id: params.courseId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
		])
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const [team, attempts, { user }] = Route.useLoaderData();
	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	)
	const { data: connection } = useSuspenseQuery(
		orpc.connection.getOne.queryOptions({
			input: {
				senderType: "user",
				recipientType: "course",
				id: params.courseId,
			},
		}),
	)
	const t = useTranslations("Course");
	const tLearner = useTranslations("Learner");
	const tCert = useTranslations("Certificate");
	const tLocales = useTranslations("Locales");
	const locale = useLocale();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();

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
			})
		},
	})

	const createConnection = useMutation(
		orpc.connection.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.learner.course.get.queryOptions(),
				)
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "user",
							recipientType: "course",
							id: params.courseId,
						},
					}),
				)
			},
		}),
	)

	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.learner.course.get.queryOptions(),
				)
				queryClient.invalidateQueries(
					orpc.connection.getOne.queryOptions({
						input: {
							senderType: "user",
							recipientType: "course",
							id: params.courseId,
						},
					}),
				)
			},
		}),
	)

	const isSuccess = useMemo(() => {
		return attempts.length > 0
			? isModuleSuccessful({
					completionStatus: course.completionStatus,
					status: attempts[0].status,
				})
			: false
	}, [attempts]);

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
				connection={connection || undefined}
				onRequest={() =>
					createConnection.mutate({
						senderType: "user",
						recipientType: "course",
						id: course.id,
					})
				}
				onResponse={(status) => {
					updateConnection.mutate({
						senderType: "course",
						recipientType: "user",
						id: course.id,
						connectStatus: status,
					})
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
									<TableHead>
										{tLearner.moduleLocale}
									</TableHead>
									<TableHead>
										{tLearner.moduleVersion}
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
											{attempt.score &&
											attempt.score.raw !== undefined &&
											attempt.score.max !== undefined
												? attempt.score.raw +
													" / " +
													attempt.score.max
												: undefined}
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
										<TableCell className="text-nowrap">
											{attempt.module &&
												tLocales[attempt.module.locale]}
										</TableCell>
										<TableCell className="text-nowrap">
											{attempt.module &&
												attempt.module.versionNumber}
										</TableCell>
										<TableCell className="flex justify-end items-center gap-2">
											{isSuccess && (
												<>
													{user?.firstName &&
													user?.lastName ? (
														<Button
															variant="outline"
															onClick={async () => {
																let url = ""
																try {
																	const blob =
																		await pdf(
																			<Certificate
																				certificate={{
																					name:
																						user?.firstName +
																						" " +
																						user?.lastName,
																					connectTeam:
																						team,
																					contentTeam:
																						course.team,
																					course: course.name,
																					completedAt:
																						attempt.completedAt! &&
																						formatDate(
																							{
																								date: new Date(
																									attempt.completedAt!,
																								),
																								locale,
																								type: "readable",
																							},
																						),
																					t: tCert.pdf,
																				}}
																			/>,
																		).toBlob()
																	url =
																		URL.createObjectURL(
																			blob,
																		)

																	const response =
																		await fetch(
																			url,
																		)
																	const blobData =
																		await response.blob()
																	const blobUrl =
																		window.URL.createObjectURL(
																			blobData,
																		)

																	const link =
																		document.createElement(
																			"a",
																		)
																	link.href =
																		blobUrl
																	link.download =
																		tCert.fileName
																	link.click()
																} catch (error) {
																	console.error(
																		"Error in download process:",
																		error,
																	)
																} finally {
																	if (url)
																		URL.revokeObjectURL(
																			url,
																		)
																}
															}}
														>
															<FileBadge2 />
															{tCert.download}
														</Button>
													) : (
														<Button
															variant="outline"
															onClick={() => {
																navigate({
																	to: ".",
																	search: {
																		accountDialog: true,
																	},
																})
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
												{attempt.completedAt ? (
													<>
														<Eye className="size-3.5" />
														{t.review}
													</>
												) : (
													<>
														<Play className="size-3.5" />
														{t.continue}
													</>
												)}
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
	)
}
