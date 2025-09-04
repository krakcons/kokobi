import { PublicPageHeader, PublicTeamBranding } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/_public/courses/$courseId/")({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
		]);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const t = useTranslations("Course");

	return (
		<div className="mt-4">
			<PublicPageHeader
				title={course.name}
				description={course.description}
			>
				<PublicTeamBranding contentTeam={course.team} />
			</PublicPageHeader>
			<div className="pl-24">
				<Link
					id={course.id}
					to="/$locale/learner/courses/$courseId"
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{t.view}
				</Link>
			</div>
		</div>
	);
}
