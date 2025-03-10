import { JoinCourseForm } from "@/components/forms/JoinCourseForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FloatingPage, PageHeader } from "@/components/Page";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/join",
)({
	component: RouteComponent,
	validateSearch: z.object({
		learnerId: z.string().optional(),
	}),
	loaderDeps: ({ search: { learnerId } }) => ({ learnerId }),
	loader: async ({ context: { queryClient }, params, deps }) => {
		await Promise.all([
			queryClient.ensureQueryData(
				queryOptions.modules.all({
					param: {
						id: params.courseId,
					},
				}),
			),
			queryClient.ensureQueryData(
				queryOptions.courses.id({
					param: {
						id: params.courseId,
					},
				}),
			),
		]);

		const learnerId = deps.learnerId;
		if (learnerId) {
			const learner = await queryClient.ensureQueryData(
				queryOptions.learners.id({
					param: {
						id: params.courseId,
						learnerId,
					},
				}),
			);
			if (learner.module) {
				redirect({
					from: "/$locale/play/$teamId/courses/$courseId/join",
					to: "/$locale/play/$teamId/courses/$courseId",
					search: () => ({
						learnerId,
					}),
					params: (p) => p,
				});
			}
		}
	},
});

function RouteComponent() {
	const locale = useLocale();
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data: moduleOptions } = useSuspenseQuery(
		queryOptions.modules.all({
			param: {
				id: params.courseId,
			},
		}),
	);
	const { data: course } = useSuspenseQuery(
		queryOptions.courses.id({
			param: {
				id: params.courseId,
			},
		}),
	);
	const { data: learner } = useQuery({
		...queryOptions.learners.id({
			param: {
				id: params.courseId,
				learnerId: search.learnerId!,
			},
		}),
		enabled: !!search.learnerId,
	});

	const mutationOptions = useMutationOptions();
	const joinCourse = useMutation(mutationOptions.course.join);

	return (
		<FloatingPage>
			<div className="max-w-lg w-full flex flex-col gap-4">
				<LanguageToggle />
				<PageHeader
					title={course.name}
					description={course.description}
				/>
				<JoinCourseForm
					onSubmit={async (value) =>
						joinCourse.mutateAsync(
							{
								json: value,
								param: {
									id: params.courseId,
								},
							},
							{
								onSuccess(data) {
									navigate({
										to: "/$locale/play/$teamId/courses/$courseId",
										search: {
											learnerId: data.learnerId,
										},
										params: (p) => p,
									});
								},
							},
						)
					}
					moduleOptions={moduleOptions}
					defaultValues={{
						firstName: "",
						lastName: "",
						email: "",
						...learner,
						moduleId:
							moduleOptions.find((o) => o.language === locale)
								?.id ?? moduleOptions[0].id,
					}}
				/>
			</div>
		</FloatingPage>
	);
}
