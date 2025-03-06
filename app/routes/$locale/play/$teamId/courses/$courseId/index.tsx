import { createFileRoute } from "@tanstack/react-router";
import LMSProvider from "@/components/LMSProvider";
import { queryOptions } from "@/lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Learner } from "@/types/learner";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/",
)({
	component: RouteComponent,
	validateSearch: z.object({
		learnerId: z.string(),
	}),
	loaderDeps: ({ search: { learnerId } }) => ({ learnerId }),
	loader: async ({ context: { queryClient }, params, deps }) => {
		await queryClient.ensureQueryData(
			queryOptions.courses.id({
				param: { id: params.courseId },
			}),
		);
		await queryClient.ensureQueryData(
			queryOptions.learners.play({
				param: {
					id: params.courseId,
					learnerId: deps.learnerId,
				},
			}),
		);
	},
});

function RouteComponent() {
	const { courseId } = Route.useParams();
	const search = Route.useSearch();
	const { data: course } = useSuspenseQuery(
		queryOptions.courses.id({
			param: { id: courseId },
		}),
	);
	const {
		data: { learner, url, type },
	} = useSuspenseQuery(
		queryOptions.learners.play({
			param: {
				id: courseId,
				learnerId: search.learnerId,
			},
		}),
	);

	return (
		<main className="flex h-screen w-full flex-col">
			<div className="flex flex-1 flex-row">
				<LMSProvider
					type={type}
					learner={learner as Learner}
					url={url}
					course={course.name}
				/>
			</div>
		</main>
	);
}
