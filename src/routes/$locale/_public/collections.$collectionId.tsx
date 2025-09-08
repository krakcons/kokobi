import { ContentBranding } from "@/components/ContentBranding";
import { Page } from "@/components/Page";
import { PublicCourseCard, PublicPageHeader } from "@/components/PublicPage";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/_public/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			queryClient.ensureQueryData(
				orpc.collection.id.queryOptions({
					input: { id: params.collectionId },
				}),
			),
			queryClient.ensureQueryData(
				orpc.collection.courses.get.queryOptions({
					input: { id: params.collectionId },
				}),
			),
		]);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const [team] = Route.useLoaderData();
	const t = useTranslations("Public");

	const { data: collection } = useSuspenseQuery(
		orpc.collection.id.queryOptions({
			input: { id: params.collectionId },
		}),
	);
	const { data: courses } = useSuspenseQuery(
		orpc.collection.courses.get.queryOptions({
			input: { id: params.collectionId },
		}),
	);

	return (
		<Page>
			<PublicPageHeader
				title={collection.name}
				description={collection.description}
			>
				<ContentBranding
					contentTeam={collection.team}
					connectTeam={team}
				/>
			</PublicPageHeader>
			<div className="pl-24 flex-col">
				<h3 className="pb-4">{t.courses}</h3>
				{courses.map((course) => (
					<PublicCourseCard
						key={course.id}
						{...course}
						type="course"
					/>
				))}
			</div>
		</Page>
	);
}
