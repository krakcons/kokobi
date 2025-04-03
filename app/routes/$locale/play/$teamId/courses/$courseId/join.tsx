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
	loader: async ({ params, deps }) => {
		const learnerId = deps.learnerId;
		let learner = undefined;
		if (learnerId) {
			learner = await getLearnerFn({
				data: {
					courseId: params.courseId,
					learnerId,
				},
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

		const moduleOptions = await getModulesFn({
			data: {
				courseId: params.courseId,
			},
		});

		if (!moduleOptions.length) {
			throw new Error("No modules available");
		}

		return Promise.all([
			learner,
			moduleOptions,
			getCourseFn({
				data: {
					courseId: params.courseId,
				},
			}),
		]);
	},
});

function RouteComponent() {
	const locale = useLocale();
	const params = Route.useParams();
	const navigate = Route.useNavigate();
	const [learner, moduleOptions, course] = Route.useLoaderData();

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
