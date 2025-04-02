import { JoinCourseForm } from "@/components/forms/JoinCourseForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FloatingPage, PageHeader } from "@/components/Page";
import { useLocale } from "@/lib/locale";
import { getModulesFn } from "@/server/handlers/modules";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getCourseFn } from "@/server/handlers/courses";
import { getLearnerFn, joinCourseFn } from "@/server/handlers/learners";

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
			queryClient.ensureQueryData({
				queryKey: [getModulesFn.url, params.courseId],
				queryFn: () =>
					getModulesFn({ data: { courseId: params.courseId } }),
			}),
			queryClient.ensureQueryData({
				queryKey: [getCourseFn.url, params.courseId],
				queryFn: () =>
					getCourseFn({
						data: {
							id: params.courseId,
						},
					}),
			}),
		]);

		const learnerId = deps.learnerId;
		if (learnerId) {
			const learner = await queryClient.ensureQueryData({
				queryKey: [getLearnerFn.url, params.courseId, learnerId],
				queryFn: () =>
					getLearnerFn({
						data: {
							courseId: params.courseId,
							learnerId,
						},
					}),
			});
			if (learner.moduleId) {
				throw redirect({
					from: "/$locale/play/$teamId/courses/$courseId/join",
					to: "/$locale/play/$teamId/courses/$courseId",
					search: () => ({
						learnerId,
					}),
					params: (p) => p,
					reloadDocument: true,
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
	const { data: moduleOptions } = useSuspenseQuery({
		queryKey: [getModulesFn.url, params.courseId],
		queryFn: () => getModulesFn({ data: { courseId: params.courseId } }),
	});
	const { data: course } = useSuspenseQuery({
		queryKey: [getCourseFn.url, params.courseId],
		queryFn: () =>
			getCourseFn({
				data: {
					id: params.courseId,
				},
			}),
	});
	const { data: learner } = useQuery({
		queryKey: [getLearnerFn.url, params.courseId, search.learnerId!],
		queryFn: () =>
			getLearnerFn({
				data: {
					courseId: params.courseId,
					learnerId: search.learnerId!,
				},
			}),
		enabled: !!search.learnerId,
	});

	const joinCourse = useMutation({
		mutationFn: joinCourseFn,
	});

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
								data: { ...value, courseId: params.courseId },
							},
							{
								onSuccess(data) {
									navigate({
										to: "/$locale/play/$teamId/courses/$courseId",
										search: {
											learnerId: data.learnerId,
										},
										params: (p) => p,
										reloadDocument: true,
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
